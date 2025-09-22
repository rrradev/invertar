import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import {
  createFolderInput,
  createItemInput,
  createLabelInput,
  updateFolderInput,
  updateItemInput,
  deleteFolderInput,
  deleteItemInput,
  adjustItemQuantityInput
} from '@repo/types/schemas/dashboard';
import { SuccessStatus } from '@repo/types/trpc';
import { generateItemHashId } from '@repo/utils';

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
              labels: {
                include: {
                  label: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
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
          unit: item.unit,
          labels: item.labels.map((itemLabel: any) => ({
            id: itemLabel.label.id,
            name: itemLabel.label.name,
            color: itemLabel.label.color,
          })),
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

      // Validate labels if provided
      let labelNames: string[] = [];
      if (input.labelIds && input.labelIds.length > 0) {
        if (input.labelIds.length > 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Items can have at most 2 labels."
          });
        }

        const labels = await prisma.label.findMany({
          where: {
            id: { in: input.labelIds },
            organizationId: ctx.user!.organizationId,
          },
          select: { id: true, name: true },
        });

        if (labels.length !== input.labelIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more labels not found."
          });
        }

        labelNames = labels.map(label => label.name);
      }

      // Generate hash for uniqueness validation
      const hashId = generateItemHashId(input.name, labelNames);

      // Check for existing item with same hash in the folder
      const existingItem = await prisma.item.findUnique({
        where: {
          folderId_hashId: {
            folderId: input.folderId,
            hashId: hashId,
          },
        },
      });

      if (existingItem) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An item with this name and labels already exists in this folder. Please add labels to make it unique."
        });
      }

      // Create item and label associations in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const newItem = await tx.item.create({
          data: {
            name: input.name,
            description: input.description,
            price: input.price ?? 0,
            cost: input.cost,
            quantity: input.quantity ?? 0,
            unit: input.unit ?? 'PCS',
            folderId: input.folderId,
            hashId: hashId,
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

        // Create label associations
        if (input.labelIds && input.labelIds.length > 0) {
          await tx.itemLabel.createMany({
            data: input.labelIds.map(labelId => ({
              itemId: newItem.id,
              labelId: labelId,
            })),
          });
        }

        return newItem;
      });

      // Fetch the created item with labels for response
      const itemWithLabels = await prisma.item.findUnique({
        where: { id: result.id },
        include: {
          lastModifiedBy: {
            select: {
              username: true,
            },
          },
          labels: {
            include: {
              label: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Item "${input.name}" created successfully!`,
        item: {
          id: itemWithLabels!.id,
          name: itemWithLabels!.name,
          description: itemWithLabels!.description,
          price: itemWithLabels!.price,
          cost: itemWithLabels!.cost,
          quantity: itemWithLabels!.quantity,
          unit: itemWithLabels!.unit,
          labels: itemWithLabels!.labels.map(itemLabel => ({
            id: itemLabel.label.id,
            name: itemLabel.label.name,
            color: itemLabel.label.color,
          })),
          createdAt: itemWithLabels!.createdAt.toISOString(),
          updatedAt: itemWithLabels!.updatedAt.toISOString(),
          lastModifiedBy: itemWithLabels!.lastModifiedBy.username,
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
          labels: {
            include: {
              label: {
                select: { name: true },
              },
            },
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

      // Validate labels if provided
      let labelNames: string[] = [];
      if (input.labelIds !== undefined) {
        if (input.labelIds.length > 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Items can have at most 2 labels."
          });
        }

        if (input.labelIds.length > 0) {
          const labels = await prisma.label.findMany({
            where: {
              id: { in: input.labelIds },
              organizationId: ctx.user!.organizationId,
            },
            select: { id: true, name: true },
          });

          if (labels.length !== input.labelIds.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "One or more labels not found."
            });
          }

          labelNames = labels.map(label => label.name);
        }
      } else {
        // Keep existing labels if not specified
        labelNames = item.labels.map(itemLabel => itemLabel.label.name);
      }

      // Generate new hash if name or labels changed
      const currentLabelNames = item.labels.map(itemLabel => itemLabel.label.name);
      const nameChanged = input.name !== item.name;
      const labelsChanged = input.labelIds !== undefined;
      
      let newHashId = item.hashId;
      if (nameChanged || labelsChanged) {
        newHashId = generateItemHashId(input.name, labelNames);

        // Check for conflicts with the new hash (excluding current item)
        const existingItem = await prisma.item.findFirst({
          where: {
            folderId: item.folderId,
            hashId: newHashId,
            NOT: { id: input.itemId },
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An item with this name and labels already exists in this folder. Please modify labels to make it unique."
          });
        }
      }

      // Update item and labels in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update item
        const updatedItem = await tx.item.update({
          where: { id: input.itemId },
          data: {
            name: input.name,
            description: input.description,
            price: input.price ?? 0,
            cost: input.cost,
            unit: input.unit,
            hashId: newHashId,
            lastModifiedById: ctx.user!.id,
          },
        });

        // Update labels if specified
        if (input.labelIds !== undefined) {
          // Remove existing labels
          await tx.itemLabel.deleteMany({
            where: { itemId: input.itemId },
          });

          // Add new labels
          if (input.labelIds.length > 0) {
            await tx.itemLabel.createMany({
              data: input.labelIds.map(labelId => ({
                itemId: input.itemId,
                labelId: labelId,
              })),
            });
          }
        }

        return updatedItem;
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

      const updatedItem = await prisma.item.update({
        where: { id: input.itemId },
        data: {
          quantity: { increment: input.adjustment }, // Use increment for atomic updates, Table has a constraint to prevent negative quantities
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

  // Get all labels for the user's organization
  getLabels: protectedProcedure
    .query(async ({ ctx }) => {
      const labels = await prisma.label.findMany({
        where: {
          organizationId: ctx.user!.organizationId,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        labels: labels.map(label => ({
          id: label.id,
          name: label.name,
          color: label.color,
          createdAt: label.createdAt.toISOString(),
          updatedAt: label.updatedAt.toISOString(),
        })),
      };
    }),

  // Create a new label
  createLabel: protectedProcedure
    .input(createLabelInput)
    .mutation(async ({ input, ctx }) => {
      // Check if label name already exists in the organization
      const existingLabel = await prisma.label.findUnique({
        where: {
          organizationId_name: {
            organizationId: ctx.user!.organizationId,
            name: input.name,
          },
        },
      });

      if (existingLabel) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Label with this name already exists in your organization."
        });
      }

      const newLabel = await prisma.label.create({
        data: {
          name: input.name,
          color: input.color,
          organizationId: ctx.user!.organizationId,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Label "${input.name}" created successfully!`,
        label: {
          id: newLabel.id,
          name: newLabel.name,
          color: newLabel.color,
          createdAt: newLabel.createdAt.toISOString(),
          updatedAt: newLabel.updatedAt.toISOString(),
        },
      };
    }),
});