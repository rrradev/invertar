import { z } from 'zod';
import { Unit } from '../units';

export const createFolderInput = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name too long"),
});

export const createItemInput = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  quantity: z.number().min(0, "Quantity cannot be negative").optional().default(0),
  unit: z.nativeEnum(Unit).optional().default(Unit.PCS),
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
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  unit: z.nativeEnum(Unit).optional(),
  // quantity removed - will be handled by adjustItemQuantityInput
  // folderId removed per requirements - folder changes will be implemented later with move/copy functionality
});

export const deleteFolderInput = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
});

export const deleteItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export const adjustItemQuantityInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  adjustment: z.number().refine((val) => val !== 0, "Adjustment cannot be zero"),
});

export type CreateFolderInput = z.infer<typeof createFolderInput>;
export type CreateItemInput = z.infer<typeof createItemInput>;
export type UpdateFolderInput = z.infer<typeof updateFolderInput>;
export type UpdateItemInput = z.infer<typeof updateItemInput>;
export type DeleteFolderInput = z.infer<typeof deleteFolderInput>;
export type DeleteItemInput = z.infer<typeof deleteItemInput>;
export type AdjustItemQuantityInput = z.infer<typeof adjustItemQuantityInput>;