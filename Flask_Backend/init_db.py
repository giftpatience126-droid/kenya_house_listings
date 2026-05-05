#!/usr/bin/env python3
"""
Database initialization script for Kenya House Listings
Run this script to create the database and tables
"""

import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_database_and_tables():
    """Create database and tables if they don't exist"""
    
    # Connect to MySQL without specifying database first
    connection = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "")
    )
    
    try:
        cursor = connection.cursor()
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS chuisokogarden")
        cursor.execute("USE chuisokogarden")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Create product_details table with enhanced fields
        cursor.execute("""
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
            )
        """)
        
        # Create reservations table
        cursor.execute("""
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
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_details_category ON product_details(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_details_location ON product_details(location)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_details_seller_email ON product_details(seller_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reservations_buyer_email ON reservations(buyer_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reservations_seller_email ON reservations(seller_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reservations_listing_id ON reservations(listing_id)")
        
        connection.commit()
        print("✅ ChuiSokoGarden database and tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating ChuiSokoGarden database: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    create_database_and_tables()
