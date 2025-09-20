import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import {
  createFolderInput,
  createItemInput,
  updateFolderInput,
  updateItemInput,
  deleteFolderInput,
  deleteItemInput,
  adjustItemQuantityInput
} from '@repo/types/schemas/dashboard';
import { SuccessStatus } from '@repo/types/trpc';

export const dashboardRouter = router({
  // Get all folders and their items for the user's organization
  getFoldersWithItems: protectedProcedure
    .query(async ({ ctx }) => {
      const folders = await prisma.folder.findMany({
        where: {
          organizationId: ctx.user!.organizationId,
        },
        include: {
          items: {
            include: {
              lastModifiedBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          lastModifiedBy: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formatted = folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        lastModifiedBy: folder.lastModifiedBy.username,
        items: folder.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          lastModifiedBy: item.lastModifiedBy.username,
        })),
      }));

      return {
        status: SuccessStatus.SUCCESS,
        folders: formatted,
      };
    }),

  // Create a new folder
  createFolder: protectedProcedure
    .input(createFolderInput)
    .mutation(async ({ input, ctx }) => {
      // Check if folder name already exists in the organization
      const existingFolder = await prisma.folder.findFirst({
        where: {
          organizationId: ctx.user!.organizationId,
          name: input.name,
        },
      });

      if (existingFolder) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Folder with this name already exists in your organization."
        });
      }

      const newFolder = await prisma.folder.create({
        data: {
          name: input.name,
          organizationId: ctx.user!.organizationId,
          lastModifiedById: ctx.user!.id,
        },
        include: {
          lastModifiedBy: {
            select: {
              username: true,
            },
          },
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Folder "${input.name}" created successfully!`,
        folder: {
          id: newFolder.id,
          name: newFolder.name,
          createdAt: newFolder.createdAt.toISOString(),
          updatedAt: newFolder.updatedAt.toISOString(),
          lastModifiedBy: newFolder.lastModifiedBy.username,
          items: [],
        },
      };
    }),

  // Create a new item
  createItem: protectedProcedure
    .input(createItemInput)
    .mutation(async ({ input, ctx }) => {
      // Check if the folder exists and belongs to the user's organization
      const folder = await prisma.folder.findUnique({
        where: { id: input.folderId },
        select: { organizationId: true },
      });

      if (!folder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found."
        });
      }

      if (folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add items to folders in your organization."
        });
      }

      const newItem = await prisma.item.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price ?? 0,
          quantity: input.quantity ?? 0,
          folderId: input.folderId,
          lastModifiedById: ctx.user!.id,
        },
        include: {
          lastModifiedBy: {
            select: {
              username: true,
            },
          },
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Item "${input.name}" created successfully!`,
        item: {
          id: newItem.id,
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          quantity: newItem.quantity,
          createdAt: newItem.createdAt.toISOString(),
          updatedAt: newItem.updatedAt.toISOString(),
          lastModifiedBy: newItem.lastModifiedBy.username,
        },
      };
    }),

  // Update folder
  updateFolder: protectedProcedure
    .input(updateFolderInput)
    .mutation(async ({ input, ctx }) => {
      // Check if folder exists and belongs to user's organization
      const folder = await prisma.folder.findUnique({
        where: { id: input.folderId },
        select: { organizationId: true, name: true },
      });

      if (!folder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found."
        });
      }

      if (folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit folders in your organization."
        });
      }

      // Check if new name conflicts with existing folders (only if name is changing)
      if (folder.name !== input.name) {
        const existingFolder = await prisma.folder.findFirst({
          where: {
            organizationId: ctx.user!.organizationId,
            name: input.name,
            id: { not: input.folderId },
          },
        });

        if (existingFolder) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Folder with this name already exists in your organization."
          });
        }
      }

      const updatedFolder = await prisma.folder.update({
        where: { id: input.folderId },
        data: {
          name: input.name,
          lastModifiedById: ctx.user!.id,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Folder "${input.name}" updated successfully!`,
      };
    }),

  // Update item (name, description, price only - quantity handled separately)
  updateItem: protectedProcedure
    .input(updateItemInput)
    .mutation(async ({ input, ctx }) => {
      // Check if item exists and belongs to user's organization
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
        include: {
          folder: {
            select: { organizationId: true },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found."
        });
      }

      if (item.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit items in your organization."
        });
      }

      const updatedItem = await prisma.item.update({
        where: { id: input.itemId },
        data: {
          name: input.name,
          description: input.description,
          price: input.price ?? 0,
          lastModifiedById: ctx.user!.id,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Item "${input.name}" updated successfully!`,
      };
    }),

  // Adjust item quantity (+/-)
  adjustItemQuantity: protectedProcedure
    .input(adjustItemQuantityInput)
    .mutation(async ({ input, ctx }) => {
      // Check if item exists and belongs to user's organization
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
        include: {
          folder: {
            select: { organizationId: true },
          },
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          folder: {
            select: { organizationId: true },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found."
        });
      }

      if (item.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit items in your organization."
        });
      }

      const newQuantity = item.quantity + input.adjustment;

      // Validate that quantity doesn't go below 0
      if (newQuantity < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quantity cannot be negative. Current quantity is " + item.quantity,
        });
      }

      const updatedItem = await prisma.item.update({
        where: { id: input.itemId },
        data: {
          quantity: newQuantity,
          lastModifiedById: ctx.user!.id,
        },
      });

      const adjustmentText = input.adjustment > 0 ? `+${input.adjustment}` : `${input.adjustment}`;
      return {
        status: SuccessStatus.SUCCESS,
        message: `Item "${item.name}" quantity adjusted by ${adjustmentText}. New quantity: ${newQuantity}`,
        newQuantity: newQuantity,
      };
    }),

  // Delete folder (only if empty)
  deleteFolder: protectedProcedure
    .input(deleteFolderInput)
    .mutation(async ({ input, ctx }) => {
      // Check if folder exists and belongs to user's organization
      const folder = await prisma.folder.findUnique({
        where: { id: input.folderId },
        select: {
          organizationId: true,
          name: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found."
        });
      }

      if (folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete folders in your organization."
        });
      }

      if (folder._count.items > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete folder that contains items. Move or delete items first."
        });
      }

      await prisma.folder.delete({
        where: { id: input.folderId },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Folder "${folder.name}" deleted successfully!`,
      };
    }),

  // Delete item
  deleteItem: protectedProcedure
    .input(deleteItemInput)
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
        select: {
          name: true,
          folder: {
            select: { organizationId: true },
          },
        },
      });


      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found."
        });
      }

      if (item.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete items in your organization."
        });
      }

      await prisma.item.delete({
        where: { id: input.itemId },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Item "${item.name}" deleted successfully!`,
      };
    }),
});