"use strict";
// src/models/schema/visits.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.products = (0, mysql_core_1.mysqlTable)("products", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    feez: (0, mysql_core_1.double)("feez").default(0),
    description: (0, mysql_core_1.varchar)("description", { length: 1000 }),
    demo_link: (0, mysql_core_1.varchar)("demo_link", { length: 200 }),
    points: (0, mysql_core_1.json)("points").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
