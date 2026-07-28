const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

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
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin
router.post("/", auth, admin, createProduct);
router.put("/:id", auth, admin, updateProduct);
router.patch("/:id/toggle-featured", auth, admin, toggleFeatured);
router.patch("/:id/toggle-new-arrival", auth, admin, toggleNewArrival);
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;