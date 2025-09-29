import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SuccessStatus } from "@repo/types/trpc";
import { prisma } from "@repo/db";
import { 
  generateUploadSignature, 
  generateSignedUrl, 
  getItemThumbnailUrl,
  getItemMediumUrl,
  deleteImage,
  validatePublicIdForOrganization 
} from "../../utils/cloudinary";

// Input schemas
const getItemImagesInput = z.object({
  itemIds: z.array(z.string()).min(1, "At least one item ID is required"),
});

const deleteImageInput = z.object({
  publicId: z.string().min(1, "Public ID is required"),
});

export const imagesRouter = router({
  // Generate upload signature for creating new items
  generateUploadSignature: protectedProcedure
    .mutation(async ({ ctx }) => {
      const signature = generateUploadSignature(ctx.user!.organizationId);

      return {
        status: SuccessStatus.SUCCESS,
        signature,
      };
    }),

  // Get signed URLs for item images
  getItemImages: protectedProcedure
    .input(getItemImagesInput)
    .query(async ({ input, ctx }) => {
      // Fetch items and verify they belong to user's organization
      const items = await prisma.item.findMany({
        where: {
          id: { in: input.itemIds },
          shelf: {
            organizationId: ctx.user!.organizationId,
          },
        },
        select: {
          id: true,
          cloudinaryPublicId: true,
        },
      });

      if (items.length !== input.itemIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more items not found or not accessible."
        });
      }

      // Generate signed URLs for items with images
      const imageUrls = items.reduce((acc: Record<string, { thumbnail: string; medium: string; publicId: string }>, item: any) => {
        if (item.cloudinaryPublicId) {
          // Validate that the public ID belongs to the user's organization
          if (!validatePublicIdForOrganization(item.cloudinaryPublicId, ctx.user!.organizationId)) {
            console.warn(`Invalid public ID for organization: ${item.cloudinaryPublicId}`);
            return acc;
          }

          acc[item.id] = {
            thumbnail: getItemThumbnailUrl(item.cloudinaryPublicId),
            medium: getItemMediumUrl(item.cloudinaryPublicId),
            publicId: item.cloudinaryPublicId,
          };
        }
        return acc;
      }, {} as Record<string, { thumbnail: string; medium: string; publicId: string }>);

      return {
        status: SuccessStatus.SUCCESS,
        imageUrls,
      };
    }),

  // Delete an image from Cloudinary
  deleteImage: protectedProcedure
    .input(deleteImageInput)
    .mutation(async ({ input, ctx }) => {
      // Validate that the public ID belongs to the user's organization
      if (!validatePublicIdForOrganization(input.publicId, ctx.user!.organizationId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete images from your organization."
        });
      }

      try {
        const result = await deleteImage(input.publicId);
        
        if (result.result === 'ok') {
          return {
            status: SuccessStatus.SUCCESS,
            message: "Image deleted successfully",
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to delete image from Cloudinary"
          });
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete image"
        });
      }
    }),
});