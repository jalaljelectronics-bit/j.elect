const prisma = require("../prisma/client");

// =============================
// GET SUBCATEGORIES (optionally filtered by category) ve
// =============================
exports.getSubcategories = async (req, res) => {
    try {
        const { categoryId } = req.query;

        const where = {};
        if (categoryId) where.categoryId = Number(categoryId);

        const subcategories = await prisma.subcategory.findMany({
            where,
            orderBy: { name: "asc" },
            include: { category: true }
        });

        res.json({ subcategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// GET SINGLE SUBCATEGORY
// =============================
exports.getSubcategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const subcategory = await prisma.subcategory.findUnique({
            where: { id: Number(id) },
            include: { category: true }
        });

        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }

        res.json({ subcategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// CREATE SUBCATEGORY (Admin)
// =============================
exports.createSubcategory = async (req, res) => {
    try {
        const { name, categoryId, imageUrl } = req.body;

        if (!name || !categoryId) {
            return res.status(400).json({ message: "Name and categoryId are required." });
        }

        const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name: name.trim(),
                categoryId: Number(categoryId),
                imageUrl: imageUrl || null
            }
        });

        res.status(201).json({
            message: "Subcategory created successfully.",
            subcategory
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "This subcategory already exists under the selected category." });
        }
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// UPDATE SUBCATEGORY (Admin)
// =============================
exports.updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, categoryId, imageUrl } = req.body;

        const subcategory = await prisma.subcategory.update({
            where: { id: Number(id) },
            data: {
                name: name?.trim(),
                categoryId: categoryId ? Number(categoryId) : undefined,
                imageUrl
            }
        });

        res.json({
            message: "Subcategory updated successfully.",
            subcategory
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "This subcategory already exists under the selected category." });
        }
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
// DELETE SUBCATEGORY (Admin)
// =============================
exports.deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.subcategory.delete({ where: { id: Number(id) } });

        res.json({ message: "Subcategory deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
