// src/models/schema/users.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  AnyMySqlColumn
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm"; 
export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`), 

  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), 
  role: mysqlEnum("role", ["admin", "user", "leader", "sales"]).notNull().default("admin"), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
