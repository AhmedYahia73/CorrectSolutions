"use strict";
// src/models/schema/visits.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificate = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.certificate = (0, mysql_core_1.mysqlTable)("certificate", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    company_name: (0, mysql_core_1.varchar)("company_name", { length: 255 }).notNull(),
    certificate_name: (0, mysql_core_1.varchar)("certificate_name", { length: 255 }).notNull(),
    qr: (0, mysql_core_1.varchar)("qr", { length: 255 }).notNull(),
    date: (0, mysql_core_1.datetime)("date").notNull(),
    images: (0, mysql_core_1.json)("images").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
