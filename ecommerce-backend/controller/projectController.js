const prisma = require("../prisma/client");
const { triggerFrontendRedeploy } = require("../utils/deployHook");

const VALID_QUERY_STATUSES = ["Unread", "Read", "Resolved"];

// Normalize whatever the client sends for linkedProducts into a predictable
// array of { id, productId, label, url } objects. `productId` is the real
// numeric Product id from the database — it is what the storefront uses to
// build the /product/:id link, so it must survive the round-trip.
const cleanLinks = (linkedProducts) => {
    if (!Array.isArray(linkedProducts)) return [];

    return linkedProducts
        .filter((l) => l && (l.label || l.url || l.productId))
        .map((l, i) => ({
            id: String(l.id || `link-${Date.now()}-${i}`),
            productId: l.productId != null && l.productId !== "" ? String(l.productId) : "",
            label: String(l.label || "").trim(),
            url: String(l.url || "").trim()
        }));
};


// =============================
// GET ALL PROJECTS
// =============================
exports.getProjects = async (req, res) => {
    try {
        const { category, status, page = 1, limit = 20 } = req.query;

        const where = {};

        // "Both" projects should surface under either the Commercial or University tab
        if (category === 'Commercial' || category === 'University') {
            where.category = { in: [category, 'Both'] };
        } else if (category) {
            where.category = category;
        }

        if (status) where.status = status;

        const skip = (page - 1) * limit;

        const projects = await prisma.project.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: Number(skip),
            take: Number(limit)
        });

        const total = await prisma.project.count({ where });

        res.json({
            projects,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalProjects: total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// GET SINGLE PROJECT
// =============================
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = Number(id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// CREATE PROJECT (Admin)
// =============================
exports.createProject = async (req, res) => {
    try {
        const {
            title, category, status, price, imageUrl,
            isFeatured, isNewArrival, githubUrl,
            introDescription, introImageUrl, sections, completionDate,
            linkedProducts
        } = req.body;

        if (!title || !category) {
            return res.status(400).json({ message: "Title and category are required" });
        }

        const project = await prisma.project.create({
            data: {
                title,
                category,
                status: status || "In Progress",
                price: price ? Number(price) : 0,
                imageUrl: imageUrl || null,
                isFeatured: Boolean(isFeatured),
                isNewArrival: Boolean(isNewArrival),
                githubUrl: githubUrl || null,
                introDescription: introDescription || null,
                introImageUrl: introImageUrl || null,
                sections: sections || [],
                linkedProducts: cleanLinks(linkedProducts),
                completionDate: completionDate ? new Date(completionDate) : null
            }
        });

        // New project is live immediately client-side; trigger a redeploy so
        // it also gets prerendered with correct SEO tags on the next build.
        triggerFrontendRedeploy();

        res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// =============================
// UPDATE PROJECT (Admin)
// =============================
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = Number(id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const {
            title, category, status, price, imageUrl,
            isFeatured, isNewArrival, githubUrl,
            introDescription, introImageUrl, sections, completionDate,
            linkedProducts
        } = req.body;

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                title,
                category,
                status,
                price: price !== undefined ? Number(price) : undefined,
                imageUrl,
                isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
                isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : undefined,
                githubUrl,
                introDescription,
                introImageUrl,
                sections,
                linkedProducts: linkedProducts !== undefined ? cleanLinks(linkedProducts) : undefined,
                completionDate: completionDate ? new Date(completionDate) : undefined
            }
        });

        // Content/meta may have changed — redeploy so the prerendered page
        // for this project picks up the new title/description/images.
        triggerFrontendRedeploy();

        res.json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Project not found" });
        }
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// DELETE PROJECT (Admin)
// =============================
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = Number(id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        await prisma.project.delete({
            where: { id: projectId }
        });

        // A deleted project's URL should stop existing on the live site too —
        // otherwise Google (and visitors) keep seeing a stale prerendered
        // page for a route that no longer resolves.
        triggerFrontendRedeploy();

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Project not found" });
        }
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// GET QUERIES FOR A PROJECT (Admin)
// =============================
exports.getProjectQueries = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = Number(id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const queries = await prisma.projectQuery.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ queries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// SUBMIT A QUERY ON A PROJECT (Public)
// =============================
exports.createProjectQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = Number(id);
        const { clientName, clientEmail, clientPhone, message } = req.body;

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        if (!clientName?.trim() || !clientEmail?.trim() || !message?.trim()) {
            return res.status(400).json({ message: "Name, email, and message are required" });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const query = await prisma.projectQuery.create({
            data: {
                projectId,
                clientName: clientName.trim(),
                clientEmail: clientEmail.trim(),
                clientPhone: clientPhone?.trim() || null,
                message: message.trim()
            }
        });

        res.status(201).json({ message: "Query submitted successfully", query });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// UPDATE QUERY STATUS (Admin)
// =============================
exports.updateQueryStatus = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { status } = req.body;
        const id = Number(queryId);

        if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid query id" });
        }

        if (!VALID_QUERY_STATUSES.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${VALID_QUERY_STATUSES.join(', ')}` });
        }

        const query = await prisma.projectQuery.update({
            where: { id },
            data: { status }
        });

        res.json({ query });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Query not found" });
        }
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};