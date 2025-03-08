const cron = require("node-cron");
const { checkOverdueTasks } = require("./employeeStatsUtils");

// Schedule the overdue task check to run every 1 minute
cron.schedule(
  "*/1 * * * *", // Run every minute
  async () => {
    console.log("Checking for overdue tasks...");
    await checkOverdueTasks();
  },
  {
    timezone: "Asia/Kolkata", // Set timezone to IST
  }
);
