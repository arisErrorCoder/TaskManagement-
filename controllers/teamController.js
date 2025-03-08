const TeamMember = require("../models/TeamMember"); // Assuming you're using a model for team members

// Add new team member
const addTeamMember = async (req, res) => {
  const { name, email, mobile, role } = req.body;
  try {
    const newMember = new TeamMember({ name, email, mobile, role });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all team members
const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete team member by ID
const deleteTeamMember = async (req, res) => {
  const { id } = req.params;
  try {
    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addTeamMember, getTeamMembers, deleteTeamMember };
