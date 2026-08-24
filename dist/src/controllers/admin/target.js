"use strict";
// src/controllers/Sales/SalesController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTargets = exports.updateTargets = exports.createTargets = exports.getTargetsById = exports.lists = exports.getAllTargets = exports.getAllTargetsSchema = exports.targetIdSchema = exports.updateTargetSchema = exports.createTargetSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
exports.createTargetSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales", "points"], {
            required_error: "Type is required",
            invalid_type_error: "Type must be either 'visit', 'sales', or 'points'",
        }).default("visit"),
        name: zod_1.z.string({
            required_error: "Name is required",
        })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        items: zod_1.z.array(zod_1.z.object({
            year: zod_1.z.number({ required_error: "Year is required" }).int(),
            month: zod_1.z.number({ required_error: "Month is required" }).int().min(1).max(12),
            number: zod_1.z.number({ required_error: "Monthly target number is required" }).positive(),
        }), { required_error: "Items are required" }).min(1, "At least one target item is required"),
        sales: zod_1.z.array(zod_1.z.string({ invalid_type_error: "Sales User ID must be a string" }).uuid("Invalid User ID format"), { required_error: "Sales users array is required" }).min(1, "At least one sales user must be assigned"),
    }),
});
exports.updateTargetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }),
    }),
    body: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales", "points"]).optional(),
        name: zod_1.z.string().min(1, "Name cannot be empty").max(255).optional(),
    }),
});
exports.targetIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }),
    }),
});
exports.getAllTargetsSchema = zod_1.z.object({
    params: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales"]).optional(),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Targets
const getAllTargets = async (req, res) => {
    const validated = await exports.getAllTargetsSchema.parseAsync({ params: req.params });
    const { type } = validated.params;
    let query = db_1.db
        .select({
        id: schema_1.targets.id,
        type: schema_1.targets.type,
        name: schema_1.targets.name,
        createdAt: schema_1.targets.createdAt,
    })
        .from(schema_1.targets);
    if (type) {
        query = query.where((0, drizzle_orm_1.eq)(schema_1.targets.type, type));
    }
    const alltargets = await query;
    (0, response_1.SuccessResponse)(res, { targets: alltargets }, 200);
};
exports.getAllTargets = getAllTargets;
// ✅ Get Target By ID (معدلة لجلب التارجت مع الـ items والـ sales المعنيين)
const lists = async (req, res) => {
    const sales = await db_1.db
        .select({
        id: schema_1.users.id,
        phone: schema_1.users.phone,
        name: schema_1.users.name,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.role, "sales"));
    (0, response_1.SuccessResponse)(res, {
        sales
    }, 200);
};
exports.lists = lists;
// ✅ Get Target By ID (معدلة لجلب التارجت مع الـ items والـ sales المعنيين)
const getTargetsById = async (req, res) => {
    const validated = await exports.targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    // 1. جلب التارجت الرئيسي
    const targetResult = await db_1.db
        .select({
        id: schema_1.targets.id,
        type: schema_1.targets.type,
        name: schema_1.targets.name,
        createdAt: schema_1.targets.createdAt,
        updatedAt: schema_1.targets.updatedAt,
    })
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    const target = targetResult[0];
    if (!target) {
        throw new NotFound_1.NotFound("Target not found");
    }
    // 2. جلب العناصر المرتبطة (target_items) واستعلام المبيعات (target_sales) بالتوازي لمستوى أداء أسرع
    const [items, salesList] = await Promise.all([
        db_1.db
            .select({
            id: schema_1.target_items.id,
            year: schema_1.target_items.year,
            month: schema_1.target_items.month,
            number: schema_1.target_items.number,
        })
            .from(schema_1.target_items)
            .where((0, drizzle_orm_1.eq)(schema_1.target_items.target_id, id)),
        db_1.db
            .select({
            id: schema_1.target_sales.id,
            user: {
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email,
                role: schema_1.users.role,
            },
        })
            .from(schema_1.target_sales)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.target_sales.user_id, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.target_sales.target_id, id)),
    ]);
    (0, response_1.SuccessResponse)(res, {
        target: {
            ...target,
            items,
            sales: salesList,
        }
    }, 200);
};
exports.getTargetsById = getTargetsById;
// ✅ Create Targets
const createTargets = async (req, res) => {
    const validated = await exports.createTargetSchema.parseAsync({ body: req.body });
    const { type, name, items, sales } = validated.body;
    const targetId = crypto_1.default.randomUUID();
    await db_1.db.transaction(async (tx) => {
        // 1. إدخال التارجت الرئيسي
        await tx.insert(schema_1.targets).values({
            id: targetId,
            type,
            name,
        });
        // 2. إدخال عناصر التارجت (items)
        const itemsToInsert = items.map(item => ({
            target_id: targetId,
            year: item.year,
            month: item.month,
            number: item.number
        }));
        await tx.insert(schema_1.target_items).values(itemsToInsert);
        // 3. إدخال الموظفين المسند لهم التارجت (sales)
        const salesToInsert = sales.map(userId => ({
            target_id: targetId,
            user_id: userId
        }));
        await tx.insert(schema_1.target_sales).values(salesToInsert);
    });
    (0, response_1.SuccessResponse)(res, { id: targetId, message: "Target along with items and sales assigned successfully" }, 201);
};
exports.createTargets = createTargets;
// ✅ Update Targets
const updateTargets = async (req, res) => {
    const validated = await exports.updateTargetSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const bodyData = validated.body;
    const existingTargets = await db_1.db
        .select({ id: schema_1.targets.id })
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    if (!existingTargets[0]) {
        throw new NotFound_1.NotFound("Target not found");
    }
    const updateData = Object.fromEntries(Object.entries(bodyData).filter(([_, value]) => value !== undefined));
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.targets).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.targets.id, id));
    }
    (0, response_1.SuccessResponse)(res, { message: "Target updated successfully" }, 200);
};
exports.updateTargets = updateTargets;
// ✅ Delete Targets
const deleteTargets = async (req, res) => {
    const validated = await exports.targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingTargets = await db_1.db
        .select({ id: schema_1.targets.id })
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    if (!existingTargets[0]) {
        throw new NotFound_1.NotFound("Target not found");
    }
    // سيتم حذف target_items و target_sales أوتوماتيكياً بسبب onDelete: "cascade"
    await db_1.db.delete(schema_1.targets).where((0, drizzle_orm_1.eq)(schema_1.targets.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Target deleted successfully" }, 200);
};
exports.deleteTargets = deleteTargets;
