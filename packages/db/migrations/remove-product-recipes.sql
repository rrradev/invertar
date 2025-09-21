-- Remove recipe functionality from products
-- This migration removes the ProductItem junction table
-- and simplifies products to basic cost/price model

-- Drop the ProductItem table (recipe functionality)
DROP TABLE IF EXISTS "ProductItem";

-- Update Product model comment
COMMENT ON COLUMN "Product"."cost" IS 'Manually entered cost (not calculated from recipe)';