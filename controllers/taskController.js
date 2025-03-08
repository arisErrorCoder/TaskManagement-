const Task = require("../models/taskModel");
const TeamMembers = require("../models/taskModel");
const mongoose = require("mongoose");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { calculateEmployeeStats } = require("../utils/employeeStatsUtils");

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: "gcstaff222@gmail.com", // Your email address
    pass: "ahlq ikka xths rswj", // Your email password or app-specific password
  },
});

// Function to send email
const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: "gcstaff222@gmail.com",
    to,
    subject,
    html: htmlContent, // Use HTML content for the email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

// Function to group tasks by assigned team member
const groupTasksByAssignee = (tasks) => {
  const groupedTasks = {};

  tasks.forEach((task) => {
    const assigneeEmail = task.assignedTo.email; // Assuming assignedTo has an email field
    if (!groupedTasks[assigneeEmail]) {
      groupedTasks[assigneeEmail] = [];
    }
    groupedTasks[assigneeEmail].push(task);
  });

  return groupedTasks;
};

// Function to generate HTML content for the email
const generateEmailContent = (tasks, assigneeName) => {
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #007bff;">Task Summary</h2>
      <p>Dear <strong>${assigneeName}</strong>,</p>
      <p>You have been assigned multiple tasks. Below is a summary:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  `;

  tasks.forEach((task, index) => {
    htmlContent += `
      <tr>
        <td colspan="2" style="padding: 8px; border: 1px solid #ddd; background-color: #f7f7f7;">
          <strong>🔹 Task ${index + 1}: ${task.title}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>📝 Description:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.description}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>📂 Content:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.content || "No Content"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>📅 Deadline:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.deadline ? new Date(task.deadline).toLocaleString() : "No Deadline"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>🔥 Priority:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.priority}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>📊 Status:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.status || "Pending"}</td>
      </tr>
    `;
  });

  htmlContent += `
      </table>
      <p>Please log in to your dashboard to review and manage your tasks.</p>
      <p style="margin-top: 20px;"><em>Best regards,</em><br><strong>Yatra Techs</strong></p>
    </div>
  `;

  return htmlContent;
};

// Function to check deadlines and send emails
const checkDeadlinesAndSendEmails = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Get today's date at 00:00:00

    // Find tasks with deadlines today and status NOT equal to "Completed"
    const tasks = await Task.find({
      deadline: {
        $gte: today, // Greater than or equal to today at 00:00:00
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than tomorrow at 00:00:00
      },
      status: { $ne: "Completed" }, // Exclude completed tasks
    }).populate("assignedTo");

    if (tasks.length === 0) {
      console.log("No pending tasks with deadlines today.");
      return;
    }

    // Group tasks by assignee
    const groupedTasks = groupTasksByAssignee(tasks);

    // Send emails to each assignee
    for (const [email, tasks] of Object.entries(groupedTasks)) {
      const assigneeName = tasks[0].assignedTo.name; // Get the assignee's name
      const subject = `Task Summary: ${tasks.length} Pending Task(s) Assigned`;
      const htmlContent = generateEmailContent(tasks, assigneeName);

      await sendEmail(email, subject, htmlContent);
    }
  } catch (error) {
    console.error("Error checking deadlines and sending emails:", error);
  }
};

// Function to reassign incomplete tasks to the next day
const reassignIncompleteTasks = async () => {
  try {
    const now = new Date();
    const overdueTasks = await Task.find({
      deadline: { $lt: now }, // Tasks with deadlines before now
      status: { $ne: "Completed" }, // Exclude completed tasks
    }).populate("assignedTo");

    if (overdueTasks.length === 0) {
      console.log("No overdue tasks to reassign.");
      return;
    }

    for (const task of overdueTasks) {
      const newDeadline = new Date(task.deadline.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours to the deadline
      task.deadline = newDeadline;
      await task.save();

      console.log(`Task ${task._id} reassigned to ${newDeadline}`);

      // Send email notification to the assignee
      const subject = `Task Reassigned: ${task.title}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #007bff;">Task Reassigned</h2>
          <p>Dear <strong>${task.assignedTo.name}</strong>,</p>
          <p>The following task has been reassigned to a new deadline:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>📌 Task Title:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${task.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>📅 New Deadline:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${newDeadline.toLocaleString()}</td>
            </tr>
          </table>
          <p>Please log in to your dashboard to review the task.</p>
          <p style="margin-top: 20px;"><em>Best regards,</em><br><strong>Yatra Techs</strong></p>
        </div>
      `;

      await sendEmail(task.assignedTo.email, subject, htmlContent);
    }
  } catch (error) {
    console.error("Error reassigning incomplete tasks:", error);
  }
};

// Schedule the job to run daily at 6:00 PM IST
cron.schedule(
  "14 18 * * *", // 6:10 PM IST (18:10 in 24-hour format)
  () => {
    console.log("Running deadline check and email sending job...");
    checkDeadlinesAndSendEmails();
  },
  {
    timezone: "Asia/Kolkata", // Set timezone to IST
  }
);

// Schedule the job to run daily at 9:30 AM IST to reassign incomplete tasks
cron.schedule(
  "36 10 * * *", // 10:36 AM IST
  () => {
    console.log("Running task reassignment job...");
    reassignIncompleteTasks();
  },
  {
    timezone: "Asia/Kolkata", // Set timezone to IST
  }
);

// Get all tasks
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const {
      title,
      description = "",
      content = "",
      comments = "",
      deadline,
      priority,
      status,
      client,
      assignedTo,
      assignedToName,
      assignedToRole,
    } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newTask = new Task({
      title,
      description,
      content,
      comments,
      deadline,
      priority,
      status,
      client,
      assignedTo,
      assignedToName,
      assignedToRole,
    });

    await newTask.save();

    // Calculate and update employee stats
    await calculateEmployeeStats(assignedTo);

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task", error });
  }
};

// Update the task status
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const oldTask = await Task.findById(id);
    if (!oldTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the status has changed
    if (oldTask.status !== updatedTask.status) {
      if (updatedTask.status === "Completed") {
        await TeamMembers.findByIdAndUpdate(updatedTask.assignedTo, {
          $inc: { completedTasks: 1 },
        });
      } else if (oldTask.status === "Completed") {
        await TeamMembers.findByIdAndUpdate(updatedTask.assignedTo, {
          $inc: { completedTasks: -1 },
        });
      }
    }

    // Recalculate and update employee stats
    await calculateEmployeeStats(updatedTask.assignedTo);

    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task", error });
  }
};

// Delete a single task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Recalculate and update employee stats
    await calculateEmployeeStats(deletedTask.assignedTo);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task", error });
  }
};

// Delete all tasks assigned to a specific user
const deleteTasksByAssignee = async (req, res) => {
  try {
    const { assignedTo } = req.params;

    const deletedTasks = await Task.deleteMany({ assignedTo });
    if (deletedTasks.deletedCount === 0) {
      return res.status(404).json({ message: "No tasks found for this assignee" });
    }

    // Recalculate and update employee stats
    await calculateEmployeeStats(assignedTo);

    res.status(200).json({ message: `Deleted ${deletedTasks.deletedCount} tasks assigned to ${assignedTo}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tasks", error });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTasksByAssignee, deleteTask };