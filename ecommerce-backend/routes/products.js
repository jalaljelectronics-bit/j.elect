const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const cacheMiddleware = require("../middleware/cache");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    toggleFeatured,
    toggleNewArrival
} = require("../controller/productController");

// Public
router.get("/", cacheMiddleware('products', 300), getProducts);
router.get("/:id", cacheMiddleware('product', 900), getProductById);

// Admin
router.post("/", auth, admin, createProduct);
router.put("/:id", auth, admin, updateProduct);
router.patch("/:id/toggle-featured", auth, admin, toggleFeatured);
router.patch("/:id/toggle-new-arrival", auth, admin, toggleNewArrival);
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;