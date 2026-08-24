"use strict";
// src/controllers/admin/adminController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.getAdminById = exports.getAllAdmin = exports.adminIdSchema = exports.updateAdminSchema = exports.createAdminSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء مسؤول (Admin) جديد
exports.createAdminSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(200, "Name cannot exceed 200 characters"),
        email: zod_1.z.string({ required_error: "Email is required" })
            .email("Invalid email format")
            .max(100, "Email cannot exceed 100 characters"),
        phone: zod_1.z.string({ required_error: "Phone is required" })
            .min(5, "Phone is too short")
            .max(20, "Phone cannot exceed 20 characters"),
        password: zod_1.z.string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
    }),
});
// الـ Schema الخاص بتحديث مسؤول (Admin)
exports.updateAdminSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid admin ID format"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name cannot be empty").max(200).optional(),
        email: zod_1.z.string().email("Invalid email format").max(100).optional(),
        phone: zod_1.z.string().min(5).max(20).optional(),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters").optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
// الـ Schema للعمليات التي تتطلب المعرف ID فقط في الـ parameters
exports.adminIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid admin ID format"),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Admins
const getAllAdmin = async (req, res) => {
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    let whereConditions = [];
    // 1. الفلترة الأساسية: جلب المستخدمين الذين يمتلكون دور "admin" فقط
    whereConditions.push((0, drizzle_orm_1.eq)(schema_1.users.role, "admin"));
    // 2. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني للمشرفين
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.users.name, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.phone, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.email, searchPattern)));
    }
    // 3. بناء استعلام البيانات الأساسي (Base Query)
    let query = db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
        createdAt: schema_1.users.createdAt
    })
        .from(schema_1.users)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt)) // ترتيب الأحدث أولاً
        .$dynamic();
    // 4. بناء استعلام الـ Count لحساب العدد الإجمالي متوافقاً مع فلاتر البحث
    let countQuery = db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.users)
        .$dynamic();
    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        query = query.where((0, drizzle_orm_1.and)(...whereConditions));
        countQuery = countQuery.where((0, drizzle_orm_1.and)(...whereConditions));
    }
    // 5. تنفيذ الاستعلامين بالتوازي (Parallel Execution) لتقليل زمن الاستجابة لأقل حد ممكن
    const [allAdmins, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);
    // 6. إرسال النتيجة مع معلومات الـ Pagination الكاملة
    (0, response_1.SuccessResponse)(res, {
        admins: allAdmins,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};
exports.getAllAdmin = getAllAdmin;
// ✅ Get Admin By ID
const getAdminById = async (req, res) => {
    const validated = await exports.adminIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const admin = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "admin")))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    (0, response_1.SuccessResponse)(res, { admin: admin[0] }, 200);
};
exports.getAdminById = getAdminById;
// ✅ Create Admin
const createAdmin = async (req, res) => {
    const validated = await exports.createAdminSchema.parseAsync({ body: req.body });
    const { name, email, password, phone } = validated.body;
    // تحقق من عدم وجود مستخدم آخر بنفس الـ email أو الـ phone
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.eq)(schema_1.users.phone, phone)))
        .limit(1);
    if (existingAdmin[0]) {
        throw new BadRequest_1.BadRequest("Email or Phone already exists");
    }
    // Hash الـ password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(schema_1.users).values({
        name,
        email,
        phone,
        password: hashedPassword,
    });
    (0, response_1.SuccessResponse)(res, { message: "Admin created successfully" }, 201);
};
exports.createAdmin = createAdmin;
// ✅ Update Admin
const updateAdmin = async (req, res) => {
    const validated = await exports.updateAdminSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { name, email, password, phone } = validated.body;
    // تحقق من وجود الـ Admin
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "admin")))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    // تحقق من الـ email لو تم تعديله ولم يكرر مع حساب آخر
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (duplicateEmail[0]) {
            throw new BadRequest_1.BadRequest("Email already exists");
        }
    }
    // تحقق من الـ phone لو تم تعديله ولم يكرر مع حساب آخر
    if (phone && phone !== existingAdmin[0].phone) {
        const duplicatePhone = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.phone, phone), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (duplicatePhone[0]) {
            throw new BadRequest_1.BadRequest("Phone already exists");
        }
    }
    // بناء كائن التحديث بشكل يحافظ على البيانات الحالية في حال عدم إرسالها
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (phone !== undefined)
        updateData.phone = phone;
    // لو فيه password جديد
    if (password) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Admin updated successfully" }, 200);
};
exports.updateAdmin = updateAdmin;
// ✅ Delete Admin
const deleteAdmin = async (req, res) => {
    const validated = await exports.adminIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "admin")))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    // Image handling removed as users schema lacks image column
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Admin deleted successfully" }, 200);
};
exports.deleteAdmin = deleteAdmin;
