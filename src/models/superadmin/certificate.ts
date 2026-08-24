// src/models/schema/visits.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  double,
  int,
  json,
  datetime
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm"; 

export const certificate = mysqlTable("certificate", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  certificate_name: varchar("certificate_name", { length: 255 }).notNull(),
  qr: varchar("qr", { length: 255 }).notNull(),
  date: datetime("date").notNull(),
  images: json("images").notNull(),
   
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
