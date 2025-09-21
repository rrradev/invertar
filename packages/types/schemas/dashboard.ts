import { z } from 'zod';

export const createFolderInput = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name too long"),
  type: z.enum(["ITEM", "PRODUCT"]).optional().default("ITEM"),
});

export const createItemInput = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional().default(0), // Renamed from price
  quantity: z.number().int().min(0, "Quantity cannot be negative").optional().default(0),
  folderId: z.string().min(1, "Folder ID is required"),
});

export const createProductInput = z.object({
  name: z.string().trim().min(1, "Product name is required").max(100, "Product name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  quantity: z.number().int().min(0, "Quantity cannot be negative").optional().default(0),
  folderId: z.string().min(1, "Folder ID is required"),
  recipe: z.array(z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().int().min(1, "Recipe item quantity must be at least 1"),
  })).optional().default([]),
});

export const updateFolderInput = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name too long"),
});

export const updateItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional().default(0), // Renamed from price
  // quantity removed - will be handled by adjustItemQuantityInput
  // folderId removed per requirements - folder changes will be implemented later with move/copy functionality
});

export const updateProductInput = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().trim().min(1, "Product name is required").max(100, "Product name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  recipe: z.array(z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().int().min(1, "Recipe item quantity must be at least 1"),
  })).optional(),
});

export const deleteFolderInput = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
});

export const deleteItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export const deleteProductInput = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const adjustItemQuantityInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  adjustment: z.number().int().refine((val) => val !== 0, "Adjustment cannot be zero"),
});

export const adjustProductQuantityInput = z.object({
  productId: z.string().min(1, "Product ID is required"),
  adjustment: z.number().int().refine((val) => val !== 0, "Adjustment cannot be zero"),
});

export type CreateFolderInput = z.infer<typeof createFolderInput>;
export type CreateItemInput = z.infer<typeof createItemInput>;
export type CreateProductInput = z.infer<typeof createProductInput>;
export type UpdateFolderInput = z.infer<typeof updateFolderInput>;
export type UpdateItemInput = z.infer<typeof updateItemInput>;
export type UpdateProductInput = z.infer<typeof updateProductInput>;
export type DeleteFolderInput = z.infer<typeof deleteFolderInput>;
export type DeleteItemInput = z.infer<typeof deleteItemInput>;
export type DeleteProductInput = z.infer<typeof deleteProductInput>;
export type AdjustItemQuantityInput = z.infer<typeof adjustItemQuantityInput>;
export type AdjustProductQuantityInput = z.infer<typeof adjustProductQuantityInput>;