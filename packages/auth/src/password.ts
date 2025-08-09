import bcrypt from 'bcrypt';

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