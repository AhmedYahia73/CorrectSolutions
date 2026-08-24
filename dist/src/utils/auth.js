"use strict";
// src/utils/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateUserToken = exports.generateSalesToken = exports.generateLeaderToken = exports.generateAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Errors_1 = require("../Errors");
require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
// ✅ للـ Admin (موظف بصلاحيات إدارية كاملة)
const generateAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "admin",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateAdminToken = generateAdminToken;
// ✅ للـ Leader (قائد فريق أو مشرف على التارجت)
const generateLeaderToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "leader",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateLeaderToken = generateLeaderToken;
// ✅ للـ Sales (مندوب المبيعات الميداني - المسؤول عن الزيارات)
const generateSalesToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "sales",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateSalesToken = generateSalesToken;
// ✅ دالة عامة لتوليد التوكن بناءً على الدور القادم ديناميكياً من قاعدة البيانات
const generateUserToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateUserToken = generateUserToken;
// 🛡️ التحقق من صحة الـ Token وفك تشفيره
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Errors_1.UnauthorizedError("Invalid token");
    }
};
exports.verifyToken = verifyToken;
