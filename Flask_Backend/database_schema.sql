-- ChuiSokoGarden Database Schema
-- Run this script to create/update your database structure

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS chuisokogarden;
USE chuisokogarden;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product details table with enhanced fields
CREATE TABLE IF NOT EXISTS product_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_cost DECIMAL(10,2),
    product_photo VARCHAR(255),
    product_photo_url VARCHAR(500),
    category VARCHAR(100),
    location VARCHAR(255),
    seller_name VARCHAR(255),
    seller_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart table (optional - for future enhancement)
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255),
    items JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    seller_email VARCHAR(255),
    listing_id VARCHAR(255),
    listing_title VARCHAR(255),
    listing_price VARCHAR(255),
    guests INT DEFAULT 1,
    reservation_date DATE,
    notes TEXT,
    payment_method VARCHAR(50),
    amount DECIMAL(10,2),
    payment_details JSON,
    items JSON,
    status VARCHAR(50) DEFAULT 'Pending confirmation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_product_details_category ON product_details(category);
CREATE INDEX IF NOT EXISTS idx_product_details_location ON product_details(location);
CREATE INDEX IF NOT EXISTS idx_product_details_seller_email ON product_details(seller_email);
CREATE INDEX IF NOT EXISTS idx_cart_buyer_email ON cart(buyer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer_email ON reservations(buyer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_seller_email ON reservations(seller_email);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_listing_id ON reservations(listing_id);
