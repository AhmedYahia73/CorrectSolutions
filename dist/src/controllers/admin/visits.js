"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVisits = exports.updateVisits = exports.createVisits = exports.getVisitsById = exports.lists = exports.getVisitsCounts = exports.getAllSales = exports.getAllVisits = exports.VisitIdSchema = exports.updateVisitSchema = exports.createVisitSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
const createVisitSchema = (userRole) => {
    return zod_1.z.object({
        body: zod_1.z.object({
            lat: zod_1.z.number({ required_error: "Latitude (lat) is required" })
                .min(-90, "Latitude must be between -90 and 90")
                .max(90, "Latitude must be between -90 and 90"),
            lng: zod_1.z.number({ required_error: "Longitude (lng) is required" })
                .min(-180, "Longitude must be between -180 and 180")
                .max(180, "Longitude must be between -180 and 180"),
            name: zod_1.z.string({ required_error: "Name is required" })
                .min(1, "Name cannot be empty")
                .max(255, "Name cannot exceed 255 characters"),
            address: zod_1.z.string({ required_error: "Address is required" })
                .min(1, "Address cannot be empty")
                .max(500, "Address cannot exceed 500 characters"),
            notes: zod_1.z.string()
                .max(1000, "Notes cannot exceed 1000 characters")
                .nullable()
                .optional(),
            phone: zod_1.z.string({ required_error: "Phone is required" })
                .min(5, "Phone number is too short")
                .max(20, "Phone cannot exceed 20 characters"),
            status: zod_1.z.enum(["visit", "sales", "delivered"], {
                invalid_type_error: "Status must be either 'visit', 'sales', or 'delivered'",
            }).optional(),
            status_id: zod_1.z.string().nullable().optional(),
            sales_id: userRole === "sales" || userRole === "leader"
                ? zod_1.z.string().uuid().optional()
                : zod_1.z.string({ required_error: "Sales ID is required" }),
            product_id: zod_1.z.string().nullable().optional(),
            duration: zod_1.z.string().nullable().optional(),
        }),
    });
};
exports.createVisitSchema = createVisitSchema;
exports.updateVisitSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }),
    }),
    body: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90).optional(),
        lng: zod_1.z.number().min(-180).max(180).optional(),
        name: zod_1.z.string().min(1).max(255).optional(),
        address: zod_1.z.string().min(1).max(500).optional(),
        notes: zod_1.z.string().max(1000).nullable().optional(),
        phone: zod_1.z.string().min(5).max(20).optional(),
        status: zod_1.z.enum(["visit", "sales", "delivered"]).optional(),
        status_id: zod_1.z.string().nullable().optional(),
        sales_id: zod_1.z.string().nullable().optional(),
        product_id: zod_1.z.string().nullable().optional(),
        duration: zod_1.z.string().nullable().optional(),
    }),
});
exports.VisitIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Visitsexport 
const getAllVisits = async (req, res) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const querySalesId = req.query.sales_id;
    const queryStatusId = req.query.status_id;
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    // استقبال معايير فلترة التاريخ (صيغة المتوقع: YYYY-MM-DD)
    const fromDateStr = req.query.from; // مثلاً: 2026-05-05
    const toDateStr = req.query.to; // مثلاً: 2026-05-05
    const offset = (page - 1) * limit;
    let whereConditions = [];
    whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.status, "visit"));
    if (queryStatusId) {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.status_id, queryStatusId));
    }
    // 1. تطبيق الصلاحيات والفلترة الذكية لـ Drizzle
    if (userRole === "admin") {
        if (querySalesId) {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
        }
    }
    else if (userRole === "leader") {
        const teamSales = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.leader_id, userId), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")), (0, drizzle_orm_1.eq)(schema_1.users.id, userId)));
        const salesIds = teamSales.map(s => s.id);
        if (querySalesId) {
            if (salesIds.includes(querySalesId)) {
                whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
            }
            else {
                throw new BadRequest_1.BadRequest("You do not have access to this sales member's visits.");
            }
        }
        else {
            if (salesIds.length > 0) {
                whereConditions.push((0, drizzle_orm_1.inArray)(schema_1.visits.sales_id, salesIds));
            }
            else {
                return (0, response_1.SuccessResponse)(res, { allVisits: [], pagination: { total: 0, page, limit, totalPages: 0 } }, 200);
            }
        }
    }
    else if (userRole === "sales") {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, userId));
    }
    else {
        throw new BadRequest_1.BadRequest("Unauthorized role");
    }
    // 2. تطبيق البحث (Search) بناءً على الاسم، الإيميل، أو الهاتف
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.visits.name, searchPattern), // اسم العميل/الزيارة
        (0, drizzle_orm_1.like)(schema_1.visits.phone, searchPattern), // هاتف العميل/الزيارة
        (0, drizzle_orm_1.like)(schema_1.users.name, searchPattern), // اسم المندوب
        (0, drizzle_orm_1.like)(schema_1.users.email, searchPattern), // إيميل المندوب
        (0, drizzle_orm_1.like)(schema_1.users.phone, searchPattern) // هاتف المندوب
        ));
    }
    // 3. تطبيق الفلترة بالتاريخ بدون وقت (Date-only filter)
    // نستخدم الكائنات الافتراضية للوقت للتأكد من جلب اليوم كاملاً (من 00:00:00 إلى 23:59:59)
    if (fromDateStr) {
        const fromDate = new Date(`${fromDateStr}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.gte)(schema_1.visits.createdAt, fromDate));
        }
    }
    if (toDateStr) {
        const toDate = new Date(`${toDateStr}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.lte)(schema_1.visits.createdAt, toDate));
        }
    }
    const monthsParam = req.query.months;
    const yearParam = req.query.year;
    if (monthsParam && yearParam) {
        const months = monthsParam.split(',').map(Number).filter(m => !isNaN(m));
        const year = Number(yearParam);
        if (months.length > 0 && !isNaN(year)) {
            whereConditions.push((0, drizzle_orm_1.inArray)((0, drizzle_orm_1.sql) `MONTH(${schema_1.visits.createdAt})`, months));
            whereConditions.push((0, drizzle_orm_1.eq)((0, drizzle_orm_1.sql) `YEAR(${schema_1.visits.createdAt})`, year));
        }
    }
    let baseQuery = db_1.db
        .select({
        id: schema_1.visits.id,
        lat: schema_1.visits.lat,
        lng: schema_1.visits.lng,
        name: schema_1.visits.name,
        address: schema_1.visits.address,
        notes: schema_1.visits.notes,
        phone: schema_1.visits.phone,
        status: schema_1.visits.status,
        visit_status: schema_1.visitStatus.name,
        status_id: schema_1.visits.status_id,
        sales_id: schema_1.users.id,
        sales: schema_1.users.name,
        sales_phone: schema_1.users.phone,
        product_id: schema_1.visits.product_id,
        duration: schema_1.visits.duration,
        createdAt: (0, drizzle_orm_1.sql) `DATE_FORMAT(${schema_1.visits.createdAt}, '%Y-%m-%d')`,
    })
        .from(schema_1.visits)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.visits.createdAt))
        .$dynamic();
    // 5. استعلام لحساب العدد الإجمالي متوافق مع الفلاتر (Count Query)
    let countQuery = db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.visits)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id))
        .$dynamic();
    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        baseQuery = baseQuery.where((0, drizzle_orm_1.and)(...whereConditions));
        countQuery = countQuery.where((0, drizzle_orm_1.and)(...whereConditions));
    }
    // تنفيذ الاستعلامين معاً بالتوازي لتحسين الأداء
    const [allVisitsRaw, [{ total: totalCount }]] = await Promise.all([
        baseQuery.limit(limit).offset(offset),
        countQuery
    ]);
    // إضافة رابط الخريطة تلقائياً لكل زيارة
    const allVisits = allVisitsRaw.map((visit) => ({
        ...visit,
        map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
    }));
    // إرسال النتيجة مع معلومات الـ pagination الكاملة
    (0, response_1.SuccessResponse)(res, {
        allVisits,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};
exports.getAllVisits = getAllVisits;
// ✅ Get All Visitsexport 
const getAllSales = async (req, res) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const querySalesId = req.query.sales_id;
    const queryStatusId = req.query.status_id;
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    // استقبال معايير فلترة التاريخ (صيغة المتوقع: YYYY-MM-DD)
    const fromDateStr = req.query.from; // مثلاً: 2026-05-05
    const toDateStr = req.query.to; // مثلاً: 2026-05-05
    const offset = (page - 1) * limit;
    let whereConditions = [];
    whereConditions.push((0, drizzle_orm_1.ne)(schema_1.visits.status, "visit"));
    if (queryStatusId) {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.status_id, queryStatusId));
    }
    // 1. تطبيق الصلاحيات والفلترة الذكية لـ Drizzle
    if (userRole === "admin") {
        if (querySalesId) {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
        }
    }
    else if (userRole === "leader") {
        const teamSales = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.leader_id, userId), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")), (0, drizzle_orm_1.eq)(schema_1.users.id, userId)));
        const salesIds = teamSales.map(s => s.id);
        if (querySalesId) {
            if (salesIds.includes(querySalesId)) {
                whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
            }
            else {
                throw new BadRequest_1.BadRequest("You do not have access to this sales member's visits.");
            }
        }
        else {
            if (salesIds.length > 0) {
                whereConditions.push((0, drizzle_orm_1.inArray)(schema_1.visits.sales_id, salesIds));
            }
            else {
                return (0, response_1.SuccessResponse)(res, { allVisits: [], pagination: { total: 0, page, limit, totalPages: 0 } }, 200);
            }
        }
    }
    else if (userRole === "sales") {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, userId));
    }
    else {
        throw new BadRequest_1.BadRequest("Unauthorized role");
    }
    // 2. تطبيق البحث (Search) بناءً على الاسم، الإيميل، أو الهاتف
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.visits.name, searchPattern), // اسم العميل/الزيارة
        (0, drizzle_orm_1.like)(schema_1.visits.phone, searchPattern), // هاتف العميل/الزيارة
        (0, drizzle_orm_1.like)(schema_1.users.name, searchPattern), // اسم المندوب
        (0, drizzle_orm_1.like)(schema_1.users.email, searchPattern), // إيميل المندوب
        (0, drizzle_orm_1.like)(schema_1.users.phone, searchPattern) // هاتف المندوب
        ));
    }
    // 3. تطبيق الفلترة بالتاريخ بدون وقت (Date-only filter)
    // نستخدم الكائنات الافتراضية للوقت للتأكد من جلب اليوم كاملاً (من 00:00:00 إلى 23:59:59)
    if (fromDateStr) {
        const fromDate = new Date(`${fromDateStr}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.gte)(schema_1.visits.createdAt, fromDate));
        }
    }
    if (toDateStr) {
        const toDate = new Date(`${toDateStr}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.lte)(schema_1.visits.createdAt, toDate));
        }
    }
    const monthsParam = req.query.months;
    const yearParam = req.query.year;
    if (monthsParam && yearParam) {
        const months = monthsParam.split(',').map(Number).filter(m => !isNaN(m));
        const year = Number(yearParam);
        if (months.length > 0 && !isNaN(year)) {
            whereConditions.push((0, drizzle_orm_1.inArray)((0, drizzle_orm_1.sql) `MONTH(${schema_1.visits.createdAt})`, months));
            whereConditions.push((0, drizzle_orm_1.eq)((0, drizzle_orm_1.sql) `YEAR(${schema_1.visits.createdAt})`, year));
        }
    }
    // 4. بناء الاستعلام الأساسي (Base Query)
    let baseQuery = db_1.db
        .select({
        id: schema_1.visits.id,
        lat: schema_1.visits.lat,
        lng: schema_1.visits.lng,
        name: schema_1.visits.name,
        address: schema_1.visits.address,
        notes: schema_1.visits.notes,
        phone: schema_1.visits.phone,
        status: schema_1.visits.status,
        visit_status: schema_1.visitStatus.name,
        status_id: schema_1.visits.status_id,
        sales_id: schema_1.users.id,
        sales: schema_1.users.name,
        sales_phone: schema_1.users.phone,
        product_id: schema_1.visits.product_id,
        duration: schema_1.visits.duration,
        product: schema_1.products.name,
        createdAt: schema_1.visits.createdAt
    })
        .from(schema_1.visits)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id))
        .leftJoin(schema_1.products, (0, drizzle_orm_1.eq)(schema_1.visits.product_id, schema_1.products.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.visits.createdAt))
        .$dynamic();
    // 5. استعلام لحساب العدد الإجمالي متوافق مع الفلاتر (Count Query)
    let countQuery = db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.visits)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id))
        .$dynamic();
    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        baseQuery = baseQuery.where((0, drizzle_orm_1.and)(...whereConditions));
        countQuery = countQuery.where((0, drizzle_orm_1.and)(...whereConditions));
    }
    // تنفيذ الاستعلامين معاً بالتوازي لتحسين الأداء
    const [allVisitsRaw, [{ total: totalCount }]] = await Promise.all([
        baseQuery.limit(limit).offset(offset),
        countQuery
    ]);
    // إضافة رابط الخريطة تلقائياً لكل زيارة
    const allVisits = allVisitsRaw.map((visit) => ({
        ...visit,
        map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
    }));
    // إرسال النتيجة مع معلومات الـ pagination الكاملة
    (0, response_1.SuccessResponse)(res, {
        allVisits,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};
exports.getAllSales = getAllSales;
const getVisitsCounts = async (req, res) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const querySalesId = req.query.sales_id;
    const queryStatusId = req.query.status_id;
    // استقبال معايير البحث والتواريخ
    const search = req.query.search || '';
    const fromDateStr = req.query.from; // مثلاً: 2026-05-05
    const toDateStr = req.query.to; // مثلاً: 2026-05-05
    let whereConditions = [];
    if (queryStatusId) {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.status_id, queryStatusId));
    }
    // 1. تطبيق الصلاحيات والفلترة لـ Drizzle
    if (userRole === "admin") {
        if (querySalesId) {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
        }
    }
    else if (userRole === "leader") {
        const teamSales = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.leader_id, userId), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")), (0, drizzle_orm_1.eq)(schema_1.users.id, userId)));
        const salesIds = teamSales.map(s => s.id);
        if (querySalesId) {
            if (salesIds.includes(querySalesId)) {
                whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, querySalesId));
            }
            else {
                throw new BadRequest_1.BadRequest("You do not have access to this sales member's visits.");
            }
        }
        else {
            if (salesIds.length > 0) {
                whereConditions.push((0, drizzle_orm_1.inArray)(schema_1.visits.sales_id, salesIds));
            }
            else {
                return (0, response_1.SuccessResponse)(res, { visitCount: 0, notVisitCount: 0, total: 0 }, 200);
            }
        }
    }
    else if (userRole === "sales") {
        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, userId));
    }
    else {
        throw new BadRequest_1.BadRequest("Unauthorized role");
    }
    // 2. تطبيق البحث (Search)
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.visits.name, searchPattern), (0, drizzle_orm_1.like)(schema_1.visits.phone, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.name, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.email, searchPattern), (0, drizzle_orm_1.like)(schema_1.users.phone, searchPattern)));
    }
    // 3. تطبيق الفلترة بالتاريخ
    if (fromDateStr) {
        const fromDate = new Date(`${fromDateStr}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.gte)(schema_1.visits.createdAt, fromDate));
        }
    }
    if (toDateStr) {
        const toDate = new Date(`${toDateStr}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) {
            whereConditions.push((0, drizzle_orm_1.lte)(schema_1.visits.createdAt, toDate));
        }
    }
    // 4. استعلام واحد لحساب العدّين (visit و not visit) بناءً على الفلاتر
    const [countsResult] = await db_1.db
        .select({
        visitCount: (0, drizzle_orm_1.sql) `COALESCE(COUNT(CASE WHEN ${schema_1.visits.status} = 'visit' THEN 1 END), 0)`,
        notVisitCount: (0, drizzle_orm_1.sql) `COALESCE(COUNT(CASE WHEN ${schema_1.visits.status} != 'visit' THEN 1 END), 0)`,
    })
        .from(schema_1.visits)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id))
        .where(whereConditions.length > 0 ? (0, drizzle_orm_1.and)(...whereConditions) : undefined);
    const visitCount = Number(countsResult?.visitCount || 0);
    const notVisitCount = Number(countsResult?.notVisitCount || 0);
    const wishListsCount = (await db_1.db
        .select({
        id: schema_1.wishList.id
    })
        .from(schema_1.wishList)).length;
    // 5. إرسال الأعداد فقط في الاستجابة
    (0, response_1.SuccessResponse)(res, {
        visitCount, // عدد الزيارات التي حالتها تساوي "visit"
        salesCount: notVisitCount, // عدد الزيارات التي حالتها لا تساوي "visit"
        total: visitCount + notVisitCount, // الإجمالي
        wishListsCount
    }, 200);
};
exports.getVisitsCounts = getVisitsCounts;
// ✅ Get Active Visit Statuses
const lists = async (req, res) => {
    const visit_status = await db_1.db
        .select({
        id: schema_1.visitStatus.id,
        name: schema_1.visitStatus.name,
    })
        .from(schema_1.visitStatus)
        .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.status, true));
    const userId = req.user?.id;
    // 2. تعريف المتغير بالنوع الصحيح
    let sales = [];
    if (req.user?.role === "leader" && userId) {
        sales = await db_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            phone: schema_1.users.phone,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.leader_id, userId), (0, drizzle_orm_1.eq)(schema_1.users.role, "sales")), (0, drizzle_orm_1.eq)(schema_1.users.id, userId)));
    }
    else {
        sales = await db_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            phone: schema_1.users.phone,
        })
            .from(schema_1.users);
    }
    (0, response_1.SuccessResponse)(res, { visit_status, sales }, 200);
};
exports.lists = lists;
// ✅ Get Visits By ID
const getVisitsById = async (req, res) => {
    const validated = await exports.VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const visitRaw = await db_1.db
        .select({
        id: schema_1.visits.id,
        lat: schema_1.visits.lat,
        lng: schema_1.visits.lng,
        name: schema_1.visits.name,
        address: schema_1.visits.address,
        notes: schema_1.visits.notes,
        phone: schema_1.visits.phone,
        status: schema_1.visits.status,
        status_id: schema_1.visits.status_id,
        sales_id: schema_1.visits.sales_id,
        product_id: schema_1.visits.product_id,
        duration: schema_1.visits.duration,
    })
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    if (!visitRaw[0]) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    // التحقق من الصلاحيات للوصول لزيارة معينة
    if (req.user?.role === "sales" && visitRaw[0].sales_id !== req.user.id) {
        throw new BadRequest_1.BadRequest("You do not have permission to access this visit.");
    }
    const visit = {
        ...visitRaw[0],
        map_link: `https://www.google.com/maps/search/?api=1&query=${visitRaw[0].lat},${visitRaw[0].lng}`
    };
    (0, response_1.SuccessResponse)(res, { Visit: visit }, 200);
};
exports.getVisitsById = getVisitsById;
// ✅ Create Visits
const createVisits = async (req, res) => {
    const validated = await (0, exports.createVisitSchema)(req.user?.role).parseAsync({ body: req.body });
    const { lat, lng, name, address, notes, phone, status_id } = validated.body;
    // 1. تحديد قيمة الـ status بشكل آمن حسب الدور
    let status = "visit";
    if ((req.user?.role === "leader" || req.user?.role === "admin") && req.body.status) {
        status = req.body.status;
    }
    // 2. تحديد الـ sales_id المخصص للزيارة
    let sales_id;
    if (req.user?.role === "sales") {
        // موظف المبيعات تسند له الزيارة تلقائياً
        sales_id = req.user.id;
    }
    else if (req.user?.role === "leader") {
        // القائد يمكنه إسنادها لموظف مبيعات أو لنفسه إذا لم يحدد sales_id
        sales_id = validated.body.sales_id || req.user.id;
    }
    else {
        // الأدوار الأخرى (مثل Admin) يجب أن توفر sales_id في الـ body
        sales_id = validated.body.sales_id;
    }
    if (!sales_id) {
        throw new BadRequest_1.BadRequest("sales_id is required.");
    }
    // 🔍 3. التحقق من صحة وجود الـ sales_id في جدول المستخدمين
    const salesExist = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, sales_id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.role, "sales"), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader"))))
        .limit(1);
    if (!salesExist[0]) {
        throw new BadRequest_1.BadRequest("The assigned sales_id does not exist or user is not a sales member/leader.");
    }
    // 🔍 4. التحقق من صحة وجود الـ status_id في جدول الحالات إن أُرسل
    if (status_id) {
        const statusExist = await db_1.db
            .select({ id: schema_1.visitStatus.id })
            .from(schema_1.visitStatus)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, status_id), (0, drizzle_orm_1.eq)(schema_1.visitStatus.status, true)))
            .limit(1);
        if (!statusExist[0]) {
            throw new BadRequest_1.BadRequest("The assigned status_id does not exist or is inactive.");
        }
    }
    // 5. إنشاء الزيارة في قاعدة البيانات
    const insertData = {
        lat,
        lng,
        name,
        address,
        notes: notes || null,
        phone,
        status: status,
        status_id: status_id || null,
        sales_id,
    };
    if (validated.body.product_id !== undefined)
        insertData.product_id = validated.body.product_id;
    if (validated.body.duration !== undefined)
        insertData.duration = validated.body.duration;
    if ((status === "sales" || status === "delivered") && validated.body.product_id && validated.body.duration && (req.user?.role === "leader" || req.user?.role === "admin")) {
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, validated.body.product_id)).limit(1);
        if (product[0] && product[0].points) {
            let pointsData = product[0].points;
            if (typeof pointsData === 'string') {
                try {
                    pointsData = JSON.parse(pointsData);
                }
                catch (e) {
                    pointsData = [];
                }
            }
            if (Array.isArray(pointsData)) {
                const pointEntry = pointsData.find((p) => p.duration === validated.body.duration);
                if (pointEntry) {
                    insertData.points = pointEntry.point;
                }
            }
        }
    }
    await db_1.db.insert(schema_1.visits).values(insertData);
    (0, response_1.SuccessResponse)(res, { message: "Visit created successfully" }, 201);
};
exports.createVisits = createVisits;
// ✅ Update Visits
const updateVisits = async (req, res) => {
    const validated = await exports.updateVisitSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { lat, lng, name, address, notes, phone, status, status_id } = validated.body;
    // 🔍 1. التأكد من وجود الزيارة الأصلية
    const existingVisit = await db_1.db
        .select()
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    const currentVisit = existingVisit[0];
    if (!currentVisit) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    // 🔒 منع Sales من تعديل زيارة لا تخصه
    if (req.user?.role === "sales" && currentVisit.sales_id !== req.user.id) {
        throw new BadRequest_1.BadRequest("You do not have permission to modify this visit.");
    }
    let sales_id = req.body.sales_id;
    // 🔍 2. التحقق من وجود الـ sales_id الجديد إذا تم تعيينه أو تعديله
    if (sales_id !== undefined && sales_id !== null) {
        const salesExist = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, sales_id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.role, "sales"), (0, drizzle_orm_1.eq)(schema_1.users.role, "leader"))))
            .limit(1);
        if (!salesExist[0]) {
            throw new BadRequest_1.BadRequest("The updated sales_id does not exist.");
        }
    }
    // 🔍 3. التحقق من وجود الـ status_id الجديد إذا تم تعديله
    if (status_id !== undefined && status_id !== null) {
        const statusExist = await db_1.db
            .select({ id: schema_1.visitStatus.id })
            .from(schema_1.visitStatus)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, status_id), (0, drizzle_orm_1.eq)(schema_1.visitStatus.status, true)))
            .limit(1);
        if (!statusExist[0]) {
            throw new BadRequest_1.BadRequest("The updated status_id does not exist.");
        }
    }
    const updateData = {};
    if (lat !== undefined)
        updateData.lat = lat;
    if (lng !== undefined)
        updateData.lng = lng;
    if (name !== undefined)
        updateData.name = name;
    if (address !== undefined)
        updateData.address = address;
    if (notes !== undefined)
        updateData.notes = notes;
    if (phone !== undefined)
        updateData.phone = phone;
    if (status_id !== undefined)
        updateData.status_id = status_id;
    if (sales_id !== undefined && req.user?.role !== "sales")
        updateData.sales_id = sales_id;
    if (validated.body.product_id !== undefined)
        updateData.product_id = validated.body.product_id;
    if (validated.body.duration !== undefined)
        updateData.duration = validated.body.duration;
    // التعامل مع الـ Status ورتب المستخدمين (Roles)
    if (status !== undefined) {
        if (req.user?.role === "sales") {
            if (!req.user.id) {
                throw new BadRequest_1.BadRequest("User ID is missing.");
            }
            // فحص ما إذا كان هناك طلب معلق لنفس الحالة سلفًا
            const request_item = await db_1.db
                .select({ id: schema_1.statusRequest.id })
                .from(schema_1.statusRequest)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.statusRequest.visitId, currentVisit.id), (0, drizzle_orm_1.eq)(schema_1.statusRequest.from, currentVisit.status), (0, drizzle_orm_1.eq)(schema_1.statusRequest.to, status), (0, drizzle_orm_1.eq)(schema_1.statusRequest.userId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.statusRequest.status, "pending")))
                .limit(1);
            // إذا لم يكن هناك طلب معلق، نقوم بإنشائه
            if (!request_item[0]) {
                await db_1.db.insert(schema_1.statusRequest).values({
                    visitId: currentVisit.id,
                    from: currentVisit.status,
                    to: status,
                    userId: req.user.id,
                    status: "pending",
                });
            }
        }
        else {
            // الأدوار الأخرى (Admin / Leader) -> تغيير مباشر
            updateData.status = status;
            if ((status === "sales" || status === "delivered") && validated.body.product_id && validated.body.duration) {
                const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, validated.body.product_id)).limit(1);
                if (product[0] && product[0].points) {
                    let pointsData = product[0].points;
                    if (typeof pointsData === 'string') {
                        try {
                            pointsData = JSON.parse(pointsData);
                        }
                        catch (e) {
                            pointsData = [];
                        }
                    }
                    if (Array.isArray(pointsData)) {
                        const pointEntry = pointsData.find((p) => p.duration === validated.body.duration);
                        if (pointEntry) {
                            updateData.points = pointEntry.point;
                        }
                    }
                }
            }
        }
    }
    // شرط التحديث في قاعدة البيانات
    let updateConditions = (0, drizzle_orm_1.eq)(schema_1.visits.id, id);
    if (req.user?.role === "sales") {
        updateConditions = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.visits.id, id), (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, req.user.id));
    }
    // تنفيذ الـ Update فقط إذا كان هناك حقول للتعديل تجنباً لأخطاء SQL Syntax
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.visits).set(updateData).where(updateConditions);
    }
    (0, response_1.SuccessResponse)(res, { message: "Visit updated successfully" }, 200);
};
exports.updateVisits = updateVisits;
// ✅ Delete Visits
const deleteVisits = async (req, res) => {
    const validated = await exports.VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingVisit = await db_1.db
        .select()
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    if (!existingVisit[0]) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    // بناء شروط الحذف الآمن في استعلام موحد لمنع تكرار دالة .where() الخاطئ
    let deleteConditions = (0, drizzle_orm_1.eq)(schema_1.visits.id, id);
    if (req.user?.role === "leader" || req.user?.role === "sales") {
        deleteConditions = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.visits.id, id), (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, req.user.id));
    }
    const deleteResult = await db_1.db.delete(schema_1.visits).where(deleteConditions);
    (0, response_1.SuccessResponse)(res, { message: "Visit deleted successfully" }, 200);
};
exports.deleteVisits = deleteVisits;
