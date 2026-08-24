"use strict";
// src/models/schema/target_sales.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.target_sales = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const targets_1 = require("./targets"); // تأكد أن جدول targets الرئيسي معرف في ملف "./targets"
const users_1 = require("./users");
/**
 * @openapi
 * components:
 *   schemas:
 *     TargetSale:
 *       type: object
 *       required:
 *         - target_id
 *         - user_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target sale assignment
 *           example: "s1111111-1111-1111-1111-111111111111"
 *         target_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the assigned sales user
 *           example: "u1111111-1111-1111-1111-111111111111"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Assignment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
exports.target_sales = (0, mysql_core_1.mysqlTable)("target_sales", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    target_id: (0, mysql_core_1.char)("target_id", { length: 36 }).references(() => targets_1.targets.id, { onDelete: "cascade" }),
    user_id: (0, mysql_core_1.char)("user_id", { length: 36 }).references(() => users_1.users.id, { onDelete: "cascade" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
