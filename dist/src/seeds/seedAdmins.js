"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function seed() {
    try {
        const hashedPassword = await bcrypt_1.default.hash("123456", 10);
        await db_1.db.insert(schema_1.users).values({
            name: "Admin User",
            email: "admin@gmail.com",
            phone: "123456789",
            password: hashedPassword,
            role: "admin",
        });
        console.log("Admin seeded successfully.");
    }
    catch (error) {
        console.error("Error seeding admin:", error);
    }
    finally {
        process.exit(0);
    }
}
seed();
