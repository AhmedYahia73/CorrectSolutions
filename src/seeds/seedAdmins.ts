import { db } from "../models/db";
import { users } from "../models/schema";
import bcrypt from "bcrypt";

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await db.insert(users).values({
      name: "Admin User",
      email: "admin@correctsolution.com",
      phone: "01000000000",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin seeded successfully.");
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    process.exit(0);
  }
}

seed();
