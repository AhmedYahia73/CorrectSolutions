import { db } from "./src/models/db";
import { sql } from "drizzle-orm";

async function runMigration() {
    try {
        await db.execute(sql`ALTER TABLE visits ADD COLUMN points INT;`);
        console.log("Successfully added 'points' column to visits table.");
    } catch (e: any) {
        if (e.message.includes("Duplicate column name")) {
            console.log("'points' column already exists in visits table.");
        } else {
            console.error("Migration failed:", e.message);
        }
    }
    
    // Also try adding product_id and duration if they are missing
    try {
        await db.execute(sql`ALTER TABLE visits ADD COLUMN product_id CHAR(36);`);
        console.log("Successfully added 'product_id' column to visits table.");
    } catch (e: any) {
        if (e.message.includes("Duplicate column name")) {
            console.log("'product_id' column already exists in visits table.");
        } else {
            console.error("Migration failed:", e.message);
        }
    }

    try {
        await db.execute(sql`ALTER TABLE visits ADD COLUMN duration VARCHAR(50);`);
        console.log("Successfully added 'duration' column to visits table.");
    } catch (e: any) {
        if (e.message.includes("Duplicate column name")) {
            console.log("'duration' column already exists in visits table.");
        } else {
            console.error("Migration failed:", e.message);
        }
    }

    process.exit(0);
}

runMigration();
