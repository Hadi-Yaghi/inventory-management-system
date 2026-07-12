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

-- 4. Insert Sample Data for new independent tables (Categories, Suppliers, and Users)
-- (Using INSERT IGNORE to prevent duplicate errors on re-runs)

INSERT IGNORE INTO category (id, name, description) VALUES
(1, 'Electronics', 'Smartphones, laptops, accessories, and gadgets'),
(2, 'Home Appliances', 'Kitchen equipment, home comfort, and laundry systems'),
(3, 'Apparel', 'Clothing, garments, footwear, and accessories');

INSERT IGNORE INTO supplier (id, name, contact_email, phone, address) VALUES
(1, 'TechDistributors Inc.', 'contact@techdistributors.com', '+1-555-0101', '123 Tech Blvd, Silicon Valley'),
(2, 'HomeGoods Wholesalers', 'info@homegoods.com', '+1-555-0202', '456 Appliance Way, Industrial District'),
(3, 'Modern Apparel Ltd.', 'sales@modernapparel.com', '+1-555-0303', '789 Fashion Ave, Apparel Town');

-- Insert default users with BCrypt-hashed password: "password"
INSERT IGNORE INTO users (id, username, email, password_hash, role) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'ADMIN'),
(2, 'manager', 'manager@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'MANAGER'),
(3, 'employee', 'employee@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'EMPLOYEE');

