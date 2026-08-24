"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const Errors_1 = require("./Errors");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const swagger_1 = require("./config/swagger"); // 👈 1. استيراد دالة Swagger هنا
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
// ✅ CORS بدون app.options
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "20mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// 📝 2. تفعيل واجهة Swagger (يُفضل وضعها قبل الـ Routes الأساسية للمشروع)
(0, swagger_1.setupSwagger)(app);
app.get("/api/test", (req, res, next) => {
    res.json({ message: "API is working! notify token" });
});
app.use("/api", routes_1.default);
app.use((req, res, next) => {
    throw new Errors_1.NotFound("Route not found");
});
app.use(errorHandler_1.errorHandler);
// 🚀 تشغيل الخادم على البورت 3001
httpServer.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});
