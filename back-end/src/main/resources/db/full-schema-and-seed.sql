-- MySQL Schema and Seed Data for Inventory Management System (Multi-Tenant)
CREATE DATABASE IF NOT EXISTS inventory;
USE inventory;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS organization_invitation;
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
DROP TABLE IF EXISTS organization;

SET FOREIGN_KEY_CHECKS = 1;

-- 0a. organization
CREATE TABLE IF NOT EXISTS organization (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    timezone VARCHAR(255) DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_organization_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 0b. organization_invitation
CREATE TABLE IF NOT EXISTS organization_invitation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    accepted_at DATETIME NULL,
    UNIQUE KEY uq_invitation_token (token),
    CONSTRAINT fk_invitation_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. category
CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT fk_category_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. supplier
CREATE TABLE IF NOT EXISTS supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    CONSTRAINT fk_supplier_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. store
CREATE TABLE IF NOT EXISTS store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    CONSTRAINT fk_store_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(255) NOT NULL DEFAULT 'LOCAL',
    default_store_id BIGINT NULL,
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_users_default_store FOREIGN KEY (default_store_id) REFERENCES store(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4b. user_stores
CREATE TABLE IF NOT EXISTS user_stores (
    user_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, store_id),
    CONSTRAINT fk_user_stores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_stores_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. customer
CREATE TABLE IF NOT EXISTS customer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    CONSTRAINT fk_customer_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. product
CREATE TABLE IF NOT EXISTS product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    supplier_id BIGINT NULL,
    price DOUBLE NOT NULL,
    sku VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_product_sku (sku),
    CONSTRAINT fk_product_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL,
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. product_image
CREATE TABLE IF NOT EXISTS product_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    image_url VARCHAR(255) NULL,
    product_id BIGINT NOT NULL,
    CONSTRAINT fk_product_image_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. inventory
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    stock_level INT NULL,
    reserved_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    UNIQUE KEY uq_store_product (store_id, product_id),
    CONSTRAINT fk_inventory_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. order_details
CREATE TABLE IF NOT EXISTS order_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    customer_id BIGINT NULL,
    store_id BIGINT NULL,
    total_price DOUBLE NOT NULL,
    date DATETIME NULL,
    order_status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NULL,
    CONSTRAINT fk_order_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. order_item
CREATE TABLE IF NOT EXISTS order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    order_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    CONSTRAINT fk_order_item_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES order_details(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. return_request
CREATE TABLE IF NOT EXISTS return_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
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
    CONSTRAINT fk_return_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_return_request_order_item FOREIGN KEY (order_item_id) REFERENCES order_item(id) ON DELETE CASCADE,
    CONSTRAINT fk_return_requested FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_return_approved FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_return_processed FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. stock_transfer
CREATE TABLE IF NOT EXISTS stock_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
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
    CONSTRAINT fk_stock_transfer_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_from_store FOREIGN KEY (from_store_id) REFERENCES store(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_to_store FOREIGN KEY (to_store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12b. inventory_adjustment
CREATE TABLE IF NOT EXISTS inventory_adjustment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    proposed_stock_level INT NOT NULL,
    reason VARCHAR(255) NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    requested_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    requested_at DATETIME NOT NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_inv_adj_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_adj_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_adj_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12c. notification
CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    store_id BIGINT NULL,
    recipient_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_notification_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. activity_log
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    user_id VARCHAR(255) NULL,
    action VARCHAR(255) NULL,
    entity_type VARCHAR(255) NULL,
    entity_id VARCHAR(255) NULL,
    details TEXT NULL,
    timestamp DATETIME NOT NULL,
    CONSTRAINT fk_activity_log_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. purchase_order
CREATE TABLE IF NOT EXISTS purchase_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
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
    CONSTRAINT fk_purchase_order_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_order_store FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. purchase_order_item
CREATE TABLE IF NOT EXISTS purchase_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NULL,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL DEFAULT 0,
    unit_cost DOUBLE NOT NULL,
    CONSTRAINT fk_purchase_order_item_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_item_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data (Default Organization & Users)
INSERT IGNORE INTO organization (id, name, slug, contact_email, timezone) VALUES
(1, 'Default Organization', 'default-organization', 'admin@example.com', 'UTC');

INSERT IGNORE INTO users (id, organization_id, username, email, password_hash, role, auth_provider) VALUES
(1001, 1, 'adminUser', 'admin@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'ADMIN', 'LOCAL'),
(1002, 1, 'managerUser', 'manager@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'MANAGER', 'LOCAL'),
(1003, 1, 'employeeUser', 'employee@example.com', '$2a$10$i7iKTcCXMbkIdJISup7dA.6jSHE/XabyB1YeBs9SKJsVl6piY1yxC', 'EMPLOYEE', 'LOCAL');

