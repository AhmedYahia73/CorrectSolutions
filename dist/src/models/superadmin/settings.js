"use strict";
// src/models/schema/visits.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.settings = (0, mysql_core_1.mysqlTable)("settings", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    logo: (0, mysql_core_1.varchar)("logo", { length: 255 }),
    brand_name: (0, mysql_core_1.varchar)("brand_name", { length: 255 }),
    qr: (0, mysql_core_1.varchar)("qr", { length: 255 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
