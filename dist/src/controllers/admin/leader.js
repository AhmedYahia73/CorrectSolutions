"use strict";
// src/controllers/Leader/LeaderController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLeader = exports.updateLeader = exports.createLeader = exports.getLeaderById = exports.lists = exports.getAllLeader = exports.leaderIdSchema = exports.updateLeaderSchema = exports.createLeaderSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء مستخدم Leader جديد
exports.createLeaderSchema = zod_1.z.object({
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
        image: zod_1.z.string().nullable().optional(),
        target_id: zod_1.z.string().uuid("Invalid target ID format").nullable().optional(),
        status: zod_1.z.enum(["active", "inactive"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be either 'active' or 'inactive'",
        }),
    }),
});
// الـ Schema الخاص بتحديث مستخدم Leader
exports.updateLeaderSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name cannot be empty").max(200).optional(),
        email: zod_1.z.string().email("Invalid email format").max(100).optional(),
        phone: zod_1.z.string().min(5).max(20).optional(),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters").optional(),
        image: zod_1.z.string().nullable().optional(),
        target_id: zod_1.z.string().uuid("Invalid target ID format").nullable().optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
// الـ Schema للعمليات التي تتطلب المعرف ID فقط في الـ parameters
exports.leaderIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format"),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Leaders
const getAllLeader = async (req, res) => {
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    let whereConditions = [];
    // 1. الفلترة الأساسية: جلب المستخدمين الذين يمتلكون دور "leader" فقط
    whereConditions.push((0, drizzle_orm_1.eq)(schema_1.users.role, "leader"));
    // 2. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني للقادة
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
        image: schema_1.users.image,
        target: schema_1.targets.name,
        status: schema_1.users.status,
        createdAt: schema_1.users.createdAt
    })
        .from(schema_1.users)
        .leftJoin(schema_1.targets, (0, drizzle_orm_1.eq)(schema_1.users.target_id, schema_1.targets.id))
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
    // 5. تنفيذ الاستعلامين بالتوازي (Parallel Execution) لتقليل زمن الاستجابة
    const [allLeaders, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);
    // 6. إرسال النتيجة مع معلومات الـ Pagination الكاملة
    (0, response_1.SuccessResponse)(res, {
        leaders: allLeaders,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};
exports.getAllLeader = getAllLeader;
// ✅ Get Targets List (لإستخدامها في القائمة المنسدلة)
const lists = async (req, res) => {
    const target_list = await db_1.db
        .select({
        id: schema_1.targets.id,
        name: schema_1.targets.name,
    })
        .from(schema_1.targets);
    (0, response_1.SuccessResponse)(res, { target_list }, 200);
};
exports.lists = lists;
// ✅ Get Leader By ID
const getLeaderById = async (req, res) => {
    const validated = await exports.leaderIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const leader = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
        image: schema_1.users.image,
        target_id: schema_1.users.target_id,
        status: schema_1.users.status,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader")))
        .limit(1);
    if (!leader[0]) {
        throw new NotFound_1.NotFound("Leader not found");
    }
    (0, response_1.SuccessResponse)(res, { leader: leader[0] }, 200);
};
exports.getLeaderById = getLeaderById;
// ✅ Create Leader
const createLeader = async (req, res) => {
    const validated = await exports.createLeaderSchema.parseAsync({ body: req.body });
    const { name, email, password, phone, image, target_id, status } = validated.body;
    // تحقق من عدم وجود مستخدم آخر بنفس الـ email أو الـ phone
    const existingLeader = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.eq)(schema_1.users.phone, phone)))
        .limit(1);
    if (existingLeader[0]) {
        throw new BadRequest_1.BadRequest("Email or Phone already exists");
    }
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    let savedLeaderImage = null;
    if (image) {
        const result = await (0, handleImages_1.saveBase64Image)(req, image, "leaders");
        savedLeaderImage = result.url;
    }
    await db_1.db.insert(schema_1.users).values({
        name,
        email,
        phone,
        image: savedLeaderImage,
        password: hashedPassword,
        role: "leader",
        target_id: target_id || null, // ربط القائد بالـ target إن وجد
        status: status,
    });
    (0, response_1.SuccessResponse)(res, { message: "Leader created successfully" }, 201);
};
exports.createLeader = createLeader;
// ✅ Update Leader
const updateLeader = async (req, res) => {
    const validated = await exports.updateLeaderSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { name, email, password, phone, image, target_id, status } = validated.body;
    // تحقق من وجود الـ Leader
    const existingLeader = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader")))
        .limit(1);
    if (!existingLeader[0]) {
        throw new NotFound_1.NotFound("Leader not found");
    }
    // تحقق من الـ email لو تم تعديله ولم يكرر مع حساب آخر
    if (email && email !== existingLeader[0].email) {
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
    if (phone && phone !== existingLeader[0].phone) {
        const duplicatePhone = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.phone, phone), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (duplicatePhone[0]) {
            throw new BadRequest_1.BadRequest("Phone already exists");
        }
    }
    let leaderImage = existingLeader[0].image;
    if (image !== undefined) {
        if (image) {
            const result = await (0, handleImages_1.saveBase64Image)(req, image, "leaders");
            // حذف الصورة القديمة من السيرفر بعد رفع الصورة الجديدة بنجاح
            if (existingLeader[0].image) {
                await (0, deleteImage_1.deletePhotoFromServer)(existingLeader[0].image);
            }
            leaderImage = result.url;
        }
        else {
            // تصفير الصورة وحذفها من السيرفر إذا أرسل قيمة فارغة
            if (existingLeader[0].image) {
                await (0, deleteImage_1.deletePhotoFromServer)(existingLeader[0].image);
            }
            leaderImage = null;
        }
    }
    // بناء كائن البيانات المحدثة مع تلافي القيم الـ undefined
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (phone !== undefined)
        updateData.phone = phone;
    if (leaderImage !== undefined)
        updateData.image = leaderImage;
    if (status !== undefined)
        updateData.status = status;
    if (target_id !== undefined)
        updateData.target_id = target_id;
    // لو تم إرسال password جديد
    if (password) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Leader updated successfully" }, 200);
};
exports.updateLeader = updateLeader;
// ✅ Delete Leader
const deleteLeader = async (req, res) => {
    const validated = await exports.leaderIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingLeader = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader")))
        .limit(1);
    if (!existingLeader[0]) {
        throw new NotFound_1.NotFound("Leader not found");
    }
    // حذف صورة الـ Leader من السيرفر أولاً
    if (existingLeader[0].image) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingLeader[0].image);
    }
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Leader deleted successfully" }, 200);
};
exports.deleteLeader = deleteLeader;
