"use strict";
// src/controllers/Sales/SalesController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVisitStatuss = exports.updateVisitStatuss = exports.createVisitStatuss = exports.getVisitStatussById = exports.getAllVisitStatuss = exports.VisitStatusIdSchema = exports.updateVisitStatusSchema = exports.createVisitStatusSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء هدف جديد
exports.createVisitStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: "Name is required",
        }).min(1, "Name cannot be empty"),
        status: zod_1.z.boolean({
            required_error: "Status is required",
            invalid_type_error: "Status must be a boolean (true or false)",
        }),
    }),
});
// الـ Schema الخاص بتحديث هدف (البيانات اختيارية ولكن إذا أُرسلت يجب أن تكون صالحة)
exports.updateVisitStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في الداتابيز
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name cannot be empty").optional(),
        status: zod_1.z.boolean({ invalid_type_error: "Status must be a boolean" }).optional(),
    }),
});
// الـ Schema الخاص بالعمليات التي تتطلب ID فقط (مثل جلب عنصر محدد أو حذفه)
exports.VisitStatusIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All VisitStatuss
const getAllVisitStatuss = async (req, res) => {
    // بناء الاستعلام الأساسي لجلب حالات الزيارة
    const query = db_1.db
        .select({
        id: schema_1.visitStatus.id,
        name: schema_1.visitStatus.name,
        status: schema_1.visitStatus.status,
    })
        .from(schema_1.visitStatus);
    const allVisitStatuss = await query;
    // إرسال الرد
    (0, response_1.SuccessResponse)(res, { allVisitStatuss: allVisitStatuss }, 200);
};
exports.getAllVisitStatuss = getAllVisitStatuss;
// ✅ Get VisitStatuss By ID
const getVisitStatussById = async (req, res) => {
    // التحقق من صحة الـ ID المبعوث في الـ Params
    const validated = await exports.VisitStatusIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const VisitStatuss = await db_1.db
        .select({
        id: schema_1.visitStatus.id,
        name: schema_1.visitStatus.name,
        status: schema_1.visitStatus.status,
    })
        .from(schema_1.visitStatus)
        .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, id))
        .limit(1);
    if (!VisitStatuss[0]) {
        throw new NotFound_1.NotFound("VisitStatuss not found");
    }
    (0, response_1.SuccessResponse)(res, { VisitStatuss: VisitStatuss[0] }, 200);
};
exports.getVisitStatussById = getVisitStatussById;
// ✅ Create VisitStatuss
const createVisitStatuss = async (req, res) => {
    // التحقق من صحة البيانات المرسلة في الـ Body
    const validated = await exports.createVisitStatusSchema.parseAsync({ body: req.body });
    const { status, name } = validated.body;
    await db_1.db.insert(schema_1.visitStatus).values({
        status,
        name,
    });
    (0, response_1.SuccessResponse)(res, { message: "VisitStatuss created successfully" }, 201);
};
exports.createVisitStatuss = createVisitStatuss;
// ✅ Update VisitStatuss
const updateVisitStatuss = async (req, res) => {
    // التحقق من الـ ID والبيانات المرسلة للتعديل
    const validated = await exports.updateVisitStatusSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { status, name } = validated.body;
    // التأكد أولاً من أن الـ VisitStatus موجود بالفعل في قاعدة البيانات
    const existingVisitStatuss = await db_1.db
        .select()
        .from(schema_1.visitStatus)
        .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, id))
        .limit(1);
    if (!existingVisitStatuss[0]) {
        throw new NotFound_1.NotFound("VisitStatuss not found");
    }
    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined للداتابيز
    const updateData = {};
    if (status !== undefined)
        updateData.status = status;
    if (name !== undefined)
        updateData.name = name;
    await db_1.db.update(schema_1.visitStatus).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, id));
    (0, response_1.SuccessResponse)(res, { message: "VisitStatuss updated successfully" }, 200);
};
exports.updateVisitStatuss = updateVisitStatuss;
// ✅ Delete VisitStatuss
const deleteVisitStatuss = async (req, res) => {
    // التحقق من الـ ID المبعوث في الـ Params
    const validated = await exports.VisitStatusIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingVisitStatuss = await db_1.db
        .select()
        .from(schema_1.visitStatus)
        .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, id))
        .limit(1);
    if (!existingVisitStatuss[0]) {
        throw new NotFound_1.NotFound("VisitStatuss not found");
    }
    await db_1.db.delete(schema_1.visitStatus).where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, id));
    (0, response_1.SuccessResponse)(res, { message: "VisitStatuss deleted successfully" }, 200);
};
exports.deleteVisitStatuss = deleteVisitStatuss;
