-- NEW SCHEMAS MIGRATION
--
-- New Tables:
-- 1. category: table containing category details (id, name, description)
-- 2. supplier: table containing supplier contact info (id, name, contact_email, phone, address)
-- 3. product_image: table hosting multiple product image URLs linked to a product
-- 4. stock_transfer: log table tracking stock transfers between stores
-- 5. users: table managing user credentials and Spring Security role designations (id, username, email, password_hash, role)
--
-- New Columns added to existing tables:
-- 1. product.category_id: Foreign key linking a product to its category
-- 2. product.supplier_id: Foreign key linking a product to its supplier
-- 3. inventory.low_stock_threshold: Threshold level to trigger low stock alerts (default 10)

-- 1. Create Independent tables
CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    address VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- 2. Create Dependent tables referencing existing or new tables
CREATE TABLE IF NOT EXISTS product_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NULL,
    product_id BIGINT NOT NULL,
    CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    from_store_id BIGINT NOT NULL,
    to_store_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    requested_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    CONSTRAINT fk_stock_transfer_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_from_store FOREIGN KEY (from_store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_to_store FOREIGN KEY (to_store_id) REFERENCES store(id) ON DELETE CASCADE
);

-- 3. Alter existing tables to add columns and foreign key constraints
ALTER TABLE product ADD COLUMN IF NOT EXISTS category_id BIGINT NULL;
ALTER TABLE product ADD COLUMN IF NOT EXISTS supplier_id BIGINT NULL;

ALTER TABLE product ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL;
ALTER TABLE product ADD CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL;

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10;
