const prisma = require("../prisma/client");
const { invalidateResource } = require("../utils/cacheInvalidation");

// Create Category
exports.createCategory = async (req, res) => {
    try {
        const { name, imageUrl } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const existingCategory = await prisma.category.findUnique({
            where: {
                name: name.trim()
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: "Category already exists."
            });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                imageUrl: imageUrl ? imageUrl.trim() : null
            }
        });

        res.status(201).json({
            message: "Category created successfully.",
            category
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

// Get All Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "asc"
            }
        });

        res.json(categories);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

// Get Category By ID
exports.getCategoryById = async (req, res) => {
    try {

        const id = parseInt(req.params.id);

        const category = await prisma.category.findUnique({
            where: {
                id
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.json(category);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

// Update Category
exports.updateCategory = async (req, res) => {

    try {

        const id = parseInt(req.params.id);
        const { name, imageUrl } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const category = await prisma.category.findUnique({
            where: {
                id
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        const duplicate = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                NOT: {
                    id
                }
            }
        });

        if (duplicate) {
            return res.status(400).json({
                message: "Another category with this name already exists."
            });
        }

        const updatedCategory = await prisma.category.update({
            where: {
                id
            },
            data: {
                name: name.trim(),
                imageUrl: imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : null) : category.imageUrl
            }
        });

        res.json({
            message: "Category updated successfully.",
            updatedCategory
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// Delete Category
exports.deleteCategory = async (req, res) => {

    try {

        const id = parseInt(req.params.id);

        const category = await prisma.category.findUnique({
            where: {
                id
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        await prisma.category.delete({
            where: {
                id
            }
        });

        res.json({
            message: "Category deleted successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};
