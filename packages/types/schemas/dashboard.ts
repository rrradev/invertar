import { z } from 'zod';
import { Unit } from '../units';

export const createShelfInput = z.object({
  name: z.string().trim().min(1, "Shelf name is required").max(100, "Shelf name too long"),
});

export const createLabelInput = z.object({
  name: z.string().trim().min(1, "Label name is required").max(50, "Label name too long"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

export const createItemInput = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  quantity: z.number().min(0, "Quantity cannot be negative").optional().default(0),
  unit: z.nativeEnum(Unit).optional().default(Unit.PCS),
  shelfId: z.string().min(1, "Shelf ID is required"),
  labelIds: z.array(z.string()).max(2, "Items can have at most 2 labels").optional(),
});

export const updateShelfInput = z.object({
  shelfId: z.string().min(1, "Shelf ID is required"),
  name: z.string().trim().min(1, "Shelf name is required").max(100, "Shelf name too long"),
});

export const updateItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name too long"),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Price cannot be negative").optional().default(0),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  unit: z.nativeEnum(Unit).optional(),
  labelIds: z.array(z.string()).max(2, "Items can have at most 2 labels").optional(),
  // quantity removed - will be handled by adjustItemQuantityInput
  // shelfId removed per requirements - shelf changes will be implemented later with move/copy functionality
});

export const deleteShelfInput = z.object({
  shelfId: z.string().min(1, "Shelf ID is required"),
});

export const deleteItemInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export const adjustItemQuantityInput = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  adjustment: z.number().refine((val) => val !== 0, "Adjustment cannot be zero"),
});

export type CreateLabelInput = z.infer<typeof createLabelInput>;
export type CreateShelfInput = z.infer<typeof createShelfInput>;
export type CreateItemInput = z.infer<typeof createItemInput>;
export type UpdateShelfInput = z.infer<typeof updateShelfInput>;
export type UpdateItemInput = z.infer<typeof updateItemInput>;
export type DeleteShelfInput = z.infer<typeof deleteShelfInput>;
export type DeleteItemInput = z.infer<typeof deleteItemInput>;
export type AdjustItemQuantityInput = z.infer<typeof adjustItemQuantityInput>;