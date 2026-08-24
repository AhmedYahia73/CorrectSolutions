"use strict";
// src/controllers/Sales/SalesController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSales = exports.updateSales = exports.createSales = exports.getSalesById = exports.lists = exports.getAllSales = exports.salesIdSchema = exports.updateSalesSchema = exports.getCreateSalesSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء مستخدم Sales (ديناميكي بناءً على الـ Role)
const getCreateSalesSchema = (userRole) => {
    return zod_1.z.object({
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
            // إذا كان الـ role هو leader، نجعل الحقل اختياري لأننا سنأخذه تلقائياً من الـ Token
            leader_id: userRole === "leader"
                ? zod_1.z.string().uuid("Invalid leader ID format").optional()
                : zod_1.z.string({ required_error: "Leader ID is required" }).uuid("Invalid leader ID format"),
            target_id: zod_1.z.string().uuid("Invalid target ID format").nullable().optional(),
            status: zod_1.z.enum(["active", "inactive"], {
                required_error: "Status is required",
                invalid_type_error: "Status must be either 'active' or 'inactive'",
            }),
        }),
    });
};
exports.getCreateSalesSchema = getCreateSalesSchema;
// الـ Schema الخاص بتحديث مستخدم Sales
exports.updateSalesSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name cannot be empty").max(200).optional(),
        email: zod_1.z.string().email("Invalid email format").max(100).optional(),
        phone: zod_1.z.string().min(5).max(20).optional(),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters").optional(),
        image: zod_1.z.string().nullable().optional(),
        leader_id: zod_1.z.string().uuid("Invalid leader ID format").optional(),
        target_id: zod_1.z.string().uuid("Invalid target ID format").nullable().optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
// الـ Schema للعمليات التي تتطلب المعرف ID فقط
exports.salesIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format"),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Sales (للـ Organization الحالية مع الـ Targets الخاصة بهم)
// ✅ Get All Sales (للـ Organization الحالية مع الـ Targets الخاصة بهم)
const getAllSales = async (req, res) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    // 1. استقبال معايير الـ Pagination والبحث والفلترة
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search || '';
    const leaderIdParam = req.query.leader_id ? req.query.leader_id : null;
    const offset = (page - 1) * limit;
    // 2. عمل Alias لجدول الـ users لعرض بيانات الـ Leader (Self-Join)
    const leaderAlias = (0, drizzle_orm_1.aliasedTable)(schema_1.users, "leaderAlias");
    const whereConditions = [];
    // 3. تطبيق الصلاحيات والفلترة بناءً على الـ Role
    if (userRole === "leader") {
        // قائد الفريق يشوف فقط الـ Sales التابعين له
        whereConditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "sales"), (0, drizzle_orm_1.eq)(schema_1.users.leader_id, userId)));
    }
    else {
        // الأدمن أو الأونر يشوف جميع الـ Sales
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.users.role, "sales"));
        // إذا الأدمن مرر leader_id محدد في الـ Query
        if (leaderIdParam) {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.users.leader_id, leaderIdParam));
        }
    }
    // 4. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني
    if (search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        whereConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.users.name, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.phone, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.email, searchPattern)));
    }
    const monthsParam = req.query.months;
    const yearParam = req.query.year;
    if (monthsParam && yearParam) {
        const months = monthsParam.split(',').map(Number).filter(m => !isNaN(m));
        const year = Number(yearParam);
        if (months.length > 0 && !isNaN(year)) {
            whereConditions.push((0, drizzle_orm_1.inArray)((0, drizzle_orm_1.sql) `MONTH(${schema_1.users.createdAt})`, months));
            whereConditions.push((0, drizzle_orm_1.eq)((0, drizzle_orm_1.sql) `YEAR(${schema_1.users.createdAt})`, year));
        }
    }
    // 5. بناء استعلام البيانات الأساسي (Base Query)
    let query = db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
        image: schema_1.users.image,
        target_name: schema_1.targets.name,
        leader_name: leaderAlias.name,
        leader_phone: leaderAlias.phone,
        status: schema_1.users.status,
        createdAt: schema_1.users.createdAt
    })
        .from(schema_1.users)
        .leftJoin(schema_1.targets, (0, drizzle_orm_1.eq)(schema_1.users.target_id, schema_1.targets.id))
        .leftJoin(leaderAlias, (0, drizzle_orm_1.eq)(schema_1.users.leader_id, leaderAlias.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt))
        .$dynamic();
    // 6. بناء استعلام الـ Count لحساب التوتال
    let countQuery = db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.users)
        .$dynamic();
    // ربط الشروط بالاستعلامين
    if (whereConditions.length > 0) {
        const finalWhere = (0, drizzle_orm_1.and)(...whereConditions);
        query = query.where(finalWhere);
        countQuery = countQuery.where(finalWhere);
    }
    // 7. تنفيذ الاستعلامين بالتوازي (Parallel Execution)
    const [allSales, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);
    // 8. إرسال النتيجة
    return (0, response_1.SuccessResponse)(res, {
        sales: allSales,
        pagination: {
            total: Number(totalCount),
            page,
            limit,
            totalPages: Math.ceil(Number(totalCount) / limit)
        }
    }, 200);
};
exports.getAllSales = getAllSales;
// ✅ Get Targets List (لإستخدامها في القائمة المنسدلة مثلاً)
const lists = async (req, res) => {
    const target_list = await db_1.db
        .select({
        id: schema_1.targets.id,
        name: schema_1.targets.name,
    })
        .from(schema_1.targets);
    const leaders = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.role, "leader"));
    (0, response_1.SuccessResponse)(res, { target_list, leaders }, 200);
};
exports.lists = lists;
// ✅ Get Sales By ID
const getSalesById = async (req, res) => {
    const validated = await exports.salesIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const sales = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
        image: schema_1.users.image,
        target_id: schema_1.users.target_id,
        leader_id: schema_1.users.leader_id,
        status: schema_1.users.status,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")))
        .limit(1);
    if (!sales[0]) {
        throw new NotFound_1.NotFound("Sales not found");
    }
    (0, response_1.SuccessResponse)(res, { sales: sales[0] }, 200);
};
exports.getSalesById = getSalesById;
// ✅ Create Sales
const createSales = async (req, res) => {
    // 1. التحقق من البيانات عبر الـ Schema الديناميكية
    const validated = await (0, exports.getCreateSalesSchema)(req.user?.role).parseAsync({ body: req.body });
    const { name, email, password, phone, image, target_id, status } = validated.body;
    // 2. تحديد الـ leader_id بناءً على الـ Role لمنع التلاعب بالبيانات
    let leader_id;
    if (req.user?.role === "leader") {
        leader_id = req.user.id; // يتم إجبار استخدام الـ ID الخاص به
    }
    else {
        leader_id = validated.body.leader_id; // يتم أخذه من المدخلات المفحوصة للأدمن أو الأونر
    }
    if (!leader_id) {
        throw new BadRequest_1.BadRequest("Leader ID is required for this operation");
    }
    // 3. تحقق من وجود الـ Leader وصحة الـ Role الخاص به
    const targetLeader = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, leader_id), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader")))
        .limit(1);
    if (!targetLeader[0]) {
        throw new BadRequest_1.BadRequest("The assigned leader was not found or is invalid");
    }
    // 4. تحقق من عدم تكرار البريد الإلكتروني أو الهاتف لحساب آخر
    const existingSales = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.eq)(schema_1.users.phone, phone)))
        .limit(1);
    if (existingSales[0]) {
        throw new BadRequest_1.BadRequest("Email or Phone already exists");
    }
    // 5. تشفير كلمة المرور
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    let savedSalesImage = null;
    if (image) {
        const result = await (0, handleImages_1.saveBase64Image)(req, image, "sales");
        savedSalesImage = result.url;
    }
    // 6. إدخال البيانات في قاعدة البيانات
    await db_1.db.insert(schema_1.users).values({
        name,
        email,
        phone,
        leader_id,
        image: savedSalesImage,
        password: hashedPassword,
        role: "sales",
        target_id: target_id || null,
        status: status,
    });
    (0, response_1.SuccessResponse)(res, { message: "Sales created successfully" }, 201);
};
exports.createSales = createSales;
// ✅ Update Sales
const updateSales = async (req, res) => {
    const validated = await exports.updateSalesSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { name, email, password, phone, image, target_id, status } = validated.body;
    // 1. التحقق من وجود الـ Sales نفسه وصحة الـ Role
    const existingSales = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")))
        .limit(1);
    if (!existingSales[0]) {
        throw new NotFound_1.NotFound("Sales not found");
    }
    // 2. حماية وتأمين الـ leader_id عند التحديث
    let leader_id;
    if (req.user?.role === "leader") {
        leader_id = req.user.id; // القائد لا يمكنه تعديل القائد التابع له السيلز
    }
    else {
        leader_id = validated.body.leader_id; // للأونر أو الأدمن يمكنهم تعديله إذا تم إرساله
    }
    // 3. تحقق من صحة الـ Leader الجديد إذا تم تعديله أو إرساله
    if (leader_id) {
        const targetLeader = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, leader_id), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader")))
            .limit(1);
        if (!targetLeader[0]) {
            throw new BadRequest_1.BadRequest("The assigned leader was not found or is invalid");
        }
    }
    // 4. تحقق من البريد الإلكتروني المكرر لغير هذا الحساب
    if (email && email !== existingSales[0].email) {
        const duplicateEmail = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (duplicateEmail[0]) {
            throw new BadRequest_1.BadRequest("Email already exists");
        }
    }
    // 5. تحقق من الهاتف المكرر لغير هذا الحساب
    if (phone && phone !== existingSales[0].phone) {
        const duplicatePhone = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.phone, phone), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (duplicatePhone[0]) {
            throw new BadRequest_1.BadRequest("Phone already exists");
        }
    }
    // 6. معالجة الصور والتعديلات عليها
    let salesImage = existingSales[0].image;
    if (image !== undefined) {
        if (image) {
            const result = await (0, handleImages_1.saveBase64Image)(req, image, "sales");
            if (existingSales[0].image) {
                await (0, deleteImage_1.deletePhotoFromServer)(existingSales[0].image);
            }
            salesImage = result.url;
        }
        else {
            if (existingSales[0].image) {
                await (0, deleteImage_1.deletePhotoFromServer)(existingSales[0].image);
            }
            salesImage = null;
        }
    }
    // 7. بناء كائن التعديل لتجنب إرسال undefined لقاعدة البيانات
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (phone !== undefined)
        updateData.phone = phone;
    if (salesImage !== undefined)
        updateData.image = salesImage;
    if (leader_id !== undefined)
        updateData.leader_id = leader_id;
    if (status !== undefined)
        updateData.status = status;
    if (target_id !== undefined)
        updateData.target_id = target_id;
    if (password) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Sales updated successfully" }, 200);
};
exports.updateSales = updateSales;
// ✅ Delete Sales
const deleteSales = async (req, res) => {
    const validated = await exports.salesIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingSales = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")))
        .limit(1);
    if (!existingSales[0]) {
        throw new NotFound_1.NotFound("Sales not found");
    }
    if (existingSales[0].image) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingSales[0].image);
    }
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Sales deleted successfully" }, 200);
};
exports.deleteSales = deleteSales;
