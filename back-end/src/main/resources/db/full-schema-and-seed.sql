-- MySQL Schema and Seed Data for Inventory Management System
-- Target MySQL Version: 5.7+ / 8.0+ / MariaDB 10+
-- How to run:
--   mysql -u root -p inventory < full-schema-and-seed.sql
--
-- NOTE: If spring.jpa.hibernate.ddl-auto=update is used, this schema aligns exactly
-- with the JPA models. This file replaces the older migration/new-tables.sql and insert_data.sql.

CREATE DATABASE IF NOT EXISTS inventory;
USE inventory;

-- Disable foreign key checks to allow clean table dropping
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS purchase_order_item;
DROP TABLE IF EXISTS purchase_order;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS stock_transfer;
DROP TABLE IF EXISTS return_request;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS order_details;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS product_image;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS user_stores;
DROP TABLE IF EXISTS inventory_adjustment;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS store;
DROP TABLE IF EXISTS supplier;
DROP TABLE IF EXISTS category;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. category
CREATE TABLE category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    UNIQUE KEY uq_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. supplier
CREATE TABLE supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    address VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. store
CREATE TABLE store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. users
-- Passwords: plaintext "password" for all three roles.
-- Hash: $2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(255) NOT NULL DEFAULT 'LOCAL',
    default_store_id BIGINT NULL,
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT fk_users_default_store FOREIGN KEY (default_store_id) REFERENCES store(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4b. user_stores
CREATE TABLE user_stores (
    user_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, store_id),
    CONSTRAINT fk_user_stores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_stores_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. customer
CREATE TABLE customer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. product
CREATE TABLE product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    supplier_id BIGINT NULL,
    price DOUBLE NOT NULL,
    sku VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_product_sku (sku),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL,
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. product_image
CREATE TABLE product_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NULL,
    product_id BIGINT NOT NULL,
    CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. inventory
CREATE TABLE inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    stock_level INT NULL,
    reserved_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    UNIQUE KEY uq_store_product (store_id, product_id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. order_details
CREATE TABLE order_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NULL,
    store_id BIGINT NULL,
    total_price DOUBLE NOT NULL,
    date DATETIME NULL,
    order_status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NULL,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. order_item
CREATE TABLE order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES order_details(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. return_request
CREATE TABLE return_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'REQUESTED',
    requested_at DATETIME NOT NULL,
    requested_by BIGINT NULL,
    approved_by BIGINT NULL,
    processed_by BIGINT NULL,
    approved_at DATETIME NULL,
    processed_at DATETIME NULL,
    CONSTRAINT fk_return_request_order_item FOREIGN KEY (order_item_id) REFERENCES order_item(id) ON DELETE CASCADE,
    CONSTRAINT fk_return_requested FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_return_approved FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_return_processed FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. stock_transfer
CREATE TABLE stock_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    from_store_id BIGINT NOT NULL,
    to_store_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    requested_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    created_by BIGINT NULL,
    approved_by BIGINT NULL,
    received_by BIGINT NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_stock_transfer_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_from_store FOREIGN KEY (from_store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_to_store FOREIGN KEY (to_store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_created FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_transfer_approved FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_transfer_received FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12b. inventory_adjustment
CREATE TABLE inventory_adjustment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    proposed_stock_level INT NOT NULL,
    reason VARCHAR(255) NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    requested_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    requested_at DATETIME NOT NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_inv_adj_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_adj_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_adj_requested FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_adj_approved FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12c. notification
CREATE TABLE notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    store_id BIGINT NULL,
    recipient_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_notification_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. activity_log
CREATE TABLE activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NULL,
    action VARCHAR(255) NULL,
    entity_type VARCHAR(255) NULL,
    entity_id VARCHAR(255) NULL,
    details TEXT NULL,
    timestamp DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. purchase_order
CREATE TABLE purchase_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT NULL,
    store_id BIGINT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    order_date DATETIME NULL,
    expected_date DATETIME NULL,
    created_by BIGINT NULL,
    approved_by BIGINT NULL,
    received_by BIGINT NULL,
    approved_at DATETIME NULL,
    received_at DATETIME NULL,
    CONSTRAINT fk_purchase_order_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_order_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_order_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_order_approved FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_order_received FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. purchase_order_item
CREATE TABLE purchase_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL DEFAULT 0,
    unit_cost DOUBLE NOT NULL,
    CONSTRAINT fk_purchase_order_item_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- INDEX CREATION FOR FREQUENTLY FILTERED COLUMNS
-- ==========================================
CREATE INDEX idx_product_category ON product (category_id);
CREATE INDEX idx_product_supplier ON product (supplier_id);
CREATE INDEX idx_product_image_product ON product_image (product_id);
CREATE INDEX idx_order_details_customer ON order_details (customer_id);
CREATE INDEX idx_order_details_store ON order_details (store_id);
CREATE INDEX idx_order_details_status ON order_details (order_status);
CREATE INDEX idx_order_item_order ON order_item (order_id);
CREATE INDEX idx_order_item_product ON order_item (product_id);
CREATE INDEX idx_return_request_order_item ON return_request (order_item_id);
CREATE INDEX idx_stock_transfer_product ON stock_transfer (product_id);
CREATE INDEX idx_stock_transfer_from_store ON stock_transfer (from_store_id);
CREATE INDEX idx_stock_transfer_to_store ON stock_transfer (to_store_id);
CREATE INDEX idx_purchase_order_supplier ON purchase_order (supplier_id);
CREATE INDEX idx_purchase_order_store ON purchase_order (store_id);
CREATE INDEX idx_purchase_order_user ON purchase_order (created_by);
CREATE INDEX idx_purchase_order_item_po ON purchase_order_item (purchase_order_id);
CREATE INDEX idx_purchase_order_item_product ON purchase_order_item (product_id);


-- ==========================================
-- POPULATE SEED DATA
-- ==========================================

-- 1. Seed Categories (8 entries)
INSERT INTO category (id, name, description) VALUES
(1, 'Electronics', 'Smartphones, laptops, accessories, and gadgets'),
(2, 'Home Appliances', 'Kitchen equipment, home comfort, and laundry systems'),
(3, 'Apparel', 'Clothing, garments, footwear, and fashion accessories'),
(4, 'Books & Media', 'Educational books, novels, and electronic media'),
(5, 'Sports & Outdoors', 'Fitness gear, outdoor camping equipment, and accessories'),
(6, 'Toys & Games', 'Board games, building blocks, and interactive toys'),
(7, 'Beauty & Personal Care', 'Cosmetics, skincare products, and oral hygiene appliances'),
(8, 'Automotive & Hardware', 'Car accessories, tools, and hardware essentials');

-- 2. Seed Suppliers (6 entries)
INSERT INTO supplier (id, name, contact_email, phone, address) VALUES
(1, 'TechDistributors Inc.', 'contact@techdistributors.com', '+1-555-0101', '123 Tech Blvd, Silicon Valley, CA'),
(2, 'HomeGoods Wholesalers', 'info@homegoods.com', '+1-555-0202', '456 Appliance Way, Industrial District, IL'),
(3, 'Modern Apparel Ltd.', 'sales@modernapparel.com', '+1-555-0303', '789 Fashion Ave, Apparel Town, NY'),
(4, 'Global Book Distributors', 'orders@globalbooks.com', '+1-555-0404', '321 Literacy Rd, Boston, MA'),
(5, 'Outdoor Gear Co.', 'support@outdoorgear.com', '+1-555-0505', '654 Mountain Trail, Denver, CO'),
(6, 'AutoParts Direct', 'wholesale@autoparts.com', '+1-555-0606', '987 Garage Way, Detroit, MI');

-- 3. Seed Stores (6 entries - mix of retail and warehouses)
INSERT INTO store (id, name, address) VALUES
(1, 'Tech Store A', '123 Tech Street, Silicon Valley, CA'),
(2, 'Gadget Hub', '456 Gadget Road, San Francisco, CA'),
(3, 'ElectroMart', '789 Electro Avenue, Los Angeles, CA'),
(4, 'Mobile World', '101 Mobile Blvd, New York, NY'),
(5, 'Home Appliances HQ', '202 Appliance Parkway, Chicago, IL'),
(6, 'Central Warehouse', '500 Logistics Blvd, Detroit, MI');

-- 4. Seed Users (3 entries - admin, manager, employee)
-- Plaintext password for all: "password"
INSERT INTO users (id, username, email, password_hash, role, auth_provider, default_store_id) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'ADMIN', 'LOCAL', NULL),
(2, 'manager', 'manager@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'MANAGER', 'LOCAL', 1),
(3, 'employee', 'employee@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'EMPLOYEE', 'LOCAL', 1);

-- 4b. Seed User Stores assignment
INSERT INTO user_stores (user_id, store_id) VALUES
(2, 1), -- manager gets store 1
(2, 2), -- manager gets store 2
(3, 1); -- employee gets store 1

-- 5. Seed Customers (12 entries)
INSERT INTO customer (id, name, email, phone) VALUES
(1, 'John Doe', 'john.doe@example.com', '1234567890'),
(2, 'Jane Smith', 'jane.smith@example.com', '9876543210'),
(3, 'Tom Hanks', 'tom.hanks@example.com', '1122334455'),
(4, 'Alice Johnson', 'alice.johnson@example.com', '2233445566'),
(5, 'Bob Brown', 'bob.brown@example.com', '3344556677'),
(6, 'Mary Davis', 'mary.davis@example.com', '4455667788'),
(7, 'James Wilson', 'james.wilson@example.com', '5566778899'),
(8, 'Emily Clark', 'emily.clark@example.com', '6677889900'),
(9, 'David Lewis', 'david.lewis@example.com', '7788990011'),
(10, 'Sarah Walker', 'sarah.walker@example.com', '8899001122'),
(11, 'Daniel Young', 'daniel.young@example.com', '9900112233'),
(12, 'Jessica Hall', 'jessica.hall@example.com', '1011122334');

-- 6. Seed Products (25 entries)
INSERT INTO product (id, name, category_id, supplier_id, price, sku) VALUES
-- Category 1 (Electronics) - Supplier 1
(1, 'Galaxy S21', 1, 1, 799.99, 'SKU001'),
(2, 'iPhone 13', 1, 1, 999.99, 'SKU002'),
(3, 'Apple Watch Series 7', 1, 1, 399.99, 'SKU003'),
(4, 'Sony WH-1000XM4', 1, 1, 349.99, 'SKU004'),
(5, 'Dell XPS 13', 1, 1, 1299.99, 'SKU005'),
-- Category 2 (Home Appliances) - Supplier 2
(6, 'Dyson Vacuum Cleaner', 2, 2, 499.99, 'SKU006'),
(7, 'Philips Air Purifier', 2, 2, 199.99, 'SKU007'),
(8, 'Nespresso Coffee Maker', 2, 2, 149.99, 'SKU008'),
(9, 'Breville Espresso Machine', 2, 2, 599.99, 'SKU009'),
(10, 'Samsung Washing Machine', 2, 2, 799.99, 'SKU010'),
-- Category 3 (Apparel) - Supplier 3
(11, 'Designer Leather Jacket', 3, 3, 249.99, 'SKU011'),
(12, 'Running Shoes', 3, 3, 89.99, 'SKU012'),
(13, 'Classic Denim Jeans', 3, 3, 59.99, 'SKU013'),
(14, 'Cotton Summer Dress', 3, 3, 45.99, 'SKU014'),
-- Category 4 (Books & Media) - Supplier 4
(15, 'Introduction to Algorithms', 4, 4, 99.99, 'SKU015'),
(16, 'The Hobbit', 4, 4, 14.99, 'SKU016'),
(17, 'Clean Code', 4, 4, 39.99, 'SKU017'),
-- Category 5 (Sports & Outdoors) - Supplier 5
(18, 'Mountain Bike', 5, 5, 450.00, 'SKU018'),
(19, 'Camping Tent 4-Person', 5, 5, 120.00, 'SKU019'),
(20, 'Yoga Mat', 5, 5, 25.00, 'SKU020'),
-- Category 6 (Toys & Games) - Supplier 1
(21, 'Lego Star Wars Millennium Falcon', 6, 1, 159.99, 'SKU021'),
(22, 'Monopoly Board Game', 6, 1, 19.99, 'SKU022'),
-- Category 7 (Beauty & Personal Care) - Supplier 3
(23, 'Electric Toothbrush', 7, 3, 79.99, 'SKU023'),
(24, 'Perfume Eau de Toilette', 7, 3, 65.00, 'SKU024'),
-- Category 8 (Automotive & Hardware) - Supplier 6
(25, 'Car Battery 12V', 8, 6, 110.00, 'SKU025');

-- 7. Seed Product Images
INSERT INTO product_image (id, image_url, product_id) VALUES
(1, 'https://example.com/images/galaxy_s21.jpg', 1),
(2, 'https://example.com/images/iphone_13.jpg', 2),
(3, 'https://example.com/images/apple_watch.jpg', 3),
(4, 'https://example.com/images/sony_headphones.jpg', 4),
(5, 'https://example.com/images/dell_xps.jpg', 5),
(6, 'https://example.com/images/dyson_vacuum.jpg', 6),
(7, 'https://example.com/images/philips_purifier.jpg', 7),
(8, 'https://example.com/images/nespresso_coffee.jpg', 8),
(9, 'https://example.com/images/breville_espresso.jpg', 9),
(10, 'https://example.com/images/samsung_washer.jpg', 10),
(11, 'https://example.com/images/leather_jacket.jpg', 11),
(12, 'https://example.com/images/running_shoes.jpg', 12),
(13, 'https://example.com/images/denim_jeans.jpg', 13),
(14, 'https://example.com/images/summer_dress.jpg', 14),
(15, 'https://example.com/images/algorithms_book.jpg', 15),
(16, 'https://example.com/images/hobbit_book.jpg', 16),
(17, 'https://example.com/images/clean_code_book.jpg', 17),
(18, 'https://example.com/images/mountain_bike.jpg', 18),
(19, 'https://example.com/images/camping_tent.jpg', 19),
(20, 'https://example.com/images/yoga_mat.jpg', 20),
(21, 'https://example.com/images/lego_millennium.jpg', 21),
(22, 'https://example.com/images/monopoly.jpg', 22),
(23, 'https://example.com/images/electric_toothbrush.jpg', 23),
(24, 'https://example.com/images/perfume.jpg', 24),
(25, 'https://example.com/images/car_battery.jpg', 25);

-- 8. Seed Inventory
-- Seed some high-stock rows, and some intentionally low-stock rows (< 10) to trigger low stock alerts.
-- Total stores is 6 (5 retail, 1 warehouse). Let's distribute.
INSERT INTO inventory (product_id, store_id, stock_level, reserved_quantity, low_stock_threshold) VALUES
-- Product 1 (Galaxy S21)
(1, 1, 50, 0, 10),
(1, 2, 5, 0, 10), -- Low Stock
(1, 6, 120, 0, 10),
-- Product 2 (iPhone 13)
(2, 1, 3, 0, 10), -- Low Stock
(2, 3, 40, 0, 10),
(2, 6, 95, 0, 10),
-- Product 3 (Apple Watch)
(3, 1, 25, 0, 10),
(3, 2, 15, 0, 10),
-- Product 4 (Sony Headphones)
(4, 1, 30, 0, 10),
(4, 3, 8, 0, 10), -- Low Stock
-- Product 5 (Dell XPS 13)
(5, 1, 12, 0, 10),
(5, 2, 4, 0, 10), -- Low Stock
(5, 6, 30, 0, 10),
-- Product 6 (Dyson Vacuum)
(6, 5, 18, 0, 10),
(6, 6, 45, 0, 10),
-- Product 7 (Philips Air Purifier)
(7, 5, 25, 0, 10),
(7, 6, 60, 0, 10),
-- Product 8 (Nespresso Coffee Maker)
(8, 5, 15, 0, 10),
-- Product 9 (Breville Espresso Machine)
(9, 5, 9, 0, 10), -- Low Stock
(9, 6, 20, 0, 10),
-- Product 10 (Samsung Washing Machine)
(10, 5, 8, 0, 10), -- Low Stock
(10, 6, 25, 0, 10),
-- Product 11 (Designer Leather Jacket)
(11, 2, 15, 0, 5),
(11, 3, 2, 0, 5), -- Low Stock
-- Product 12 (Running Shoes)
(12, 2, 30, 0, 10),
(12, 3, 20, 0, 10),
-- Product 13 (Classic Denim Jeans)
(13, 2, 40, 0, 10),
(13, 3, 35, 0, 10),
-- Product 14 (Cotton Summer Dress)
(14, 2, 12, 0, 8),
-- Product 15 (Introduction to Algorithms)
(15, 1, 15, 0, 5),
(15, 6, 40, 0, 5),
-- Product 16 (The Hobbit)
(16, 2, 50, 0, 5),
-- Product 17 (Clean Code)
(17, 1, 8, 0, 5),
(17, 6, 30, 0, 5),
-- Product 18 (Mountain Bike)
(18, 3, 6, 0, 5),
(18, 6, 15, 0, 5),
-- Product 19 (Camping Tent 4-Person)
(19, 3, 10, 0, 5),
(19, 6, 25, 0, 5),
-- Product 20 (Yoga Mat)
(20, 3, 30, 0, 10),
-- Product 21 (Lego Star Wars)
(21, 1, 14, 0, 5),
(21, 2, 3, 0, 5), -- Low Stock
-- Product 22 (Monopoly Board Game)
(22, 1, 25, 0, 5),
-- Product 23 (Electric Toothbrush)
(23, 2, 18, 0, 8),
-- Product 24 (Perfume Eau de Toilette)
(24, 2, 22, 0, 8),
-- Product 25 (Car Battery 12V)
(25, 3, 11, 0, 5),
(25, 6, 40, 0, 5);

-- 9. Seed Order Details (17 orders)
-- OrderStatus: PENDING, CONFIRMED, COMPLETED, CANCELLED
INSERT INTO order_details (id, customer_id, store_id, total_price, date, order_status) VALUES
(1, 1, 1, 1149.98, '2026-04-15 10:30:00', 'PENDING'),
(2, 2, 2, 999.99, '2026-04-20 14:15:00', 'COMPLETED'),
(3, 3, 3, 499.99, '2026-05-02 09:00:00', 'COMPLETED'),
(4, 4, 4, 39.99, '2026-05-10 16:45:00', 'CANCELLED'),
(5, 5, 5, 159.99, '2026-05-15 11:20:00', 'COMPLETED'),
(6, 6, 1, 120.00, '2026-05-22 15:30:00', 'COMPLETED'),
(7, 7, 2, 249.99, '2026-06-01 10:00:00', 'COMPLETED'),
(8, 8, 3, 89.99, '2026-06-05 13:10:00', 'COMPLETED'),
(9, 9, 4, 199.99, '2026-06-12 17:00:00', 'COMPLETED'),
(10, 10, 5, 149.99, '2026-06-18 12:45:00', 'COMPLETED'),
(11, 11, 1, 599.99, '2026-06-25 09:30:00', 'COMPLETED'),
(12, 12, 2, 799.99, '2026-07-02 11:15:00', 'CONFIRMED'),
(13, 1, 3, 79.99, '2026-07-05 14:00:00', 'COMPLETED'),
(14, 2, 4, 65.00, '2026-07-08 16:30:00', 'PENDING'),
(15, 3, 5, 110.00, '2026-07-10 10:45:00', 'COMPLETED'),
(16, 4, 1, 99.99, '2026-07-11 15:00:00', 'COMPLETED'),
(17, 5, 2, 14.99, '2026-07-12 13:30:00', 'COMPLETED');

-- 10. Seed Order Items
INSERT INTO order_item (id, order_id, product_id, quantity, price) VALUES
-- Order 1: Galaxy S21 (1), Sony WH-1000XM4 (1)
(1, 1, 1, 1, 799.99),
(2, 1, 4, 1, 349.99),
-- Order 2: iPhone 13 (1)
(3, 2, 2, 1, 999.99),
-- Order 3: Dyson Vacuum Cleaner (1)
(4, 3, 6, 1, 499.99),
-- Order 4: Clean Code (1)
(5, 4, 17, 1, 39.99),
-- Order 5: Lego Star Wars (1)
(6, 5, 21, 1, 159.99),
-- Order 6: Camping Tent (1)
(7, 6, 19, 1, 120.00),
-- Order 7: Designer Leather Jacket (1)
(8, 7, 11, 1, 249.99),
-- Order 8: Running Shoes (1)
(9, 8, 12, 1, 89.99),
-- Order 9: Philips Air Purifier (1)
(10, 9, 7, 1, 199.99),
-- Order 10: Nespresso Coffee Maker (1)
(11, 10, 8, 1, 149.99),
-- Order 11: Breville Espresso Machine (1)
(12, 11, 9, 1, 599.99),
-- Order 12: Samsung Washing Machine (1)
(13, 12, 10, 1, 799.99),
-- Order 13: Electric Toothbrush (1)
(14, 13, 23, 1, 79.99),
-- Order 14: Perfume Eau de Toilette (1)
(15, 14, 24, 1, 65.00),
-- Order 15: Car Battery 12V (1)
(16, 15, 25, 1, 110.00),
-- Order 16: Introduction to Algorithms (1)
(17, 16, 15, 1, 99.99),
-- Order 17: The Hobbit (1)
(18, 17, 16, 1, 14.99);

-- 11. Seed Return Requests (3 requests)
-- ReturnStatus: REQUESTED, APPROVED, REJECTED, COMPLETED
INSERT INTO return_request (id, order_item_id, quantity, reason, status, requested_at) VALUES
(1, 4, 1, 'Defective motor', 'REQUESTED', '2026-05-04 11:00:00'),
(2, 8, 1, 'Size too small', 'APPROVED', '2026-06-03 14:00:00'),
(3, 12, 1, 'Changed my mind', 'COMPLETED', '2026-06-27 10:00:00');

-- 12. Seed Stock Transfers
-- TransferStatus: PENDING, COMPLETED, CANCELLED
INSERT INTO stock_transfer (id, product_id, from_store_id, to_store_id, quantity, status, requested_at, completed_at) VALUES
(1, 1, 1, 2, 10, 'COMPLETED', '2026-06-10 10:00:00', '2026-06-10 15:00:00'),
(2, 2, 3, 1, 5, 'PENDING', '2026-07-12 09:00:00', NULL);

-- 13. Seed Activity Logs
INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, timestamp) VALUES
(1, '1', 'CREATE_PRODUCT', 'Product', '1', 'Created product Galaxy S21', '2026-04-01 08:30:00'),
(2, '2', 'UPDATE_INVENTORY', 'Inventory', '2', 'Updated stock level of Galaxy S21 to 5 at Gadget Hub', '2026-04-02 11:00:00'),
(3, '1', 'INITIATE_TRANSFER', 'StockTransfer', '1', 'Initiated stock transfer of 10 Galaxy S21 from Tech Store A to Gadget Hub', '2026-06-10 10:00:00'),
(4, '2', 'CONFIRM_TRANSFER', 'StockTransfer', '1', 'Confirmed stock transfer of 10 Galaxy S21 at Gadget Hub', '2026-06-10 15:00:00');

-- 14. Seed Purchase Orders
-- PurchaseOrderStatus: PENDING, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
INSERT INTO purchase_order (id, supplier_id, store_id, status, order_date, expected_date, created_by) VALUES
(1, 1, 1, 'RECEIVED', '2026-05-01 10:00:00', '2026-05-05 12:00:00', 1),
(2, 2, 2, 'ORDERED', '2026-07-01 09:00:00', '2026-07-15 17:00:00', 2);

-- 15. Seed Purchase Order Items
INSERT INTO purchase_order_item (id, purchase_order_id, product_id, quantity_ordered, quantity_received, unit_cost) VALUES
(1, 1, 1, 50, 50, 600.00),
(2, 1, 3, 30, 30, 300.00),
(3, 2, 6, 20, 0, 350.00);

-- Reset AUTO_INCREMENT values to be safe for new inserts
ALTER TABLE category AUTO_INCREMENT = 9;
ALTER TABLE supplier AUTO_INCREMENT = 7;
ALTER TABLE users AUTO_INCREMENT = 4;
ALTER TABLE store AUTO_INCREMENT = 7;
ALTER TABLE customer AUTO_INCREMENT = 13;
ALTER TABLE product AUTO_INCREMENT = 26;
ALTER TABLE product_image AUTO_INCREMENT = 26;
ALTER TABLE inventory AUTO_INCREMENT = 56;
ALTER TABLE order_details AUTO_INCREMENT = 18;
ALTER TABLE order_item AUTO_INCREMENT = 19;
ALTER TABLE return_request AUTO_INCREMENT = 4;
ALTER TABLE stock_transfer AUTO_INCREMENT = 3;
ALTER TABLE activity_log AUTO_INCREMENT = 5;
ALTER TABLE purchase_order AUTO_INCREMENT = 3;
ALTER TABLE purchase_order_item AUTO_INCREMENT = 4;
ALTER TABLE inventory_adjustment AUTO_INCREMENT = 1;
ALTER TABLE notification AUTO_INCREMENT = 1;
