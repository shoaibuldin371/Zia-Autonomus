import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '@/lib/security/encryption';

describe('Encryption (AES-256-GCM)', () => {
  const originalSecret = process.env.ENCRYPTION_SECRET;

  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'my_super_secure_encryption_secret_key_12345';
  });

  afterEach(() => {
    process.env.ENCRYPTION_SECRET = originalSecret;
  });

  it('encrypts and decrypts a sensitive token successfully', () => {
    const sensitive = 'google_refresh_token_xyz_1234567890';
    const ciphertext = encrypt(sensitive);

    expect(ciphertext).not.toBe(sensitive);
    expect(ciphertext.split(':').length).toBe(3); // iv:tag:ciphertext

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(sensitive);
  });

  it('fails decryption if ciphertext is tampered', () => {
    const sensitive = 'test_token_secret';
    const ciphertext = encrypt(sensitive);
    const parts = ciphertext.split(':');
    // Tamper with ciphertext bytes
    parts[2] = parts[2].slice(0, -2) + 'ff';
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws an error if ENCRYPTION_SECRET is missing', () => {
    delete process.env.ENCRYPTION_SECRET;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET is required');
  });
});

