// controller/blogController.js
const prisma = require("../prisma/client");
const { triggerFrontendRedeploy } = require("../utils/deployHook");
const { invalidateResource } = require("../utils/cacheInvalidation");

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
// Get All Blog Posts (Public)
// =============================
exports.getBlogPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNum  = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip     = (pageNum - 1) * limitNum;

        const [totalPosts, posts] = await Promise.all([
            prisma.blogPost.count(),
            prisma.blogPost.findMany({
                orderBy: { createdAt: "desc" },
                skip,
                take: limitNum,
                select: {
                    id:              true,
                    title:           true,
                    content:         true,
                    imageUrl:        true,
                    status:          true,
                    author:          true,
                    slug:            true,
                    metaTitle:       true,
                    metaDescription: true,
                    linkedProducts:  true,
                    createdAt:       true
                }
            })
        ]);

        res.json({
            posts,
            currentPage: pageNum,
            totalPages:  Math.ceil(totalPosts / limitNum),
            totalPosts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// Get Single Blog Post (Public)
// =============================
exports.getBlogPostById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const post = await prisma.blogPost.findUnique({ where: { id } });

        if (!post) {
            return res.status(404).json({ message: "Blog post not found." });
        }

        res.json(post);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// Create Blog Post (Admin)
// =============================
exports.createBlogPost = async (req, res) => {
    try {
        const {
            title, content, imageUrl, status, author, slug,
            metaTitle, metaDescription, linkedProducts
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required."
            });
        }

        if (imageUrl && !imageUrl.startsWith("http")) {
            return res.status(400).json({
                message: "A valid image URL is required."
            });
        }

        const post = await prisma.blogPost.create({
            data: {
                title:           title.trim(),
                content:         content.trim(),
                imageUrl:        imageUrl || null,
                status:          status || "Draft",
                author:          author || "Admin",
                slug:            slug || null,
                metaTitle:       metaTitle ? metaTitle.trim() : null,
                metaDescription: metaDescription ? metaDescription.trim() : null,
                linkedProducts:  cleanLinks(linkedProducts)
            }
        });

        // Only worth rebuilding the frontend if this post is actually
        // going live — no point burning a Vercel build on a Draft save.
        if (post.status === "Published") {
            triggerFrontendRedeploy();
        }

        res.status(201).json({
            message: "Blog post created successfully.",
            post
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// Update Blog Post (Admin)
// =============================
exports.updateBlogPost = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            title, content, imageUrl, status, author, slug,
            metaTitle, metaDescription, linkedProducts
        } = req.body;

        const post = await prisma.blogPost.findUnique({ where: { id } });

        if (!post) {
            return res.status(404).json({ message: "Blog post not found." });
        }

        const updatedPost = await prisma.blogPost.update({
            where: { id },
            data: {
                title:           title   ? title.trim()   : post.title,
                content:         content ? content.trim() : post.content,
                imageUrl:        imageUrl !== undefined       ? (imageUrl || null) : post.imageUrl,
                status:          status   !== undefined       ? status             : post.status,
                author:          author   !== undefined       ? author             : post.author,
                slug:            slug     !== undefined       ? (slug || null)     : post.slug,
                metaTitle:       metaTitle       !== undefined ? (metaTitle ? metaTitle.trim() : null)             : post.metaTitle,
                metaDescription: metaDescription !== undefined ? (metaDescription ? metaDescription.trim() : null) : post.metaDescription,
                linkedProducts:  linkedProducts !== undefined ? cleanLinks(linkedProducts) : post.linkedProducts
            }
        });

        // Redeploy if the post is (or becomes) Published — covers both
        // "edited an already-live post's content/meta" and "just flipped
        // Draft -> Published". Skips the rebuild if it's still a Draft.
        if (updatedPost.status === "Published") {
            triggerFrontendRedeploy();
        }

        res.json({
            message: "Blog post updated successfully.",
            updatedPost
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// Delete Blog Post (Admin)
// =============================
exports.deleteBlogPost = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const post = await prisma.blogPost.findUnique({ where: { id } });

        if (!post) {
            return res.status(404).json({ message: "Blog post not found." });
        }

        await prisma.blogPost.delete({ where: { id } });

        // A deleted post's URL should stop existing on the live site too —
        // otherwise Google (and visitors) keep seeing a stale prerendered
        // page for a route that no longer resolves.
        triggerFrontendRedeploy();

        res.json({ message: "Blog post deleted successfully." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};