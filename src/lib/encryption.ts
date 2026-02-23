import crypto from 'crypto';

// Use a secure 32-byte (256-bit) string for the secret key.
// In production, this MUST come from an environment variable and NEVER be hardcoded.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fluxx_secure_secret_key_00000000'; // 32 chars minimum
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a string using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns A base64 encoded string containing the IV, encrypted data, and auth tag.
 */
export function encrypt(text: string): string {
    // Generate a random 12-byte initialization vector (IV) for GCM mode
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get the auth tag (16 bytes)
    const authTag = cipher.getAuthTag();

    // Return the IV, Auth Tag, and Encrypted Text combined in one string
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with the `encrypt` function.
 * @param encryptedData The base64 combined encrypted string.
 * @returns The original plaintext string.
 */
export function decrypt(encryptedData: string): string {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const authTag = Buffer.from(parts[1], 'base64');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return 'DECRYPTION_FAILED';
    }
}
