// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import Counter from "./models/counter.js";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoute from "./routes/salaryRoute.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import studentRoutes from "./routes/student.routes.js";
import Course from "./routes/courses.js";
import clientRoutes from "./routes/clientRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect MongoDB
connectDB();

// Initialize Counter (safe for production)
const initCounter = async () => {
  try {
    const counter = await Counter.findOne({ _id: "client_project_number" });

    if (!counter) {
      await Counter.create({ _id: "client_project_number", seq: 1000 });
      console.log("Counter initialized → PROJ-001001");
    } else {
      console.log(
        `Counter exists → Next project: PROJ-${String(counter.seq + 1).padStart(6, "0")}`
      );
    }
  } catch (error) {
    console.error("Failed to initialize counter:", error.message);
  }
};

initCounter();

const app = express();

// Parse JSON
app.use(express.json());

// -------------------- CORS CONFIG --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://ssinterncrm.netlify.app",
  "https://sscrm.skill2success.in"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
// ----------------------------------------------------

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/lead", leadRoutes);
app.use("/api/salary", salaryRoute);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/courses", Course);
app.use("/api/expenses", expenseRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/leaves", leaveRoutes);

// -------- Serve Frontend (Optional: if bundled) -------
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "client/dist");

  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}
// ----------------------------------------------------

// Health check
app.get("/", (req, res) => {
  res.send("CRM Backend Running 🚀");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server Running on Port: ${PORT}`);
});