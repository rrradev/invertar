import { v2 as cloudinary } from 'cloudinary';
import { env } from '../load-env';
import { maskIdBase62 } from '@repo/auth/secure';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signed upload signature for uploading images to Cloudinary
 * @param organizationId - The organization ID for folder structure
 * @returns Upload signature parameters
 */
export function generateUploadSignature(organizationId: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `invertar/${generateSlug(organizationId)}/items`;

  const params = {
    timestamp: timestamp,
    folder: folder,
    upload_preset: undefined, // We'll use API key instead
  };

  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    api_key: env.CLOUDINARY_API_KEY,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

/**
 * Generate a signed URL for accessing a Cloudinary image with 15-minute expiration
 * @param publicId - The Cloudinary public ID of the image
 * @param transformations - Optional transformations to apply
 * @returns Signed URL
 */
export function generateSignedUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'pad';
    quality?: 'auto' | number;
  }
) {
  // Build transformation object for Cloudinary SDK
  const transformationOptions: any = {};

  if (transformations) {
    if (transformations.width) transformationOptions.width = transformations.width;
    if (transformations.height) transformationOptions.height = transformations.height;
    if (transformations.crop) transformationOptions.crop = transformations.crop;
    if (transformations.quality) transformationOptions.quality = transformations.quality;
  }

  // Use Cloudinary's built-in URL generation
  // For now, we'll generate public URLs since the user reported that public URLs work
  // TODO: Add authentication/signing if needed for security
  return cloudinary.url(publicId, {
    ...transformationOptions,
    resource_type: 'image',
    type: 'upload',
    secure: true, // Use HTTPS
  });
}

/**
 * Get thumbnail URL for an item image (32x32px, optimized)
 * @param publicId - The Cloudinary public ID of the image
 * @returns Signed thumbnail URL
 */
export function getItemThumbnailUrl(publicId: string) {
  return generateSignedUrl(publicId, {
    width: 32,
    height: 32,
    crop: 'fill',
    quality: 'auto',
  });
}

/**
 * Get medium-sized URL for an item image (200x200px, optimized)
 * @param publicId - The Cloudinary public ID of the image
 * @returns Signed medium-sized URL
 */
export function getItemMediumUrl(publicId: string) {
  return generateSignedUrl(publicId, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
  });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The Cloudinary public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

/**
 * Validate that a public ID belongs to the organization's folder
 * @param publicId - The Cloudinary public ID
 * @param organizationId - The organization ID
 * @returns boolean indicating if the public ID is valid for the organization
 */
export function validatePublicIdForOrganization(publicId: string, organizationId: string): boolean {
  const expectedPrefix = `invertar/${generateSlug(organizationId)}/items/`;
  return publicId.startsWith(expectedPrefix);
}

function generateSlug(organizationId: string): string {
  return maskIdBase62(organizationId, 20);
}