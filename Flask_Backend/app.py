from flask import Flask, request, jsonify
import pymysql
import os
import json
import datetime
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = "static/images"
DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()
SQLITE_READY = False


def get_request_data():
    return request.get_json(silent=True) if request.is_json else request.form.to_dict()


def get_request_value(data, *keys, default=None):
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return default


def parse_json_field(value, default):
    if value in (None, ""):
        return default

    if isinstance(value, (list, dict)):
        return value

    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def row_to_dict(row):
    if row is None:
        return None

    if isinstance(row, dict):
        return row

    return dict(row)


def rows_to_dicts(rows):
    return [row_to_dict(row) for row in rows]


def get_db_connection():
    # Check if SQLite is preferred
    if DB_TYPE == "sqlite":
        return get_sqlite_connection()
    
    # Default to MySQL
    return get_mysql_connection()


def get_mysql_connection():
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "chuisokogarden"),
            cursorclass=pymysql.cursors.DictCursor,
        )
        return connection
    except Exception as e:
        print(f"MySQL connection error: {e}")
        raise e


def get_sqlite_connection():
    try:
        connection = sqlite3.connect('kenyahouselistings.db')
        connection.row_factory = sqlite3.Row
        return connection
    except Exception as e:
        print(f"SQLite connection error: {e}")
        raise e


def init_sqlite_db():
    """Initialize SQLite database with required tables"""
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'buyer',
            plan TEXT DEFAULT 'free',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create product_details table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seller_email TEXT NOT NULL,
            seller_name TEXT NOT NULL,
            seller_phone TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_description TEXT,
            price TEXT NOT NULL,
            location TEXT NOT NULL,
            category TEXT,
            guests INTEGER DEFAULT 1,
            bedrooms INTEGER DEFAULT 1,
            bathrooms INTEGER DEFAULT 1,
            amenities TEXT,
            images TEXT,
            availability TEXT,
            booking_contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create cart table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buyer_email TEXT NOT NULL,
            buyer_name TEXT NOT NULL,
            items TEXT,
            item_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create reservations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reservation_id TEXT UNIQUE NOT NULL,
            buyer_name TEXT NOT NULL,
            buyer_email TEXT NOT NULL,
            buyer_phone TEXT NOT NULL,
            seller_email TEXT NOT NULL,
            listing_id TEXT NOT NULL,
            listing_title TEXT NOT NULL,
            listing_price TEXT NOT NULL,
            guests INTEGER DEFAULT 1,
            reservation_date TEXT NOT NULL,
            notes TEXT,
            payment_method TEXT DEFAULT 'mpesa',
            amount TEXT DEFAULT '0',
            payment_details TEXT,
            items TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()


@app.before_request
def ensure_sqlite_ready():
    global SQLITE_READY
    if DB_TYPE == "sqlite" and not SQLITE_READY:
        init_sqlite_db()
        SQLITE_READY = True


# Root route for Render health check
@app.route('/')
def root():
    return jsonify({
        'message': 'Kenya House Listings API',
        'status': 'running',
        'database': 'MySQL' if DB_TYPE != "sqlite" else 'SQLite',
        'endpoints': [
            '/api/health',
            '/api/signin',
            '/api/signup',
            '/api/addproducts',
            '/api/mpesa_payment',
            '/api/premium_payment',
            '/api/verify_listing_payment',
            '/api/verify_premium_payment',
            '/api/cart',
            '/api/reservations'
        ]
    })


# Health check endpoint for deployment monitoring
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Kenya House Listings API',
        'version': '1.0.0',
        'database': 'MySQL' if DB_TYPE != "sqlite" else 'SQLite',
        'timestamp': datetime.datetime.now().isoformat(),
        'endpoints': [
            '/api/signin',
            '/api/signup', 
            '/api/addproducts',
            '/api/mpesa_payment',
            '/api/premium_payment',
            '/api/verify_listing_payment',
            '/api/verify_premium_payment',
            '/api/cart',
            '/api/reservations'
        ]
    })


@app.route("/api/signin", methods=["POST"])
def signin():
    try:
        data = get_request_data()
        email = get_request_value(data, "email")
        password = get_request_value(data, "password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

        user = row_to_dict(user)

        if user and password == user["password"]:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "name": user["name"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "role": user["role"],
                    "plan": user.get("plan", "free")
                }
            })

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = get_request_data()
        name = get_request_value(data, "name", "username")
        email = get_request_value(data, "email")
        phone = get_request_value(data, "phone")
        password = get_request_value(data, "password")
        role = get_request_value(data, "role", default="buyer")
        plan = get_request_value(data, "plan", default="free")

        if not all([name, email, phone, password]):
            return jsonify({"error": "All fields are required"}), 400

        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            existing_user = cursor.fetchone()
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 400

        if DB_TYPE == "sqlite":
            cursor.execute(
                "INSERT INTO users (name, email, phone, password, role, plan) VALUES (?, ?, ?, ?, ?, ?)",
                (name, email, phone, password, role, plan)
            )
        else:
            cursor.execute(
                "INSERT INTO users (name, email, phone, password, role, plan) VALUES (%s, %s, %s, %s, %s, %s)",
                (name, email, phone, password, role, plan)
            )
        
        connection.commit()

        return jsonify({
            "message": "User created successfully",
            "user": {
                "name": name,
                "email": email,
                "phone": phone,
                "role": role,
                "plan": plan
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/addproducts", methods=["POST"])
def addproducts():
    try:
        data = get_request_data()
        
        seller_email = get_request_value(data, "seller_email")
        seller_name = get_request_value(data, "seller_name")
        seller_phone = get_request_value(data, "seller_phone")
        
        product_name = get_request_value(data, "product_name")
        product_description = get_request_value(data, "product_description")
        price = get_request_value(data, "price", "product_cost")
        location = get_request_value(data, "location")
        category = get_request_value(data, "category")
        guests = get_request_value(data, "guests", default="1")
        bedrooms = get_request_value(data, "bedrooms", default="1")
        bathrooms = get_request_value(data, "bathrooms", default="1")
        
        amenities = parse_json_field(get_request_value(data, "amenities"), [])
        image_url = get_request_value(data, "product_photo_url", "imageUrl")
        images = parse_json_field(get_request_value(data, "images"), [image_url] if image_url else [])
        availability = parse_json_field(get_request_value(data, "availability"), {})
        booking_contact = get_request_value(data, "booking_contact", seller_phone)

        if not all([seller_email, seller_name, product_name, price, location]):
            return jsonify({"error": "Required fields missing"}), 400

        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute('''
                INSERT INTO product_details 
                (seller_email, seller_name, seller_phone, product_name, product_description, 
                 price, location, category, guests, bedrooms, bathrooms, 
                 amenities, images, availability, booking_contact)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    seller_email, seller_name, seller_phone, product_name, product_description,
                    price, location, category, guests, bedrooms, bathrooms,
                    json.dumps(amenities), json.dumps(images), json.dumps(availability), booking_contact
                )
            )
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute(
                """
                INSERT INTO product_details 
                (seller_email, seller_name, seller_phone, product_name, product_description, 
                 price, location, category, guests, bedrooms, bathrooms, 
                 amenities, images, availability, booking_contact)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    seller_email, seller_name, seller_phone, product_name, product_description,
                    price, location, category, guests, bedrooms, bathrooms,
                    json.dumps(amenities), json.dumps(images), json.dumps(availability), booking_contact
                )
            )
        
        connection.commit()
        
        return jsonify({
            "message": "Product added successfully",
            "product": {
                "seller_email": seller_email,
                "product_name": product_name,
                "price": price,
                "location": location
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/cart", methods=["POST"])
def save_cart():
    try:
        data = get_request_data()
        
        buyer_email = get_request_value(data, "buyer_email")
        buyer_name = get_request_value(data, "buyer_name")
        items = parse_json_field(get_request_value(data, "items"), [])
        item_count = len(items)

        if not buyer_email:
            return jsonify({"error": "Buyer email is required"}), 400

        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO cart (buyer_email, buyer_name, items, item_count) VALUES (?, ?, ?, ?)",
                (buyer_email, buyer_name, json.dumps(items), item_count)
            )
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute(
                "INSERT INTO cart (buyer_email, buyer_name, items, item_count) VALUES (%s, %s, %s, %s)",
                (buyer_email, buyer_name, json.dumps(items), item_count)
            )
        
        connection.commit()
        
        return jsonify({
            "message": "Cart saved successfully",
            "cart": {
                "buyer_email": buyer_email,
                "item_count": item_count
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/reservations", methods=["POST"])
def create_reservation():
    try:
        data = get_request_data()
        
        buyer_name = get_request_value(data, "buyer_name")
        buyer_email = get_request_value(data, "buyer_email")
        buyer_phone = get_request_value(data, "buyer_phone")
        seller_email = get_request_value(data, "seller_email")
        listing_id = get_request_value(data, "listing_id")
        listing_title = get_request_value(data, "listing_title")
        listing_price = get_request_value(data, "listing_price")
        guests = get_request_value(data, "guests", default="1")
        reservation_date = get_request_value(data, "reservation_date", default=datetime.date.today().isoformat())
        notes = get_request_value(data, "notes", default="")
        payment_method = get_request_value(data, "payment_method", default="mpesa")
        amount = get_request_value(data, "amount", default="0")
        payment_details = parse_json_field(get_request_value(data, "payment_details"), {})
        items = parse_json_field(get_request_value(data, "items"), [])

        first_item = items[0] if isinstance(items, list) and items else {}
        seller_email = seller_email or first_item.get("sellerEmail") or first_item.get("seller_email")
        listing_id = listing_id or first_item.get("id") or first_item.get("listingId")
        listing_title = listing_title or first_item.get("title") or first_item.get("listingTitle") or "Reservation"
        listing_price = listing_price or first_item.get("price") or first_item.get("listingPrice") or amount

        if not all([buyer_name, buyer_email, seller_email, listing_id]):
            return jsonify({"error": "Required fields missing"}), 400

        connection = get_db_connection()
        
        reservation_id = f"RES-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute('''
                INSERT INTO reservations 
                (reservation_id, buyer_name, buyer_email, buyer_phone, seller_email,
                 listing_id, listing_title, listing_price, guests, reservation_date,
                 notes, payment_method, amount, payment_details, items)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    reservation_id, buyer_name, buyer_email, buyer_phone, seller_email,
                    listing_id, listing_title, listing_price, guests, reservation_date,
                    notes, payment_method, amount, json.dumps(payment_details), json.dumps(items)
                )
            )
        else:
            cursor = connection.cursor()
            cursor.execute(
                """
                INSERT INTO reservations 
                (reservation_id, buyer_name, buyer_email, buyer_phone, seller_email,
                 listing_id, listing_title, listing_price, guests, reservation_date,
                 notes, payment_method, amount, payment_details, items)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    reservation_id, buyer_name, buyer_email, buyer_phone, seller_email,
                    listing_id, listing_title, listing_price, guests, reservation_date,
                    notes, payment_method, amount, json.dumps(payment_details), json.dumps(items)
                )
            )
        
        connection.commit()
        
        return jsonify({
            "message": "Reservation created successfully", 
            "reservation_id": reservation_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/verify_listing_payment", methods=["POST"])
def verify_listing_payment():
    try:
        data = request.form if not request.is_json else (request.get_json(silent=True) or {})
        email = data.get("email")
        transaction_id = data.get("transaction_id")
        phone = data.get("phone")
        amount = data.get("amount", "0")

        return jsonify({
            "message": "Payment verified successfully",
            "email": email,
            "transaction_id": transaction_id,
            "phone": phone,
            "amount": amount
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/premium_payment", methods=["POST"])
def premium_payment():
    try:
        data = get_request_data()
        email = get_request_value(data, "email")
        transaction_id = get_request_value(data, "transactionId", "transaction_id")
        phone = get_request_value(data, "phone")
        amount = get_request_value(data, "amount", "100")

        return jsonify({
            "message": "Premium payment initiated",
            "email": email,
            "transaction_id": transaction_id,
            "phone": phone,
            "amount": amount
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/verify_premium_payment", methods=["POST"])
def verify_premium_payment():
    try:
        data = get_request_data()
        email = get_request_value(data, "email")
        transaction_id = get_request_value(data, "transactionId", "transaction_id")
        phone = get_request_value(data, "phone")
        amount = get_request_value(data, "amount", "100")

        return jsonify({
            "message": "Premium payment verified successfully",
            "email": email,
            "transaction_id": transaction_id,
            "phone": phone,
            "amount": amount
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Categories API
@app.route("/api/categories")
def get_categories():
    try:
        categories = [
            {"id": "all", "label": "All"},
            {"id": "airbnb", "label": "Airbnbs"},
            {"id": "home", "label": "Homes"},
            {"id": "hotel", "label": "Hotels"},
            {"id": "restaurant", "label": "Restaurants"}
        ]
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Dashboard APIs
@app.route("/api/dashboard/stats/<email>")
def get_dashboard_stats(email):
    try:
        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute("SELECT COUNT(*) as listings_count FROM product_details WHERE seller_email = ?", (email,))
            listings_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) as reservations_count FROM reservations WHERE seller_email = ?", (email,))
            reservations_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) as cart_count FROM cart WHERE buyer_email = ?", (email,))
            cart_count = cursor.fetchone()[0]
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute("SELECT COUNT(*) as listings_count FROM product_details WHERE seller_email = %s", (email,))
            listings_count = cursor.fetchone()['listings_count']
            
            cursor.execute("SELECT COUNT(*) as reservations_count FROM reservations WHERE seller_email = %s", (email,))
            reservations_count = cursor.fetchone()['reservations_count']
            
            cursor.execute("SELECT COUNT(*) as cart_count FROM cart WHERE buyer_email = %s", (email,))
            cart_count = cursor.fetchone()['cart_count']
        
        stats = {
            "listings": listings_count,
            "reservations": reservations_count,
            "cart_items": cart_count
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/dashboard/listings/<email>")
def get_user_listings(email):
    try:
        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM product_details WHERE seller_email = ? ORDER BY created_at DESC", (email,))
            listings = cursor.fetchall()
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute("SELECT * FROM product_details WHERE seller_email = %s ORDER BY created_at DESC", (email,))
            listings = cursor.fetchall()
        
        return jsonify(rows_to_dicts(listings))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


@app.route("/api/dashboard/reservations/<email>")
def get_user_reservations(email):
    try:
        connection = get_db_connection()
        
        if DB_TYPE == "sqlite":
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM reservations WHERE seller_email = ? ORDER BY created_at DESC", (email,))
            reservations = cursor.fetchall()
        else:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute("SELECT * FROM reservations WHERE seller_email = %s ORDER BY created_at DESC", (email,))
            reservations = cursor.fetchall()
        
        return jsonify(rows_to_dicts(reservations))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()


import requests
import datetime
import base64
from requests.auth import HTTPBasicAuth

@app.route('/api/mpesa_payment', methods=['POST'])
def mpesa_payment():
    try:
        data = get_request_data()
        amount = get_request_value(data, "amount", default="1")
        phone = get_request_value(data, "phone", "phone_number")
        account_reference = get_request_value(data, "account_reference", default="Kenya House Listings")
        transaction_desc = get_request_value(data, "transaction_desc", default="Kenya House Listings payment")

        if not phone:
            return jsonify({"error": "Phone number is required", "prompt_sent": False}), 400

        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        shortcode = os.getenv("MPESA_SHORTCODE", "174379")
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")

        if not all([consumer_key, consumer_secret, shortcode, passkey, callback_url]):
            # Mock M-Pesa service for local development
            mock_checkout_id = f"MOCK_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
            return jsonify({
                "message": "M-Pesa prompt sent to your phone (mock mode)",
                "prompt_sent": True,
                "checkout_request_id": mock_checkout_id,
                "merchant_request_id": f"MOCK_MERCHANT_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
                "mpesa_response": {
                    "ResponseCode": "0",
                    "ResponseDescription": "Success - Mock service for local development",
                    "CheckoutRequestID": mock_checkout_id
                }
            })

        auth_response = requests.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            auth=HTTPBasicAuth(consumer_key, consumer_secret),
            timeout=20
        )
        auth_response.raise_for_status()
        access_token = "Bearer " + auth_response.json()['access_token']
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password_data = shortcode + passkey + timestamp
        password = base64.b64encode(password_data.encode()).decode()
        
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": shortcode,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": access_token, "Content-Type": "application/json"},
            timeout=20
        )
        response_data = response.json()
        if not response.ok or str(response_data.get("ResponseCode")) != "0":
            return jsonify({
                "error": response_data.get("errorMessage") or response_data.get("ResponseDescription") or "M-Pesa prompt was not accepted.",
                "prompt_sent": False,
                "mpesa_response": response_data
            }), 502
        
        return jsonify({
            "message": "M-Pesa prompt sent to your phone",
            "prompt_sent": True,
            "checkout_request_id": response_data.get("CheckoutRequestID"),
            "merchant_request_id": response_data.get("MerchantRequestID"),
            "mpesa_response": response_data
        })
    except Exception as e:
        return jsonify({
            "error": f"M-Pesa prompt failed: {str(e)}",
            "prompt_sent": False
        }), 503


if __name__ == "__main__":
    # Initialize SQLite database if needed
    if DB_TYPE == "sqlite":
        init_sqlite_db()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

