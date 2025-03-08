const express = require("express");
const { addTeamMember, getTeamMembers, deleteTeamMember } = require("../controllers/teamController");

const router = express.Router();  // Make sure you are using the Router object correctly

router.post("/", addTeamMember);
router.get("/", getTeamMembers);
router.delete("/:id", deleteTeamMember);

module.exports = router;  // Export the router correctly
