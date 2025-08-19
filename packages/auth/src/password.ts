import bcrypt from 'bcrypt';
import crypto from "crypto";

const SALT_ROUNDS = (() => {
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  return isNaN(rounds) ? 12 : rounds;
})();

/**
 * Hashes a password using bcrypt
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 * @throws Error if password is empty
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns A promise that resolves to true if the password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

export function generateAccessCode(length = 12): string {
  if (length < 12) {
    throw new Error("Length must be at least 12 to satisfy 6 letters and 6 numbers");
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const allChars = letters + numbers;

  const getRandom = (chars: string, count: number) =>
    Array.from({ length: count }, () => chars[crypto.randomBytes(1)[0] % chars.length]);

  const letterPart = getRandom(letters, 6);
  const numberPart = getRandom(numbers, 6);

  const combined = [...letterPart, ...numberPart];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  while (combined.length < length) {
    combined.push(allChars[crypto.randomBytes(1)[0] % allChars.length]);
  }

  return combined.join("");
}