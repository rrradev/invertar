import { z } from 'zod';

export const createFolderInput = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name too long"),
});

export const createItemInput = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  folderId: z.string().min(1, "Folder ID is required"),
});

export const updateFolderInput = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name too long"),
});

export const updateItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  folderId: z.string().min(1, "Folder ID is required"),
});

export const deleteFolderInput = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
});

export const deleteItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export type CreateFolderInput = z.infer<typeof createFolderInput>;
export type CreateItemInput = z.infer<typeof createItemInput>;
export type UpdateFolderInput = z.infer<typeof updateFolderInput>;
export type UpdateItemInput = z.infer<typeof updateItemInput>;
export type DeleteFolderInput = z.infer<typeof deleteFolderInput>;
export type DeleteItemInput = z.infer<typeof deleteItemInput>;