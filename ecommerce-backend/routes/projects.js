const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const cacheMiddleware = require("../middleware/cache");

const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectQueries,
    createProjectQuery,
    updateQueryStatus
} = require("../controller/projectController");

// Public
router.get("/", cacheMiddleware('projects', 300), getProjects);
router.get("/:id", cacheMiddleware('project', 900), getProjectById);
router.post("/:id/queries", createProjectQuery);   // customer submits inquiry — no auth

// Admin
router.post("/", auth, admin, createProject);
router.put("/:id", auth, admin, updateProject);
router.delete("/:id", auth, admin, deleteProject);
router.get("/:id/queries", auth, admin, getProjectQueries);
router.patch("/queries/:queryId/status", auth, admin, updateQueryStatus);

module.exports = router;