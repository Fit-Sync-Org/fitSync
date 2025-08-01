const { EncryptionEngine, EncryptionError } = require('../utils/encryptionEngine');

describe('EncryptionEngine', () => {
  let encryptionEngine;

  beforeEach(() => {
    encryptionEngine = new EncryptionEngine({
      secretKey: 'TestSecretKey2024',
      enabled: true
    });
  });

  afterEach(() => {
    encryptionEngine.resetMetrics();
  });

  describe('Basic Encryption/Decryption', () => {
    test('should encrypt and decrypt simple objects successfully', () => {
      const testData = { message: 'Hello World', number: 42 };
      
      const encrypted = encryptionEngine.encrypt(testData);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('algorithm');
      expect(encrypted).toHaveProperty('timestamp');

      const decrypted = encryptionEngine.decrypt(encrypted);
      expect(decrypted).toEqual(testData);
    });

    test('should encrypt and decrypt complex nested objects', () => {
      const complexData = {
        user: {
          name: 'John Doe',
          age: 30,
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        workouts: ['running', 'cycling'],
        metrics: {
          weight: 75.5,
          height: 180
        }
      };

      const encrypted = encryptionEngine.encrypt(complexData);
      const decrypted = encryptionEngine.decrypt(encrypted);
      expect(decrypted).toEqual(complexData);
    });

    test('should handle empty objects', () => {
      const emptyData = {};
      const encrypted = encryptionEngine.encrypt(emptyData);
      const decrypted = encryptionEngine.decrypt(encrypted);
      expect(decrypted).toEqual(emptyData);
    });
  });

  describe('Regional Encryption', () => {
    test('should encrypt/decrypt with EU region settings', () => {
      const testData = { gdprData: 'sensitive information' };
      const userSalt = 'userSpecificSalt123';

      const encrypted = encryptionEngine.encrypt(testData, { 
        region: 'EU', 
        userSalt 
      });
      
      expect(encrypted.region).toBe('EU');
      expect(encrypted.algorithm).toBe('aes-256-cbc');

      const decrypted = encryptionEngine.decrypt(encrypted, { 
        region: 'EU', 
        userSalt 
      });
      expect(decrypted).toEqual(testData);
    });

    test('should fail to decrypt EU data without proper region/salt', () => {
      const testData = { gdprData: 'sensitive information' };
      const userSalt = 'userSpecificSalt123';

      const encrypted = encryptionEngine.encrypt(testData, { 
        region: 'EU', 
        userSalt 
      });

      // Try to decrypt without proper parameters
      expect(() => {
        encryptionEngine.decrypt(encrypted, { region: 'DEFAULT' });
      }).toThrow(EncryptionError);
    });
  });

  describe('Sensitive Data Encryption', () => {
    test('should encrypt sensitive fields in meal data', () => {
      const mealData = {
        id: 1,
        name: 'Chicken Breast',
        calories: 250,
        protein: 46,
        carbs: 0,
        fat: 5.5,
        date: '2024-01-01'
      };

      const encrypted = encryptionEngine.encryptSensitiveData(mealData);
      
      // Non-sensitive fields should remain unchanged
      expect(encrypted.id).toBe(1);
      expect(encrypted.name).toBe('Chicken Breast');
      expect(encrypted.date).toBe('2024-01-01');
      
      // Sensitive fields should be encrypted objects
      expect(typeof encrypted.calories).toBe('object');
      expect(encrypted.calories).toHaveProperty('ciphertext');
      expect(typeof encrypted.protein).toBe('object');
      expect(encrypted.protein).toHaveProperty('ciphertext');
    });

    test('should decrypt sensitive fields back to original values', () => {
      const originalData = {
        calories: 250,
        protein: 46,
        weight: 75.5
      };

      const encrypted = encryptionEngine.encryptSensitiveData(originalData);
      const decrypted = encryptionEngine.decryptSensitiveData(encrypted);

      expect(decrypted.calories).toBe(250);
      expect(decrypted.protein).toBe(46);
      expect(decrypted.weight).toBe(75.5);
    });
  });

  describe('Error Handling', () => {
    test('should throw EncryptionError on invalid cipher object', () => {
      const invalidCipher = { invalid: 'data' };
      
      expect(() => {
        encryptionEngine.decrypt(invalidCipher);
      }).toThrow(EncryptionError);
    });

    test('should throw EncryptionError with details', () => {
      const invalidCipher = { ciphertext: 'invalid', iv: 'invalid' };
      
      try {
        encryptionEngine.decrypt(invalidCipher);
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionError);
        expect(error.details).toHaveProperty('error');
        expect(error.details).toHaveProperty('algorithm');
      }
    });

    test('should handle decryption failure gracefully in sensitive data', () => {
      const dataWithInvalidEncryption = {
        calories: { ciphertext: 'invalid', iv: 'invalid' },
        name: 'Test Food'
      };

      // Should not throw but should log error
      const result = encryptionEngine.decryptSensitiveData(dataWithInvalidEncryption);
      expect(result.name).toBe('Test Food');
      expect(result.calories).toEqual({ ciphertext: 'invalid', iv: 'invalid' });
    });
  });

  describe('Metrics Tracking', () => {
    test('should track encryption metrics', () => {
      const testData = { test: 'data' };
      
      encryptionEngine.encrypt(testData);
      encryptionEngine.encrypt(testData);
      
      const metrics = encryptionEngine.getMetrics();
      expect(metrics.encryptions).toBe(2);
      expect(metrics.avgEncryptionTime).toBeGreaterThan(0);
      expect(metrics.failures).toBe(0);
    });

    test('should track decryption metrics', () => {
      const testData = { test: 'data' };
      const encrypted = encryptionEngine.encrypt(testData);
      
      encryptionEngine.decrypt(encrypted);
      encryptionEngine.decrypt(encrypted);
      
      const metrics = encryptionEngine.getMetrics();
      expect(metrics.decryptions).toBe(2);
      expect(metrics.avgDecryptionTime).toBeGreaterThan(0);
    });

    test('should track failure metrics', () => {
      const invalidCipher = { ciphertext: 'invalid', iv: 'invalid' };
      
      try {
        encryptionEngine.decrypt(invalidCipher);
      } catch (error) {
        // Expected error
      }
      
      const metrics = encryptionEngine.getMetrics();
      expect(metrics.failures).toBe(1);
    });

    test('should reset metrics correctly', () => {
      const testData = { test: 'data' };
      encryptionEngine.encrypt(testData);
      
      encryptionEngine.resetMetrics();
      const metrics = encryptionEngine.getMetrics();
      
      expect(metrics.encryptions).toBe(0);
      expect(metrics.decryptions).toBe(0);
      expect(metrics.failures).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    test('should perform successful roundtrip test', () => {
      const testData = { roundtrip: 'test data' };
      const result = encryptionEngine.testRoundtrip(testData);
      expect(result).toBe(true);
    });

    test('should handle disabled encryption', () => {
      const disabledEngine = new EncryptionEngine({ enabled: false });
      const testData = { test: 'data' };
      
      const result = disabledEngine.encrypt(testData);
      expect(result).toEqual(testData);
      
      const decrypted = disabledEngine.decrypt(testData);
      expect(decrypted).toEqual(testData);
    });

    test('should generate consistent IV length', () => {
      const iv1 = encryptionEngine.generateIV();
      const iv2 = encryptionEngine.generateIV();
      
      expect(iv1.length).toBe(16); // AES-256-CBC IV length
      expect(iv2.length).toBe(16);
      expect(iv1).not.toEqual(iv2); // Should be random
    });
  });
}); 