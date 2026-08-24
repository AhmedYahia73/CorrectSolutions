import bcrypt from "bcrypt";

async function testBcrypt() {
  console.log("=== Bcrypt Password Hashing Test ===\n");

  // The password to hash
  const password = "123456";
  console.log("Original Password:", password);

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("Hashed Password:", hashedPassword);
  console.log("Hash Length:", hashedPassword.length);

  console.log("\n--- Testing Password Comparison ---\n");

  // Test with correct password
  const correctMatch = await bcrypt.compare(password, hashedPassword);
  console.log("Correct password match:", correctMatch); // Should be true

  // Test with wrong password
  const wrongPassword = "wrongPassword";
  const wrongMatch = await bcrypt.compare(wrongPassword, hashedPassword);
  console.log("Wrong password match:", wrongMatch); // Should be false

  console.log("\n--- Hashing the same password twice ---\n");
  
  // Hash the same password again
  const hashedPassword2 = await bcrypt.hash(password, saltRounds);
  console.log("First Hash:", hashedPassword);
  console.log("Second Hash:", hashedPassword2);
  console.log("Are they the same?", hashedPassword === hashedPassword2); // Should be false
  console.log("Do they both match the original?", 
    await bcrypt.compare(password, hashedPassword2)); // Should be true
}

testBcrypt().catch(console.error);