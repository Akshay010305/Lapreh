const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const healthRoutes = require("./routes/health.route");
const apiRoutes = require("./routes/api.routes");
const { errorHandler, notFound } = require("./middleware/error.middleware");
const { apiRateLimiter } = require("./middleware/rateLimit.middleware");

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
].filter(Boolean);
const localNetworkOrigin =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/;
const localTunnelOrigin = /^https:\/\/[a-z0-9-]+\.loca\.lt$/;

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        localNetworkOrigin.test(origin) ||
        localTunnelOrigin.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/health", healthRoutes);
app.use("/api", apiRateLimiter);
app.use("/api", apiRoutes);

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(frontendIndexPath);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
