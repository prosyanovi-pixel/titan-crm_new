-- Drop status_id
ALTER TABLE products DROP COLUMN IF EXISTS status_id;
ALTER TABLE services DROP COLUMN IF EXISTS status_id;

-- Add foreign key constraint to existing status column
ALTER TABLE products ADD CONSTRAINT fk_products_status FOREIGN KEY (status) REFERENCES product_status(id) ON DELETE SET NULL;
ALTER TABLE services ADD CONSTRAINT fk_services_status FOREIGN KEY (status) REFERENCES service_status(id) ON DELETE SET NULL;
