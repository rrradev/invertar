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
    Array.from({ length: count }, () => {
      let randomByte;
      const limit = 256 - (256 % chars.length);
      do {
        randomByte = crypto.randomBytes(1)[0];
      } while (randomByte >= limit);
      return chars[randomByte % chars.length];
    });

  const letterPart = getRandom(letters, 6);
  const numberPart = getRandom(numbers, 6);

  const combined = [...letterPart, ...numberPart];
  for (let i = combined.length - 1; i > 0; i--) {
    let randomByte;
    const limit = 256 - (256 % (i + 1));
    do {
      randomByte = crypto.randomBytes(1)[0];
    } while (randomByte >= limit);
    const j = randomByte % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  while (combined.length < length) {
    let randomByte;
    const limit = 256 - (256 % allChars.length);
    do {
      randomByte = crypto.randomBytes(1)[0];
    } while (randomByte >= limit);
    combined.push(allChars[randomByte % allChars.length]);
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

  for (let i = 0; i < length && value !== 0n; i++) {
    slug += BASE62[Number(value % 62n)];
    value = value / 62n;
  }
  // Pad with BASE62[0] if slug is shorter than desired length
  if (slug.length < length) {
    slug = slug.padEnd(length, BASE62[0]);
  }

  return slug;
}