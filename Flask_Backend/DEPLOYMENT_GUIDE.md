# Kenya House Listings API Deployment Guide

## 🚀 Quick Deployment Options

Choose one of the following platforms to deploy your Flask API:

### Option 1: Vercel (Recommended - Free & Easy)

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

#### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the Flask backend folder
5. Vercel will automatically detect it's a Python app

#### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
FLASK_ENV=production
PYTHON_VERSION=3.9
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=kenyahouselistings
```

#### Step 4: Update Frontend API URL
Update `src/utils/api.js`:
```javascript
const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "https://your-vercel-app.vercel.app";
```

---

### Option 2: Render (Free Tier Available)

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Select the Flask backend folder
4. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Runtime**: Python 3.9

#### Step 3: Configure Environment Variables
```bash
FLASK_ENV=production
PYTHON_VERSION=3.9
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=kenyahouselistings
```

---

### Option 3: Railway (Free Tier Available)

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

#### Step 2: Deploy
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Railway will auto-detect Python app

#### Step 3: Configure Variables
Add these environment variables in Railway dashboard:
```bash
FLASK_ENV=production
PYTHON_VERSION=3.9
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=kenyahouselistings
```

---

## 🗄️ Database Setup

### Option A: Use Free Cloud Database
1. **Supabase** (PostgreSQL) - Free tier available
2. **PlanetScale** (MySQL) - Free tier available
3. **Railway** (PostgreSQL) - Free tier available

### Option B: Use SQLite (Simplest)
For testing, you can use SQLite instead of MySQL:

```python
# Replace MySQL connection with SQLite
import sqlite3

def get_db_connection():
    return sqlite3.connect('kenyahouselistings.db')
```

---

## 🔧 Environment Configuration

### Production Environment Variables
Create `.env.production`:
```bash
# Database
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=kenyahouselistings

# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# Security
SECRET_KEY=your-secret-key-here

# CORS (allow your frontend)
CORS_ORIGINS=https://kenyahouselistings.vercel.app,https://localhost:3000
```

---

## 🧪 Testing Your Deployment

### Health Check Endpoint
After deployment, test:
```bash
curl https://your-api-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Kenya House Listings API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T12:00:00",
  "endpoints": [
    "/api/signin",
    "/api/signup",
    "/api/addproducts",
    "/api/mpesa_payment",
    "/api/premium_payment",
    "/api/verify_listing_payment",
    "/api/verify_premium_payment",
    "/api/cart",
    "/api/reservations"
  ]
}
```

### Test API Endpoints
```bash
# Test signup
curl -X POST https://your-api-domain.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"254700000000","password":"test123"}'

# Test signin
curl -X POST https://your-api-domain.vercel.app/api/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📱 Frontend Integration

### Update API Configuration
In your React app (`src/utils/api.js`):
```javascript
const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "https://your-api-domain.vercel.app";
```

### Test Frontend-Backend Connection
1. Start your React app
2. Try to sign up/sign in
3. Check browser network tab for API calls
4. Verify data is flowing correctly

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. CORS Errors
Add this to your Flask app:
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://kenyahouselistings.vercel.app", "https://localhost:3000"])
```

#### 2. Database Connection Failed
- Check database credentials
- Ensure database is accessible from deployment platform
- Test connection manually

#### 3. 500 Internal Server Error
- Check deployment logs
- Test locally with same environment variables
- Verify all dependencies are installed

#### 4. M-Pesa Payment Issues
- Update callback URL in production
- Use production M-Pesa credentials
- Test with small amounts first

---

## 📋 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Choose deployment platform (Vercel/Render/Railway)
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Deploy API
- [ ] Test health check endpoint
- [ ] Test all API endpoints
- [ ] Update frontend API URL
- [ ] Test full application flow
- [ ] Set up monitoring/alerts

---

## 🎯 Recommended: Vercel + Supabase

For the easiest deployment:
1. **Backend**: Deploy Flask to Vercel (free)
2. **Database**: Use Supabase PostgreSQL (free)
3. **Frontend**: Already on Vercel

This gives you a complete free hosting solution with excellent performance and monitoring.

---

## 📞 Support

If you encounter issues:
1. Check deployment platform logs
2. Test API endpoints individually
3. Verify environment variables
4. Check CORS configuration
5. Test database connection

Your APIs will be live and working once you complete these steps!
