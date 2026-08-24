"use strict";
// src/controllers/auth/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.hash_password = hash_password;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
async function login(req, res) {
    const { email, password } = req.body;
    // 1) جلب الأدمن بالإيميل
    const admin = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
        .limit(1);
    if (!admin[0]) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 2) التحقق من الباسورد
    const match = await bcrypt_1.default.compare(password, admin[0].password);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 5) إنشاء التوكن
    const tokenPayload = {
        id: admin[0].id,
        role: admin[0].role,
        email: admin[0].email,
        name: admin[0].name,
        phone: admin[0].phone,
    };
    const token = (0, auth_1.generateUserToken)(tokenPayload);
    // 6) الرد
    return (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        user: {
            id: admin[0].id,
            name: admin[0].name,
            email: admin[0].email,
            phone: admin[0].phone,
            role: admin[0].role,
        },
    }, 200);
}
async function hash_password(req, res) {
    const { password } = req.body;
    // 6) الرد
    return (0, response_1.SuccessResponse)(res, {
        password: await bcrypt_1.default.hash(password, 10),
    }, 200);
}
