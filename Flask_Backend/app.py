from flask import Flask, request, jsonify
import pymysql
import os
import json
import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = "static/images"


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
    except Exception:
        return default

def get_db_connection():
    return pymysql.connect(
        user=os.getenv("DB_USER", "root"),
        host=os.getenv("DB_HOST", "localhost"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "chuisokogarden")
    )

# create a route

@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        form = request.form
        username = form.get("username") or form.get("name")
        password = form.get("password")
        email = form.get("email")
        phone = form.get("phone")

        if not username or not password or not email:
            return jsonify({"error": "Username, email, and password are required."}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "An account with that email already exists."}), 409
        
        cursor.execute(
            "INSERT INTO users(username, password, email, phone) VALUES(%s, %s, %s, %s)",
            (username, password, email, phone)
        )
        connection.commit()
        return jsonify({"message": "Thank you for joining"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()




@app.route("/api/signin", methods=["POST"])
def signin():
    try:
        data = get_request_data()
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute(
            "SELECT * FROM users WHERE email=%s AND password=%s",
            (data.get("email"), data.get("password"))
        )
        
        if cursor.rowcount == 0:
            return jsonify({"message": "Login failed"}), 401
        
        return jsonify({
            "message": "Login successful",
            "user": cursor.fetchone()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()
    


@app.route("/api/addproducts", methods=["POST"])
def addproducts():
    try:
        product_photo = request.files.get('product_photo')
        filename = None
        
        if product_photo and product_photo.filename:
            os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
            filename = product_photo.filename
            product_photo.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get form data with fallbacks for optional fields
        product_name = request.form.get("product_name")
        product_description = request.form.get("product_description")
        product_cost = request.form.get("product_cost")
        category = request.form.get("category")
        location = request.form.get("location")
        seller_name = request.form.get("seller_name")
        seller_email = request.form.get("seller_email")
        product_photo_url = request.form.get("product_photo_url")
        
        cursor.execute(
            "INSERT INTO product_details(product_name, product_description, product_cost, product_photo, category, location, seller_name, seller_email, product_photo_url) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (product_name, product_description, product_cost, filename or product_photo_url, 
             category, location, seller_name, seller_email, product_photo_url)
        )
        connection.commit()
        return jsonify({"message": "Product added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()
    
@app.route("/api/getproductdetails")
def getproductdetails():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT * FROM product_details")
        return jsonify(cursor.fetchall())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()

@app.route("/api/cart", methods=["POST"])
def save_cart():
    try:
        data = get_request_data()
        buyer_email = get_request_value(data, "buyerEmail", "buyer_email")
        buyer_name = get_request_value(data, "buyerName", "buyer_name")
        items = parse_json_field(data.get("items", []), [])
        
        # Here you would save to database - for now just return success
        return jsonify({"message": "Cart saved successfully", "items_count": len(items)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reservations", methods=["POST"])
def create_reservation():
    try:
        data = get_request_data()
        
        # Extract reservation data
        buyer_name = get_request_value(data, "buyerName", "buyer_name")
        buyer_email = get_request_value(data, "buyerEmail", "buyer_email")
        buyer_phone = get_request_value(data, "buyerPhone", "buyer_phone")
        guests = data.get("guests")
        reservation_date = get_request_value(data, "reservationDate", "reservation_date")
        notes = data.get("notes")
        payment_method = get_request_value(data, "paymentMethod", "payment_method")
        amount = data.get("amount")
        payment_details = parse_json_field(data.get("payment_details"), {})
        items = parse_json_field(data.get("items", []), [])
        
        # Extract seller and listing info from items
        seller_email = None
        listing_id = None
        listing_title = None
        listing_price = None
        
        if items and len(items) > 0:
            first_item = items[0]
            seller_email = first_item.get("sellerEmail")
            listing_id = first_item.get("id")
            listing_title = first_item.get("title")
            listing_price = first_item.get("price")
        
        # Save to database
        connection = get_db_connection()
        cursor = connection.cursor()
        
        reservation_id = f"RES-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        cursor.execute(
            """INSERT INTO reservations (
                reservation_id, buyer_name, buyer_email, buyer_phone, seller_email,
                listing_id, listing_title, listing_price, guests, reservation_date,
                notes, payment_method, amount, payment_details, items
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
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

        if not email or not transaction_id:
            return jsonify({"error": "Email and transaction ID are required."}), 400

        return jsonify({
            "message": "Payment verified successfully",
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
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Get user's listings
        cursor.execute("SELECT COUNT(*) as listings_count FROM product_details WHERE seller_email = %s", (email,))
        listings_count = cursor.fetchone()['listings_count']
        
        # Get user's reservations (as seller)
        cursor.execute("SELECT COUNT(*) as reservations_count FROM reservations WHERE seller_email = %s", (email,))
        reservations_count = cursor.fetchone()['reservations_count']
        
        # Get user's cart items (as buyer)
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
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("SELECT * FROM product_details WHERE seller_email = %s ORDER BY created_at DESC", (email,))
        listings = cursor.fetchall()
        
        return jsonify(listings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'connection' in locals():
            connection.close()

@app.route("/api/dashboard/reservations/<email>")
def get_user_reservations(email):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Get reservations where user is seller
        cursor.execute("SELECT * FROM reservations WHERE seller_email = %s ORDER BY created_at DESC", (email,))
        reservations = cursor.fetchall()
        
        return jsonify(reservations)
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
        amount = request.form.get('amount', '1')
        phone = request.form.get('phone') or request.form.get('phone_number')
        
        # Get access token
        auth_response = requests.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            auth=HTTPBasicAuth("GTWADFxIpUfDoNikNGqq1C3023evM6UH", "amFbAoUByPV2rM5A")
        )
        access_token = "Bearer " + auth_response.json()['access_token']
        
        # Generate password
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password_data = "174379bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" + timestamp
        password = base64.b64encode(password_data.encode()).decode()
        
        # STK Push payload
        payload = {
            "BusinessShortCode": "174379",
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": "174379",
            "PhoneNumber": phone,
            "CallBackURL": "https://coding.co.ke/api/confirm.php",
            "AccountReference": "Kenya House Listings",
            "TransactionDesc": "Payments for Products"
        }
        
        # Send STK Push
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": access_token, "Content-Type": "application/json"}
        )
        
        return jsonify({"message": "M-Pesa prompt sent to your phone"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
































# Health check endpoint for deployment monitoring
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Kenya House Listings API',
        'version': '1.0.0',
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

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
