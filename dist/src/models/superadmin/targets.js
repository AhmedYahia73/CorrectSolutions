"use strict";
// src/models/schema/targets.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.targets = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// // تعريف نوع الصلاحيات
// export type SuperAdminPermission = {
//   module: string;
//   actions: { id?: string; action: string }[];
// };
// داخل export
//   permissions: json("permissions").$type<SuperAdminPermission[]>().default([]),
/**
 * @openapi
 * components:
 *   schemas:
 *     Target:
 *       type: object
 *       required:
 *         - name
 *         - number
 *         - year
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         type:
 *           type: string
 *           enum: [visit, sales]
 *           default: visit
 *           description: The type of target (visit count or sales amount)
 *           example: "sales"
 *         name:
 *           type: string
 *           description: The name/title of the target
 *           example: "تارجت مبيعات الربع الأول"
 *         number:
 *           type: number
 *           format: double
 *           description: The target metric number (value in currency or visits count)
 *           example: 150000.00
 *         year:
 *           type: int
 *           description: The target year
 *           example: 2026
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
exports.targets = (0, mysql_core_1.mysqlTable)("targets", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    type: (0, mysql_core_1.mysqlEnum)("type", ["visit", "sales", "points"]).default("visit"),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
