const prisma = require("../prisma/client");

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
        if (category) where.category = category;
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

        const project = await prisma.project.findUnique({
            where: { id: Number(id) }
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
        const {
            title, category, status, price, imageUrl,
            isFeatured, isNewArrival, githubUrl,
            introDescription, introImageUrl, sections, completionDate,
            linkedProducts
        } = req.body;

        const project = await prisma.project.update({
            where: { id: Number(id) },
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

        res.json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
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

        await prisma.project.delete({
            where: { id: Number(id) }
        });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
