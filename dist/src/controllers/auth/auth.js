"use strict";
// src/controllers/auth/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.hash_password = hash_password;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
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
const drizzle_orm_2 = require("drizzle-orm");
const Errors_2 = require("../../Errors");
const BadRequest_1 = require("../../Errors/BadRequest");
async function getProfile(req, res) {
    const userId = req.user.id;
    const userProfile = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
        role: schema_1.users.role,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
        .limit(1);
    if (!userProfile[0]) {
        throw new Errors_2.NotFound("User not found");
    }
    return (0, response_1.SuccessResponse)(res, { user: userProfile[0] }, 200);
}
async function updateProfile(req, res) {
    const userId = req.user.id;
    const { name, email, phone, password } = req.body;
    const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
    if (!existingUser[0]) {
        throw new Errors_2.NotFound("User not found");
    }
    if (email && email !== existingUser[0].email) {
        const duplicateEmail = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_2.ne)(schema_1.users.id, userId)))
            .limit(1);
        if (duplicateEmail[0]) {
            throw new BadRequest_1.BadRequest("Email already exists");
        }
    }
    if (phone && phone !== existingUser[0].phone) {
        const duplicatePhone = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.users.phone, phone), (0, drizzle_orm_2.ne)(schema_1.users.id, userId)))
            .limit(1);
        if (duplicatePhone[0]) {
            throw new BadRequest_1.BadRequest("Phone already exists");
        }
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (phone !== undefined)
        updateData.phone = phone;
    if (password) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    const updatedUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
    const tokenPayload = {
        id: updatedUser[0].id,
        role: updatedUser[0].role,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        phone: updatedUser[0].phone,
    };
    const token = (0, auth_1.generateUserToken)(tokenPayload);
    return (0, response_1.SuccessResponse)(res, {
        message: "Profile updated successfully",
        token,
        user: {
            id: updatedUser[0].id,
            name: updatedUser[0].name,
            email: updatedUser[0].email,
            phone: updatedUser[0].phone,
            role: updatedUser[0].role,
        },
    }, 200);
}
