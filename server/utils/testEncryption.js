const { EncryptionEngine, EncryptionError } = require("./encryptionEngine");

async function testEncryptionMechanism() {
  console.log("=== Testing Encryption Mechanism ===");

  const encryptor = new EncryptionEngine({
    secretKey: "TestSecretKey2024ForFitSync",
    enabled: true,
  });

  console.log("\nTest 1: Basic encryption/decryption roundtrip");
  const testData = {
    message: "Hello FitSync",
    number: 42,
    nested: { calories: 350, protein: 25 },
  };

  try {
    const encrypted = encryptor.encrypt(testData);
    console.log("Encrypted data structure:", {
      hasCiphertext: !!encrypted.ciphertext,
      hasIV: !!encrypted.iv,
      algorithm: encrypted.algorithm,
    });

    const decrypted = encryptor.decrypt(encrypted);
    const isValid = JSON.stringify(testData) === JSON.stringify(decrypted);

    console.log("Test 1:", isValid ? "PASSED" : "FAILED");
    if (!isValid) {
      console.log("Original:", testData);
      console.log("Decrypted:", decrypted);
    }
  } catch (error) {
    console.log("Test 1 FAILED:", error.message);
  }

  console.log("\nTest 2: Meal data encryption");
  const mealData = {
    id: 123,
    name: "Avocado Toast",
    calories: 320,
    protein: 12,
    carbs: 28,
    fat: 18,
    mealType: "breakfast",
    date: new Date().toISOString(),
    userId: 456,
  };

  try {
    const encryptedMeal = encryptor.encryptSensitiveData(mealData);
    console.log("Encrypted meal - sensitive fields are objects:", {
      calories: typeof encryptedMeal.calories === "object",
      protein: typeof encryptedMeal.protein === "object",
      carbs: typeof encryptedMeal.carbs === "object",
      fat: typeof encryptedMeal.fat === "object",
      name: typeof encryptedMeal.name === "string",
    });

    const decryptedMeal = encryptor.decryptSensitiveData(encryptedMeal);
    const isValid = JSON.stringify(mealData) === JSON.stringify(decryptedMeal);

    console.log("Test 2:", isValid ? "PASSED" : "FAILED");
    if (!isValid) {
      console.log(
        "Difference in calories:",
        mealData.calories,
        "vs",
        decryptedMeal.calories
      );
    }
  } catch (error) {
    console.log("Test 2 FAILED:", error.message);
  }

  console.log("\nTest 3: Workout data encryption");
  const workoutData = {
    id: 789,
    name: "Morning Run",
    type: "cardio",
    calories: 450,
    duration: 30,
    notes: "Great run in the park",
    userId: 456,
    date: new Date().toISOString(),
  };

  try {
    const encryptedWorkout = encryptor.encryptSensitiveData(workoutData);
    const decryptedWorkout = encryptor.decryptSensitiveData(encryptedWorkout);
    const isValid =
      JSON.stringify(workoutData) === JSON.stringify(decryptedWorkout);

    console.log("Test 3:", isValid ? "PASSED" : "FAILED");
  } catch (error) {
    console.log("Test 3 FAILED:", error.message);
  }

  console.log("\nTest 4: Performance and metrics");
  const startTime = Date.now();
  for (let i = 0; i < 10; i++) {
    const testObj = { calories: 100 + i, protein: 20 + i };
    const encrypted = encryptor.encrypt(testObj);
    encryptor.decrypt(encrypted);
  }
  const endTime = Date.now();
  const metrics = encryptor.getMetrics();
  console.log("Performance test completed in", endTime - startTime, "ms");
  console.log("Metrics:", {
    encryptions: metrics.encryptions,
    decryptions: metrics.decryptions,
    failures: metrics.failures,
    avgEncryptionTime: metrics.avgEncryptionTime.toFixed(2) + "ms",
    avgDecryptionTime: metrics.avgDecryptionTime.toFixed(2) + "ms",
  });

  console.log("\nTest 5: Error handling");
  try {
    encryptor.decrypt({ invalid: "data" });
    console.log("Test 5 FAILED: Should have thrown error");
  } catch (error) {
    if (error instanceof EncryptionError) {
      console.log("Test 5 PASSED: Correctly threw EncryptionError");
    } else {
      console.log("Test 5 PARTIAL: Threw error but not EncryptionError");
    }
  }

  console.log("\nTest 6: Disabled encryption");
  const disabledEncryptor = new EncryptionEngine({ enabled: false });
  const plainData = { calories: 500 };
  const result = disabledEncryptor.encryptSensitiveData(plainData);
  const isPlain = JSON.stringify(plainData) === JSON.stringify(result);
  console.log(
    "Test 6:",
    isPlain ? "PASSED" : "FAILED",
    "- encryption disabled works"
  );

  console.log("\n=== Encryption Tests Complete ===");
}

if (require.main === module) {
  testEncryptionMechanism().catch(console.error);
}

module.exports = { testEncryptionMechanism };
