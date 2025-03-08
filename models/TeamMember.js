const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  role: { type: String, default: "Designer" },
  healthScore: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  unsubmittedTasks: { type: Number, default: 0 },
});

// Auto-calculate health score before saving
teamMemberSchema.pre("save", function (next) {
  if (this.totalTasks > 0) {
    this.healthScore = ((this.completedTasks / this.totalTasks) * 100).toFixed(2);
  }
  next();
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
module.exports = TeamMember;
