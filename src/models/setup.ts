import mysql from "mysql2/promise";
import "dotenv/config";

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
  });

  const dbName = process.env.DB_NAME || "systigo";

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  
  console.log(`Database "${dbName}" created successfully!`);
  
  await connection.end();
}
createDatabase().catch(console.error);
