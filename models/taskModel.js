const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, },
  content: { type: String, },
  comments: { type: String, },
  option: { type: String, },
  deadline: { type: Date, required: true },
  uploadDateTime: { type: Date,  },
  priority: { type: String, required: true },
  status: { type: String, default: "Pending" },
  client: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" },
  assignedToName: { type: String, required: true },
  assignedToRole: { type: String, },
});

module.exports = mongoose.model("Task", taskSchema);
