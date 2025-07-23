const crypto = require("crypto");

class EncryptionError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "EncryptionError";
    this.details = details;
  }
}

class EncryptionEngine {
  constructor(options = {}) {
    this.algorithm = options.algorithm || "aes-256-cbc";
    this.secretKey = options.secretKey || this.generateDefaultKey();
    this.enabled = options.enabled !== false;
    this.ivLength = 16; // For AES-256-CBC
    this.GDPR_SALT = "FitSyncGDPRSalt2024";
    this.DEFAULT_SALT = "FitSyncSalt2024";
    this.keyBuffer = this.deriveKey(
      this.secretKey,
      this.DEFAULT_SALT,
      "DEFAULT"
    );

    this.metrics = {
      encryptions: 0,
      decryptions: 0,
      failures: 0,
      avgEncryptionTime: 0,
      avgDecryptionTime: 0,
      totalEncryptionTime: 0,
      totalDecryptionTime: 0,
    };
  }

  generateDefaultKey() {
    return (
      process.env.ENCRYPTION_KEY || "FitSyncSuperSecretKey2024ForHealthData"
    );
  }

  deriveKey(secretKey, userSalt, region) {
    let salt = this.DEFAULT_SALT;
    if (region === "EU") {
      salt = (userSalt || "") + this.GDPR_SALT;
    } else if (userSalt) {
      salt = userSalt;
    }
    return crypto.pbkdf2Sync(secretKey, salt, 10000, 32, "sha256");
  }

  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  encrypt(plainObject, { region = "DEFAULT", userSalt = null } = {}) {
    if (!this.enabled) return plainObject;
    const startTime = Date.now();
    try {
      const plainText = JSON.stringify(plainObject);
      const iv = this.generateIV();
      const keyBuffer = this.deriveKey(this.secretKey, userSalt, region);
      const algorithm = region === "EU" ? "aes-256-cbc" : this.algorithm;
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
      let encrypted = cipher.update(plainText, "utf8", "hex");
      encrypted += cipher.final("hex");
      const encryptionTime = Date.now() - startTime;
      this.updateMetrics("encrypt", encryptionTime);
      return {
        ciphertext: encrypted,
        iv: iv.toString("hex"),
        algorithm,
        region,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.metrics.failures++;
      throw new EncryptionError("Encryption failed", {
        error: error.message,
        algorithm: this.algorithm,
      });
    }
  }

  decrypt(cipherObject, { region = "DEFAULT", userSalt = null } = {}) {
    if (!this.enabled) return cipherObject;
    const startTime = Date.now();
    try {
      if (!cipherObject.ciphertext || !cipherObject.iv) {
        throw new Error("Invalid cipher object: missing ciphertext or IV");
      }
      const iv = Buffer.from(cipherObject.iv, "hex");
      const keyBuffer = this.deriveKey(this.secretKey, userSalt, region);
      const algorithm =
        region === "EU"
          ? "aes-256-cbc"
          : cipherObject.algorithm || this.algorithm;
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
      let decrypted = decipher.update(cipherObject.ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");
      const result = JSON.parse(decrypted);
      const decryptionTime = Date.now() - startTime;
      this.updateMetrics("decrypt", decryptionTime);
      return result;
    } catch (error) {
      this.metrics.failures++;
      throw new EncryptionError("Decryption failed", {
        error: error.message,
        algorithm: this.algorithm,
        inputValid: !!(cipherObject.ciphertext && cipherObject.iv),
      });
    }
  }

  updateMetrics(operation, timeMs) {
    if (operation === "encrypt") {
      this.metrics.encryptions++;
      this.metrics.totalEncryptionTime += timeMs;
      this.metrics.avgEncryptionTime =
        this.metrics.totalEncryptionTime / this.metrics.encryptions;
    } else if (operation === "decrypt") {
      this.metrics.decryptions++;
      this.metrics.totalDecryptionTime += timeMs;
      this.metrics.avgDecryptionTime =
        this.metrics.totalDecryptionTime / this.metrics.decryptions;
    }
  }

  encryptSensitiveData(data, { region = "DEFAULT", userSalt = null } = {}) {
    if (!this.enabled || !data || typeof data !== "object") return data;
    const sensitiveFields = [
      "calories",
      "weight",
      "weightKg",
      "protein",
      "carbs",
      "fat",
    ];
    const result = { ...data };
    for (const field of sensitiveFields) {
      if (result[field] !== undefined) {
        result[field] = this.encrypt(
          { value: result[field] },
          { region, userSalt }
        );
      }
    }
    return result;
  }

  decryptSensitiveData(data, { region = "DEFAULT", userSalt = null } = {}) {
    if (!data || typeof data !== "object") return data;
    const sensitiveFields = [
      "calories",
      "weight",
      "weightKg",
      "protein",
      "carbs",
      "fat",
    ];
    const result = { ...data };
    for (const field of sensitiveFields) {
      if (
        result[field] &&
        typeof result[field] === "object" &&
        result[field].ciphertext
      ) {
        try {
          const decrypted = this.decrypt(result[field], { region, userSalt });
          result[field] = decrypted.value;
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error.message);
        }
      }
    }
    return result;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      encryptions: 0,
      decryptions: 0,
      failures: 0,
      avgEncryptionTime: 0,
      avgDecryptionTime: 0,
      totalEncryptionTime: 0,
      totalDecryptionTime: 0,
    };
  }

  testRoundtrip(testData) {
    try {
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      return false;
    }
  }
}

module.exports = { EncryptionEngine, EncryptionError };
