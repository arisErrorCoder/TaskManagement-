const express = require("express");
const { getTasks, createTask, updateTask, deleteTask, deleteTasksByAssignee } = require("../controllers/taskController");

const router = express.Router();

// Route to create a task
router.post("/", createTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.delete("/assignee/:assignedTo",deleteTasksByAssignee);

module.exports = router;
