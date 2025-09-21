import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";
import {
  createFolderInput,
  createItemInput,
  createProductInput,
  updateFolderInput,
  updateItemInput,
  updateProductInput,
  deleteFolderInput,
  deleteItemInput,
  deleteProductInput,
  adjustItemQuantityInput,
  adjustProductQuantityInput
} from '@repo/types/schemas/dashboard';
import { SuccessStatus } from '@repo/types/trpc';

export const dashboardRouter = router({
  // Get all folders with their items and products for the user's organization
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
          products: {
            include: {
              lastModifiedBy: {
                select: {
                  username: true,
                },
              },
              productItems: {
                include: {
                  item: {
                    select: {
                      id: true,
                      name: true,
                      cost: true,
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
        type: folder.type,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        lastModifiedBy: folder.lastModifiedBy.username,
        items: folder.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          cost: item.cost, // Renamed from price
          quantity: item.quantity,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          lastModifiedBy: item.lastModifiedBy.username,
        })),
        products: folder.products.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          cost: product.cost,
          price: product.price,
          quantity: product.quantity,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          lastModifiedBy: product.lastModifiedBy.username,
          recipe: product.productItems.map((pi: any) => ({
            itemId: pi.item.id,
            itemName: pi.item.name,
            itemCost: pi.item.cost,
            quantity: pi.quantity,
          })),
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
          type: input.type,
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
          type: newFolder.type,
          createdAt: newFolder.createdAt.toISOString(),
          updatedAt: newFolder.updatedAt.toISOString(),
          lastModifiedBy: newFolder.lastModifiedBy.username,
          items: [],
          products: [],
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
        select: { organizationId: true, type: true },
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

      if (folder.type !== "ITEM") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Items can only be created in Item folders."
        });
      }

      const newItem = await prisma.item.create({
        data: {
          name: input.name,
          description: input.description,
          cost: input.cost ?? 0, // Renamed from price
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
          cost: newItem.cost, // Renamed from price
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
          cost: input.cost ?? 0, // Renamed from price
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
              products: true,
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

      if (folder._count.items > 0 || folder._count.products > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete folder that contains items or products. Move or delete them first."
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

  // Create a new product
  createProduct: protectedProcedure
    .input(createProductInput)
    .mutation(async ({ input, ctx }) => {
      // Check if the folder exists and belongs to the user's organization
      const folder = await prisma.folder.findUnique({
        where: { id: input.folderId },
        select: { organizationId: true, type: true },
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
          message: "You can only add products to folders in your organization."
        });
      }

      if (folder.type !== "PRODUCT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Products can only be created in Product folders."
        });
      }

      // Validate recipe items if provided
      let totalCost = 0;
      if (input.recipe && input.recipe.length > 0) {
        const itemIds = input.recipe.map(r => r.itemId);
        const items = await prisma.item.findMany({
          where: {
            id: { in: itemIds },
            folder: { organizationId: ctx.user!.organizationId },
          },
          select: { id: true, cost: true },
        });

        if (items.length !== itemIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more recipe items not found in your organization."
          });
        }

        // Calculate total cost from recipe
        for (const recipeItem of input.recipe) {
          const item = items.find(i => i.id === recipeItem.itemId);
          if (item) {
            totalCost += item.cost * recipeItem.quantity;
          }
        }
      }

      // Create product
      const newProduct = await prisma.product.create({
        data: {
          name: input.name,
          description: input.description,
          cost: totalCost,
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

      // Create recipe items if provided
      if (input.recipe && input.recipe.length > 0) {
        await prisma.productItem.createMany({
          data: input.recipe.map(r => ({
            productId: newProduct.id,
            itemId: r.itemId,
            quantity: r.quantity,
          })),
        });
      }

      return {
        status: SuccessStatus.SUCCESS,
        message: `Product "${input.name}" created successfully!`,
        product: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          cost: newProduct.cost,
          price: newProduct.price,
          quantity: newProduct.quantity,
          createdAt: newProduct.createdAt.toISOString(),
          updatedAt: newProduct.updatedAt.toISOString(),
          lastModifiedBy: newProduct.lastModifiedBy.username,
        },
      };
    }),

  // Update product
  updateProduct: protectedProcedure
    .input(updateProductInput)
    .mutation(async ({ input, ctx }) => {
      // Check if product exists and belongs to user's organization
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        include: {
          folder: {
            select: { organizationId: true },
          },
          productItems: true,
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found."
        });
      }

      if (product.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit products in your organization."
        });
      }

      let totalCost = product.cost;

      // Update recipe if provided
      if (input.recipe !== undefined) {
        // Delete existing recipe items
        await prisma.productItem.deleteMany({
          where: { productId: input.productId },
        });

        totalCost = 0;
        if (input.recipe.length > 0) {
          // Validate new recipe items
          const itemIds = input.recipe.map(r => r.itemId);
          const items = await prisma.item.findMany({
            where: {
              id: { in: itemIds },
              folder: { organizationId: ctx.user!.organizationId },
            },
            select: { id: true, cost: true },
          });

          if (items.length !== itemIds.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "One or more recipe items not found in your organization."
            });
          }

          // Calculate total cost from new recipe
          for (const recipeItem of input.recipe) {
            const item = items.find(i => i.id === recipeItem.itemId);
            if (item) {
              totalCost += item.cost * recipeItem.quantity;
            }
          }

          // Create new recipe items
          await prisma.productItem.createMany({
            data: input.recipe.map(r => ({
              productId: input.productId,
              itemId: r.itemId,
              quantity: r.quantity,
            })),
          });
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id: input.productId },
        data: {
          name: input.name,
          description: input.description,
          cost: totalCost,
          price: input.price ?? 0,
          lastModifiedById: ctx.user!.id,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Product "${input.name}" updated successfully!`,
      };
    }),

  // Delete product
  deleteProduct: protectedProcedure
    .input(deleteProductInput)
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: {
          name: true,
          folder: {
            select: { organizationId: true },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found."
        });
      }

      if (product.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete products in your organization."
        });
      }

      await prisma.product.delete({
        where: { id: input.productId },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Product "${product.name}" deleted successfully!`,
      };
    }),

  // Adjust product quantity (+/-)
  adjustProductQuantity: protectedProcedure
    .input(adjustProductQuantityInput)
    .mutation(async ({ input, ctx }) => {
      // Check if product exists and belongs to user's organization
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: {
          id: true,
          name: true,
          quantity: true,
          folder: {
            select: { organizationId: true },
          },
          productItems: {
            include: {
              item: {
                select: { id: true, name: true, quantity: true },
              },
            },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found."
        });
      }

      if (product.folder.organizationId !== ctx.user!.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only adjust product quantities in your organization."
        });
      }

      const newQuantity = product.quantity + input.adjustment;

      if (newQuantity < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product quantity cannot be negative."
        });
      }

      // If increasing product quantity (producing), check if we have enough ingredients
      if (input.adjustment > 0 && product.productItems.length > 0) {
        const requiredItems = product.productItems.map(pi => ({
          id: pi.item.id,
          name: pi.item.name,
          required: pi.quantity * input.adjustment,
          available: pi.item.quantity,
        }));

        const insufficientItems = requiredItems.filter(item => item.available < item.required);
        
        if (insufficientItems.length > 0) {
          const itemNames = insufficientItems.map(item => 
            `${item.name} (need ${item.required}, have ${item.available})`
          ).join(', ');
          
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient ingredients to produce ${input.adjustment} units: ${itemNames}`
          });
        }

        // Deduct ingredients from inventory
        for (const pi of product.productItems) {
          await prisma.item.update({
            where: { id: pi.item.id },
            data: {
              quantity: { decrement: pi.quantity * input.adjustment },
            },
          });
        }
      }

      // Update product quantity
      const updatedProduct = await prisma.product.update({
        where: { id: input.productId },
        data: {
          quantity: newQuantity,
          lastModifiedById: ctx.user!.id,
        },
      });

      return {
        status: SuccessStatus.SUCCESS,
        message: `Product "${product.name}" quantity adjusted by ${input.adjustment}. New quantity: ${newQuantity}`,
        newQuantity: updatedProduct.quantity,
      };
    }),
});