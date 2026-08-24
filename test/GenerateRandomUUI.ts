import { randomUUID } from "crypto";

function generateUUIDs() {
  console.log("=== UUID Generator ===\n");

  // Generate a single UUID
  const uuid1 = randomUUID();
  console.log("UUID 1:", uuid1);

  // Generate multiple UUIDs
  console.log("\nGenerating 5 UUIDs:");
  for (let i = 1; i <= 5; i++) {
    console.log(`UUID ${i}:`, randomUUID());
  }

  // Generate UUIDs in different formats
  console.log("\n--- UUID Formats ---");
  const uuid = randomUUID();
  console.log("Standard:", uuid);
  console.log("Uppercase:", uuid.toUpperCase());
  console.log("No hyphens:", uuid.replace(/-/g, ""));
  
  // Show UUID structure
  console.log("\n--- UUID Structure ---");
  const parts = uuid.split("-");
  console.log("Full UUID:", uuid);
  console.log("Part 1 (8 chars):", parts[0]);
  console.log("Part 2 (4 chars):", parts[1]);
  console.log("Part 3 (4 chars):", parts[2]);
  console.log("Part 4 (4 chars):", parts[3]);
  console.log("Part 5 (12 chars):", parts[4]);
}

generateUUIDs();