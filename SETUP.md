# Kenya House Listings - Setup Guide

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** installed  
3. **MySQL Server** installed and running
4. **Git** (optional, for version control)

## Database Setup

### Option 1: Using XAMPP (Recommended for Windows)
1. Download and install [XAMPP](https://www.apachefriends.org/)
2. Start MySQL and Apache from XAMPP Control Panel
3. Go to http://localhost/phpmyadmin
4. Create database named `kenyahouselistings`

### Option 2: Using MySQL Server directly
1. Install MySQL Server
2. Start MySQL service
3. Run the database initialization script:
   ```bash
   cd Flask_Backend
   python init_db.py
   ```

## Backend Setup

1. Navigate to Flask_Backend directory:
   ```bash
   cd Flask_Backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create environment file:
   ```bash
   copy .env.example .env
   ```

4. Edit `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=kenyahouselistings
   ```

5. Start the Flask backend:
   ```bash
   python app.py
   ```

The backend will run on: http://localhost:5000

## Frontend Setup

1. Navigate to React frontend directory:
   ```bash
   cd kenyahouselistings
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/signin` - User login

### Products
- `POST /api/addproducts` - Add new product/listing
- `GET /api/getproductdetails` - Get all products

### Cart & Reservations
- `POST /api/cart` - Save cart data
- `POST /api/reservations` - Create reservation

### Payments
- `POST /api/mpesa_payment` - Process M-Pesa payment

## Testing the Application

1. Ensure both backend and frontend are running
2. Open http://localhost:3000 in your browser
3. Test user registration and login
4. Try adding a listing (requires seller account)
5. Test cart and checkout functionality

## Troubleshooting

### Database Connection Issues
- Ensure MySQL server is running
- Check database credentials in `.env` file
- Verify database `kenyahouselistings` exists

### Port Conflicts
- Backend uses port 5000
- Frontend uses port 3000
- Change ports if conflicts occur

### CORS Issues
- Backend includes CORS configuration
- Ensure frontend API base URL points to http://localhost:5000/api

## Development Tips

1. Use browser DevTools to monitor API calls
2. Check Flask console for backend errors
3. Check React console for frontend errors
4. Use MySQL Workbench or phpMyAdmin to inspect database

## Production Deployment

For production deployment:
1. Set `FLASK_ENV=production`
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Configure proper database credentials
4. Set up SSL certificates
5. Configure proper CORS origins
