const Task = require("../models/taskModel");
const TeamMembers = require("../models/TeamMember");
const mongoose = require("mongoose");
const cron = require("node-cron");

// Calculate employee stats and performance
const calculateEmployeeStats = async (employeeId) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("Invalid Employee ID");
  }

  const tasks = await Task.find({ assignedTo: employeeId });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const overdueTasks = tasks.filter(
    (task) => new Date(task.deadline) < new Date() && task.status !== "Completed"
  ).length;

  // Performance calculation
  const baseScore = 100;
  const pointsPerCompletedTask = 2; // Add 2 points for each completed task
  const pointsDeductedPerUnsubmittedTask = 5; // Deduct 5 points for each unsubmitted task
  const pointsDeductedPerOverdueTask = 10; // Deduct 10 points for each overdue task

  const performanceScore =
    baseScore +
    completedTasks * pointsPerCompletedTask -
    overdueTasks * pointsDeductedPerOverdueTask -
    (totalTasks - completedTasks) * pointsDeductedPerUnsubmittedTask;

  // Ensure the score is within 0-100
  const finalPerformanceScore = Math.max(0, Math.min(100, performanceScore));

  // Update the team member document
  const updatedMember = await TeamMembers.findByIdAndUpdate(
    employeeId,
    {
      $set: {
        totalTasks,
        completedTasks,
        unsubmittedTasks: totalTasks - completedTasks,
        healthScore: finalPerformanceScore,
      },
    },
    { new: true }
  );

  console.log("Updated Employee Stats:", updatedMember);

  return {
    totalTasks,
    completedTasks,
    unsubmittedTasks: totalTasks - completedTasks,
    healthScore: finalPerformanceScore,
  };
};

// Check for overdue tasks
const checkOverdueTasks = async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      deadline: { $lt: now }, // Tasks with deadlines before now
      status: { $ne: "Completed" }, // Exclude completed tasks
    });

    for (const task of tasks) {
      const deadlineWithGrace = new Date(task.deadline.getTime() + 6 * 60 * 60 * 1000); // Add 6 hours grace period

      if (now > deadlineWithGrace) {
        console.log(`Task ${task._id} is overdue for Employee ${task.assignedTo}`);
        await calculateEmployeeStats(task.assignedTo);
      }
    }
  } catch (error) {
    console.error("Error checking overdue tasks:", error);
  }
};

// Schedule the cron job to run every minute
cron.schedule("30 3 * * *", () => { 
  const startTime = new Date();
  console.log(`Cron job started at: ${startTime}`);

  checkOverdueTasks()
    .then(() => {
      const endTime = new Date();
      const runtime = endTime - startTime;
      console.log(`Cron job completed at: ${endTime}`);
      console.log(`Total runtime: ${runtime}ms`);
    })
    .catch((error) => {
      console.error("Cron job failed:", error);
    });
}, {
  timezone: "Asia/Kolkata" // Ensure it runs in IST
});

module.exports = {
  calculateEmployeeStats,
  checkOverdueTasks,
};