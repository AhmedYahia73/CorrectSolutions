"use strict";
// src/models/schema/statusRequest.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusRequest = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
const visits_1 = require("./visits");
/**
 * @openapi
 * components:
 *   schemas:
 *     StatusRequest:
 *       type: object
 *       required:
 *         - visitId
 *         - userId
 *         - from
 *         - to
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the status request
 *           example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *         visitId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated visit
 *           example: "v1111111-1111-1111-1111-111111111111"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user creating the request
 *           example: "u1111111-1111-1111-1111-111111111111"
 *         from:
 *           type: string
 *           enum: [visit, sales, delivered]
 *           description: Current status before the request
 *           example: "visit"
 *         to:
 *           type: string
 *           enum: [visit, sales, delivered]
 *           description: Requested status
 *           example: "sales"
 *         status:
 *           type: string
 *           enum: [pending, approve, reject]
 *           default: pending
 *           description: Approval status of the request
 *           example: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
exports.statusRequest = (0, mysql_core_1.mysqlTable)("status_requests", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    visitId: (0, mysql_core_1.char)("visit_id", { length: 36 })
        .notNull()
        .references(() => visits_1.visits.id, { onDelete: "cascade" }),
    userId: (0, mysql_core_1.char)("user_id", { length: 36 })
        .notNull()
        .references(() => users_1.users.id, { onDelete: "cascade" }),
    from: (0, mysql_core_1.mysqlEnum)("from", ["visit", "sales", "delivered"]).notNull(),
    to: (0, mysql_core_1.mysqlEnum)("to", ["visit", "sales", "delivered"]).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "approve", "reject"]).default("pending").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
