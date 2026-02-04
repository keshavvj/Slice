import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.APP_ENC_KEY || ''; // Must be 32 bytes (hex or raw)

// If KEY is hex, decode it. If base64, decode it. If raw string, use as is (if length matches).
// For simplicity, let's assume the user provides a KEY that is usable by Buffer.from/utf8 or is pre-formatted.
// Ideally, APP_ENC_KEY should be a 32-byte key encoded in hex.

function getKey(): Buffer {
    if (!KEY) {
        throw new Error('APP_ENC_KEY is not defined');
    }
    // Try treating as hex first
    if (KEY.length === 64 && /^[0-9a-f]+$/i.test(KEY)) {
        return Buffer.from(KEY, 'hex');
    }
    // Try treating as base64
    if (KEY.length === 44 && /^[0-9a-zA-Z+/=]+$/.test(KEY)) {
        return Buffer.from(KEY, 'base64');
    }
    // Fallback: use raw bytes (must be 32 chars if utf8) - careful with this.
    // Better to just pad/slice or hash it if we want to be lax, but let's strict for security.
    // But to avoid blocking, let's just make sure it's 32 bytes.
    if (Buffer.byteLength(KEY) === 32) {
        return Buffer.from(KEY);
    }

    throw new Error('APP_ENC_KEY must be a 32-byte key (hex encoded or 32 chars)');
}

export function encryptToken(text: string): { ciphertext: string; iv: string; tag: string } {
    const iv = randomBytes(12); // 96-bit IV is standard for GCM
    const key = getKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    return {
        ciphertext: encrypted,
        iv: iv.toString('base64'),
        tag: authTag,
    };
}

export function decryptToken(ciphertext: string, ivBase64: string, tagBase64: string): string {
    const key = getKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
