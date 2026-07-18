const prisma = require("../prisma/client");

// =============================
// Create Product
// =============================
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId,
            subcategoryId
        } = req.body;

        if (
            !name ||
            !description ||
            price == null ||
            stock == null ||
            !categoryId
        ) {
            return res.status(400).json({
                message: "All required fields must be provided."
            });
        }
        if (!imageUrl || !imageUrl.startsWith("http")) {
            return res.status(400).json({
                message: "A valid image URL is required."
            });
        }
        const category = await prisma.category.findUnique({
            where: {
                id: Number(categoryId)
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        // Subcategory is optional — only validate it if one was actually provided
        if (subcategoryId) {
            const subcategory = await prisma.subcategory.findUnique({
                where: { id: Number(subcategoryId) }
            });

            if (!subcategory) {
                return res.status(404).json({ message: "Subcategory not found." });
            }

            if (subcategory.categoryId !== Number(categoryId)) {
                return res.status(400).json({
                    message: "Subcategory does not belong to the selected category."
                });
            }
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                stock: Number(stock),
                imageUrl,
                categoryId: Number(categoryId),
                subcategoryId: subcategoryId ? Number(subcategoryId) : null
            }
        });

        res.status(201).json({
            message: "Product created successfully.",
            product
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

// =============================
// Get All Products (Advanced: Search, Filter, Sort, Pagination)
// =============================
exports.getProducts = async (req, res) => {
    try {

        const {
            search,
            category,
            subcategory,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 12
        } = req.query;

        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip = (pageNum - 1) * limitNum;

        // Build dynamic WHERE clause
        const where = {};

        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive"
            };
        }

        if (category) {
            where.categoryId = Number(category);
        }

        if (subcategory) {
            where.subcategoryId = Number(subcategory);
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        // Build dynamic ORDER BY clause
        let orderBy = { createdAt: "desc" }; // default: newest first

        switch (sort) {
            case "price_asc":
                orderBy = { price: "asc" };
                break;
            case "price_desc":
                orderBy = { price: "desc" };
                break;
            case "newest":
                orderBy = { createdAt: "desc" };
                break;
            case "oldest":
                orderBy = { createdAt: "asc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
            case "name_desc":
                orderBy = { name: "desc" };
                break;
        }

        const [totalProducts, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
                include: {
                    category: true,
                    subcategory: true
                }
            })
        ]);

        const totalPages = Math.ceil(totalProducts / limitNum);

        res.json({
            products,
            currentPage: pageNum,
            totalPages,
            totalProducts
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

// =============================
// Get Product By ID
// =============================
exports.getProductById = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const product = await prisma.product.findUnique({
            where: {
                id
            },
            include: {
                category: true,
                subcategory: true
            }
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json(product);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// =============================
// Update Product
// =============================
exports.updateProduct = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const {
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId,
            subcategoryId
        } = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: {
                id
            }
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        const category = await prisma.category.findUnique({
            where: {
                id: Number(categoryId)
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        // Subcategory is optional — only validate it if one was actually provided
        if (subcategoryId) {
            const subcategory = await prisma.subcategory.findUnique({
                where: { id: Number(subcategoryId) }
            });

            if (!subcategory) {
                return res.status(404).json({ message: "Subcategory not found." });
            }

            if (subcategory.categoryId !== Number(categoryId)) {
                return res.status(400).json({
                    message: "Subcategory does not belong to the selected category."
                });
            }
        }

        if (!imageUrl || !imageUrl.startsWith("http")) {
            return res.status(400).json({
                message: "A valid image URL is required."
            });
        }
        const updatedProduct = await prisma.product.update({
            where: {
                id
            },
            data: {
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                stock: Number(stock),
                imageUrl,
                categoryId: Number(categoryId),
                subcategoryId: subcategoryId ? Number(subcategoryId) : null
            }
        });

        res.json({
            message: "Product updated successfully.",
            updatedProduct
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// =============================
// Delete Product
// =============================
exports.deleteProduct = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const product = await prisma.product.findUnique({
            where: {
                id
            }
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        await prisma.product.delete({
            where: {
                id
            }
        });

        res.json({
            message: "Product deleted successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};