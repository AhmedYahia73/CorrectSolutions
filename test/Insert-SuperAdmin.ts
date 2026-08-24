import { db } from "../src/models/db";
import { superAdmins } from "../src/models/superadmin/superadmin";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
async function insertSuperAdmin() {
  try {
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || "admin123", 10);
    console.log("Inserting super admin...");
    const [result] = await db.insert(superAdmins).values({
      name: process.env.SUPER_ADMIN_NAME || "Wego",
      email: process.env.SUPER_ADMIN_EMAIL || "admin@example.com",
      passwordHashed: hashedPassword,
    });

    console.log("✅ Super admin inserted successfully!");
    console.log("Inserted ID:", result.insertId);
  } catch (error: any) {
    console.error("❌ Error inserting super admin:");
    console.error(error.message);
  } finally {
    process.exit();
  }
}

insertSuperAdmin();