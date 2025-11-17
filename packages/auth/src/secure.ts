import crypto from "crypto";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const BASE62 = letters + letters.toLowerCase() + numbers;

export function generateAccessCode(length = 12): string {
  if (length < 12) {
    throw new Error("Length must be at least 12 to satisfy 6 letters and 6 numbers");
  }

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

/**
 * Mask a UUID/CUID into a URL-friendly, deterministic slug.
 * @param id - Original UUID/CUID string
 * @param length - Desired slug length (default 25 chars ~ 150 bits)
 */
export function maskIdBase62(id: string, length = 25): string {
  // Get SHA-256 hash
  const hash = crypto.createHash("sha256").update(id).digest(); // Buffer
  // Convert hash to BigInt
  let value = BigInt("0x" + hash.toString("hex"));
  let slug = "";

  for (let i = 0; i < length; i++) {
    slug += BASE62[Number(value % 62n)];
    value = value / 62n;
  }

  return slug;
}