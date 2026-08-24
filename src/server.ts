import express from "express";
import path from "path";
import ApiRoute from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFound } from "./Errors";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet"; 
import http from "http";
import { Server } from "socket.io"; 
import { setupSwagger } from "./config/swagger"; // 👈 1. استيراد دالة Swagger هنا

dotenv.config();

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ CORS بدون app.options
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 📝 2. تفعيل واجهة Swagger (يُفضل وضعها قبل الـ Routes الأساسية للمشروع)
setupSwagger(app);

app.get("/api/test", (req, res, next) => {
  res.json({ message: "API is working! notify token" });
});

app.get("/api/seed", async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const { db } = require("./models/db");
    const { users } = require("./models/schema");
    const hashedPassword = await bcrypt.hash("123456", 10);
    await db.insert(users).values({
      name: "Admin User",
      email: "admin@correctsolution.com",
      phone: "01000000000",
      password: hashedPassword,
      role: "admin",
    });
    res.json({ message: "Admin seeded successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || error });
  }
});

app.use("/api", ApiRoute);
app.use("/", ApiRoute); // Fallback for direct root access

app.use((req, res, next) => {
  throw new NotFound("Route not found");
});

app.use(errorHandler);
 

// 🚀 تشغيل الخادم على البورت 3001
httpServer.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});