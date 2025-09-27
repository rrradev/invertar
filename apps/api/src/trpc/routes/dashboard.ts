import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import {
  createShelfInput,
  createItemInput,
  createLabelInput,
  updateShelfInput,
  updateItemInput,
  deleteShelfInput,
  deleteItemInput,
  adjustItemQuantityInput
} from '@repo/types/schemas/dashboard';
import { SuccessStatus } from '@repo/types/trpc';
import { generateItemHashId } from '@repo/utils/items';

export const dashboardRouter = router({
  // Get all shelves and their items for the user's organization
  getShelvesWithItems: protectedProcedure
    .query(async ({ ctx }) => {
      const shelves = await prisma.shelf.findMany({
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

      const formatted = shelves.map((shelf: any) => ({
        id: shelf.id,
        name: shelf.name,
        createdAt: shelf.createdAt.toISOString(),
        updatedAt: shelf.updatedAt.toISOString(),
        lastModifiedBy: shelf.lastModifiedBy.username,
        items: shelf.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          cost: item.cost,
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
        shelves: formatted,
      };
    }),

  // Create a new shelf
  createShelf: protectedProcedure
    .input(createShelfInput)
    .mutation(async ({ input, ctx }) => {
      // Check if shelf name already exists in the organization
      const existingShelf = await prisma.shelf.findFirst({
        where: {
          organizationId: ctx.user!.organizationId,
          name: input.name,
        },
      });

      if (existingShelf) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Shelf with this name already exists in your organization."
        });
      }

      const newShelf = await prisma.shelf.create({
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
        message: `Shelf "${input.name}" created successfully!`,
        shelf: {
          id: newShelf.id,
          name: newShelf.name,
          createdAt: newShelf.createdAt.toISOString(),
          updatedAt: newShelf.updatedAt.toISOString(),
          lastModifiedBy: newShelf.lastModifiedBy.username,
          items: [],
        },
      };
    }),

  // Create a new item
  createItem: protectedProcedure
    .input(createItemInput)
    .mutation(async ({ input, ctx }) => {
      // Check if the shelf exists and belongs to the user's organization
      const shelf = await prisma.shelf.findUnique({
        where: { id: input.shelfId },
        select: { organizationId: true },
      });

      if (!shelf) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shelf not found."
        });
      }

      if (shelf.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add items to shelves in your organization."
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
          shelfId_hashId: {
            shelfId: input.shelfId,
            hashId: hashId,
          },
        },
      });

      if (existingItem) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An item with this name and labels already exists in this shelf. Please add labels to make it unique."
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
            shelfId: input.shelfId,
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

  // Update shelf
  updateShelf: protectedProcedure
    .input(updateShelfInput)
    .mutation(async ({ input, ctx }) => {
      // Check if shelf exists and belongs to user's organization
      const shelf = await prisma.shelf.findUnique({
        where: { id: input.shelfId },
        select: { organizationId: true, name: true },
      });

      if (!shelf) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shelf not found."
        });
      }

      if (shelf.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit shelves in your organization."
        });
      }

      // Check if new name conflicts with existing shelves (only if name is changing)
      if (shelf.name !== input.name) {
        const existingShelf = await prisma.shelf.findFirst({
          where: {
            organizationId: ctx.user!.organizationId,
            name: input.name,
            id: { not: input.shelfId },
          },
        });

        if (existingShelf) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Shelf with this name already exists in your organization."
          });
        }
      }

      const updatedShelf = await prisma.shelf.update({
        where: { id: input.shelfId },
        data: {
          name: input.name,
          lastModifiedById: ctx.user!.id,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Shelf "${input.name}" updated successfully!`,
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
          shelf: {
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

      if (item.shelf.organizationId !== ctx.user!.organizationId) {
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
            shelfId: item.shelfId,
            hashId: newHashId,
            NOT: { id: input.itemId },
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An item with this name and labels already exists in this shelf. Please modify labels to make it unique."
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
            cost: input.cost ?? null, // Explicitly set to null when undefined
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
          shelf: {
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

      if (item.shelf.organizationId !== ctx.user!.organizationId) {
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

  // Delete shelf (only if empty)
  deleteShelf: protectedProcedure
    .input(deleteShelfInput)
    .mutation(async ({ input, ctx }) => {
      // Check if shelf exists and belongs to user's organization
      const shelf = await prisma.shelf.findUnique({
        where: { id: input.shelfId },
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

      if (!shelf) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shelf not found."
        });
      }

      if (shelf.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete shelves in your organization."
        });
      }

      if (shelf._count.items > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete shelf that contains items. Move or delete items first."
        });
      }

      await prisma.shelf.delete({
        where: { id: input.shelfId },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Shelf "${shelf.name}" deleted successfully!`,
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
          shelf: {
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

      if (item.shelf.organizationId !== ctx.user!.organizationId) {
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

  // Get recent labels for the user's organization (for dropdown)
  getRecentLabels: protectedProcedure
    .query(async ({ ctx }) => {
      const labels = await prisma.label.findMany({
        where: {
          organizationId: ctx.user!.organizationId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 7, // Limit to 7 most recent labels
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