import { createHash } from 'crypto';

/**
 * Generate a unique hash ID for an item based on its name and labels
 * @param name - The item name
 * @param labelNames - Array of label names (max 2)
 * @returns Hash string for uniqueness validation
 */
export function generateItemHashId(name: string, labelNames: string[] = []): string {
  // Sort label names to ensure consistent hash regardless of order
  const sortedLabels = [...labelNames].sort();
  
  // Create a string that combines name and sorted labels
  const hashInput = `${name.trim().toLowerCase()}|${sortedLabels.join('|')}`;
  
  // Generate SHA-256 hash
  return createHash('sha256').update(hashInput).digest('hex').slice(0, 16);
}