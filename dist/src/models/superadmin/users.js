"use strict";
// src/models/schema/users.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 200 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }).notNull().unique(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull().unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    role: (0, mysql_core_1.mysqlEnum)("role", ["admin", "user", "leader", "sales"]).notNull().default("admin"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
