const prisma = require("../prisma/client");
const { triggerFrontendRedeploy } = require("../utils/deployHook");
const { invalidateResource } = require("../utils/cacheInvalidation");


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
            isFeatured,
            isNewArrival
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

      const product = await prisma.product.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                stock: Number(stock),
                imageUrl,
                categoryId: Number(categoryId),
                isFeatured: Boolean(isFeatured),
                // Defaults to true on creation (Option B) — every new product
                // starts flagged as a new arrival automatically, and an admin
                // manually un-toggles it later once it's no longer "new."
                // Only overridden to false if the request explicitly sends
                // isNewArrival: false (e.g. a future bulk-import tool that
                // wants to skip this behavior).
                isNewArrival: isNewArrival === false ? false : true
            }
        });

        // Wipe the "products:*" list cache so the new product shows up on
        // the next read — no single-item cache exists yet for a
        // brand-new id.
        await invalidateResource("products");

        // New product's page is live client-side immediately; trigger a
        // redeploy so it also gets prerendered with real content + SEO
        // tags (title/description/canonical) on the next build, instead
        // of leaving it as an empty React shell until some unrelated
        // deploy happens to catch it.
        triggerFrontendRedeploy();

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
            minPrice,
            maxPrice,
            sort,
            featured,
            newArrival,
            page = 1,
            limit = 12
        } = req.query;

        // Passing limit=all from the frontend (e.g. a "view all results"
        // page) skips pagination entirely instead of guessing a large
        // number — returns every matching row in one response.
        const noLimit = limit === "all";

        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = noLimit ? undefined : Math.max(parseInt(limit) || 12, 1);
        const skip = noLimit ? undefined : (pageNum - 1) * limitNum;

        // Build dynamic WHERE clause
        const where = {};

        if (search) {
            // Split into individual words and require each one to appear
            // somewhere in name OR description. This fixes two accuracy gaps
            // the old single "contains" check had: word order no longer
            // matters ("wifi esp32" now matches "ESP32 WiFi Board"), and a
            // query can span both fields instead of only the name.
            const words = search.trim().split(/\s+/).filter(Boolean);

            if (words.length > 0) {
                where.AND = words.map((word) => ({
                    OR: [
                        { name: { contains: word, mode: "insensitive" } },
                        { description: { contains: word, mode: "insensitive" } },
                    ],
                }));
            }
        }

        if (category) {
            where.categoryId = Number(category);
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        if (featured === "true") {
            where.isFeatured = true;
        }

        if (newArrival === "true") {
            where.isNewArrival = true;
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
                ...(skip !== undefined && { skip }),
                ...(limitNum !== undefined && { take: limitNum }),
                include: {
                    category: true
                }
            })
        ]);

        const totalPages = noLimit ? 1 : Math.ceil(totalProducts / limitNum);

        res.json({
            products,
            currentPage: noLimit ? 1 : pageNum,
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
                category: true
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
            isFeatured,
            isNewArrival
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

        // categoryId must actually be present before we try to look it up —
        // Number(undefined) is NaN, and passing that into a Prisma where
        // clause throws instead of giving a clean 400. Only validate/look
        // up a new category if the request is actually trying to change it;
        // otherwise keep the product's existing category untouched.
        let resolvedCategoryId = existingProduct.categoryId;

        if (categoryId !== undefined) {
            const numericCategoryId = Number(categoryId);

            if (!categoryId || Number.isNaN(numericCategoryId)) {
                return res.status(400).json({
                    message: "A valid categoryId is required."
                });
            }

            const category = await prisma.category.findUnique({
                where: {
                    id: numericCategoryId
                }
            });

            if (!category) {
                return res.status(404).json({
                    message: "Category not found."
                });
            }

            resolvedCategoryId = numericCategoryId;
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
                categoryId: resolvedCategoryId,
                // Preserve existing flag if the request doesn't send one at all
                // (e.g. an older frontend build without the checkbox), rather
                // than silently resetting it to false on every save.
                isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existingProduct.isFeatured,
                isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : existingProduct.isNewArrival
            }
        });

        // Wipe both the "products:*" list cache and the "product:*<id>*"
        // single-item cache so the edit shows up immediately on next read.
        await invalidateResource("products", id);

        // Content (name/description/price/image) may have changed —
        // redeploy so the prerendered page for this product picks up the
        // new details rather than serving stale prerendered SEO tags.
        triggerFrontendRedeploy();

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
// Toggle Featured (quick admin action, no full form needed)
// =============================
exports.toggleFeatured = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { isFeatured: !existingProduct.isFeatured }
        });

        // This flips whether the product shows up under ?featured=true on
        // the list endpoint and on its own single-item response, both of
        // which are cached — needs invalidating even though no redeploy
        // is needed (see comment below).
        await invalidateResource("products", id);

        // Doesn't change this product's own detail-page content, but it
        // does change which products appear in the homepage's Featured
        // carousel — that's driven by data fetched at runtime, not
        // prerendered, so no redeploy needed here. Left out on purpose.

        res.json({
            message: `Product ${updatedProduct.isFeatured ? "marked as" : "removed from"} featured.`,
            product: updatedProduct
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

// =============================
// Toggle New Arrival (quick admin action, no full form needed)
// =============================
exports.toggleNewArrival = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { isNewArrival: !existingProduct.isNewArrival }
        });

        // Same reasoning as toggleFeatured above — this affects the
        // ?newArrival=true cached list response and the single-item
        // cache, so it still needs invalidating even without a redeploy.
        await invalidateResource("products", id);

        // Same reasoning as toggleFeatured above — this only affects the
        // runtime-fetched New Arrivals carousel, not this product's own
        // prerendered detail page, so no redeploy trigger here.

        res.json({
            message: `Product ${updatedProduct.isNewArrival ? "marked as" : "removed from"} new arrival.`,
            product: updatedProduct
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

        // Wipe list + single-item cache so a deleted product doesn't
        // keep being served out of Redis after it's gone from the DB.
        await invalidateResource("products", id);

        // A deleted product's URL should stop existing on the live site
        // too — otherwise Google (and visitors) keep seeing a stale
        // prerendered page for a route that no longer resolves.
        triggerFrontendRedeploy();

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