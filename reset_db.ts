
import { db, pool } from "./src/models/db";
import { sql } from "drizzle-orm";
import { parents, drivers, codrivers, students, rides } from "./src/models/schema";

async function main() {
    console.log("Resetting specific tables...");

    try {
        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);

        // Clear tables involved in migration conflicts
        await db.execute(sql`TRUNCATE TABLE parents`);
        await db.execute(sql`TRUNCATE TABLE drivers`);
        await db.execute(sql`TRUNCATE TABLE codrivers`);
        await db.execute(sql`TRUNCATE TABLE route_pickup_points`); // Depends on pickup_points
        await db.execute(sql`TRUNCATE TABLE pickup_points`); // Conflict: zone_id
        await db.execute(sql`TRUNCATE TABLE zones`);
        await db.execute(sql`TRUNCATE TABLE cities`);
        await db.execute(sql`TRUNCATE TABLE plan`); // Conflict: price columns
        await db.execute(sql`TRUNCATE TABLE zones`);
        await db.execute(sql`TRUNCATE TABLE cities`);
        await db.execute(sql`TRUNCATE TABLE students`); // Depends on parents
        await db.execute(sql`TRUNCATE TABLE rides`);    // Depends on drivers/codrivers
        await db.execute(sql`TRUNCATE TABLE email_verifications`); // Depends on parents

        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

        console.log("Tables reset successfully.");
    } catch (err) {
        console.error("Error resetting tables:", err);
    } finally {
        process.exit(0);
    }
}

main();
