"use strict";
// src/models/schema/visits.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.visits = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const visitStatus_1 = require("./visitStatus");
const users_1 = require("./users");
const products_1 = require("./products");
exports.visits = (0, mysql_core_1.mysqlTable)("visits", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    lat: (0, mysql_core_1.double)("lat").notNull(),
    lng: (0, mysql_core_1.double)("lng").notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.varchar)("address", { length: 500 }).notNull(),
    notes: (0, mysql_core_1.varchar)("notes", { length: 1000 }),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull(),
    points: (0, mysql_core_1.int)("points"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["visit", "sales", "delivered"]).default("visit"),
    status_id: (0, mysql_core_1.char)("status_id", { length: 36 }).references(() => visitStatus_1.visitStatus.id, { onDelete: "set null" }),
    sales_id: (0, mysql_core_1.char)("sales_id", { length: 36 }).references(() => users_1.users.id, { onDelete: "set null" }),
    product_id: (0, mysql_core_1.char)("product_id", { length: 36 }).references(() => products_1.products.id, { onDelete: "set null" }),
    duration: (0, mysql_core_1.varchar)("duration", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
