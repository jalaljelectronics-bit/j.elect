const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

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
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/:id/queries", createProjectQuery);   // customer submits inquiry — no auth

// Admin
router.post("/", auth, admin, createProject);
router.put("/:id", auth, admin, updateProject);
router.delete("/:id", auth, admin, deleteProject);
router.get("/:id/queries", auth, admin, getProjectQueries);
router.patch("/queries/:queryId/status", auth, admin, updateQueryStatus);

module.exports = router;