ALTER TABLE "Item"
ADD CONSTRAINT "quantity_nonnegative" CHECK ("quantity" >= 0);