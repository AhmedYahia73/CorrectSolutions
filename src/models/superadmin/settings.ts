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

export const settings = mysqlTable("settings", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  logo: varchar("logo", { length: 255 }),
  brand_name: varchar("brand_name", { length: 255 }),
  qr: varchar("qr", { length: 255 }).notNull(),
   
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
