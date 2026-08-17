const express = require("express");
const router  = express.Router();

const auth  = require("../middleware/auth");
const admin = require("../middleware/admin");
const cacheMiddleware = require("../middleware/cache");

const {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost
} = require("../controller/blogController");

// Public
router.get("/",    cacheMiddleware('blogs', 1800), getBlogPosts);
router.get("/:id", cacheMiddleware('blog', 1800), getBlogPostById);

// Admin
router.post("/",     auth, admin, createBlogPost);
router.put("/:id",   auth, admin, updateBlogPost);
router.delete("/:id", auth, admin, deleteBlogPost);

module.exports = router;