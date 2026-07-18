const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
    getSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
} = require("../controller/subcategoryController");

// Public
router.get("/", getSubcategories);
router.get("/:id", getSubcategoryById);

// Admin
router.post("/", auth, admin, createSubcategory);
router.put("/:id", auth, admin, updateSubcategory);
router.delete("/:id", auth, admin, deleteSubcategory);

module.exports = router;