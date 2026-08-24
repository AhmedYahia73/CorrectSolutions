// fix-db.ts

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function fixDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "bus",
    });

    try {
        console.log("🔄 جاري إصلاح الداتابيز...");

        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        // جلب كل الجداول
        const [tables]: any = await connection.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'bus'
        `);

        // حذف كل الجداول
        for (const table of tables) {
            const tableName = table.TABLE_NAME || table.table_name;
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`🗑️ حذف: ${tableName}`);
        }

        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ تم حذف كل الجداول!");
    } catch (error) {
        console.error("❌ خطأ:", error);
    } finally {
        await connection.end();
    }
}

fixDatabase();
