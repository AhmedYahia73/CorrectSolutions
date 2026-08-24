"use strict";
// src/models/schema/target_items.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.target_items = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const targets_1 = require("./targets");
/**
 * @openapi
 * components:
 *   schemas:
 *     TargetItem:
 *       type: object
 *       required:
 *         - year
 *         - month
 *         - number
 *         - target_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target item
 *           example: "i1111111-1111-1111-1111-111111111111"
 *         year:
 *           type: integer
 *           description: The year for this specific target breakdown
 *           example: 2026
 *         month:
 *           type: integer
 *           description: The month number (1-12)
 *           example: 1
 *         number:
 *           type: number
 *           format: double
 *           description: The specific target metric number for this month
 *           example: 12500.00
 *         target_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the parent target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
exports.target_items = (0, mysql_core_1.mysqlTable)("target_items", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    year: (0, mysql_core_1.int)("year").notNull(),
    month: (0, mysql_core_1.int)("month").notNull(),
    number: (0, mysql_core_1.double)("number").notNull(),
    target_id: (0, mysql_core_1.char)("target_id", { length: 36 }).references(() => targets_1.targets.id, { onDelete: "cascade" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
