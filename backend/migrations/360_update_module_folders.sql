-- Update missing folder columns for price_lists and quotes modules
UPDATE modules SET folder = 'price_lists' WHERE id = 'price_lists' AND folder IS NULL;
UPDATE modules SET folder = 'quotes' WHERE id = 'quotes' AND folder IS NULL;
