const app = require("./src/app");
const connectDB = require("./src/config/db");
const ensureAdmin = require("./src/utils/ensureAdmin");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  await connectDB();
  await ensureAdmin();

  app.listen(PORT, HOST, () => {
    console.log(`Backend API running at http://${HOST}:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
