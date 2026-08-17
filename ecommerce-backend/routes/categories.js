const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const cacheMiddleware = require("../middleware/cache");

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controller/categoryController");

// Public Routes
router.get("/", cacheMiddleware('categories', 3600), getCategories);
router.get("/:id", cacheMiddleware('category', 3600), getCategoryById);

// Admin Routes
router.post("/", auth, admin, createCategory);
router.put("/:id", auth, admin, updateCategory);
router.delete("/:id", auth, admin, deleteCategory);

module.exports = router;