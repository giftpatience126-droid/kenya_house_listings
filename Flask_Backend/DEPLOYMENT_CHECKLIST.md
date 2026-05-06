# 🚀 Render Deployment Checklist

## ✅ What's Already Prepared:
- [x] Flask app is deployment-ready
- [x] `requirements.txt` with all dependencies
- [x] `render.yaml` configuration file
- [x] Health check endpoint `/api/health`
- [x] All API endpoints configured

## 📋 Steps to Follow (Do These in Order):

### Step 1: Go to Render
- [ ] Go to https://render.com
- [ ] Click "Sign Up" → "Continue with GitHub"
- [ ] Authorize Render to access your GitHub

### Step 2: Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Click "Connect a repository"
- [ ] Select your repository
- [ ] Click "Connect"

### Step 3: Configure Settings
- [ ] Name: `kenya-house-listings-api`
- [ ] Runtime: `Python 3`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `python app.py`
- [ ] Health Check Path: `/api/health`

### Step 4: Add Environment Variables
- [ ] Click "Environment" tab
- [ ] Add these variables:

```
FLASK_ENV=production
FLASK_DEBUG=False
PYTHON_VERSION=3.9
PORT=5000
DB_HOST=your-mysql-host
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=kenyahouselistings
```

### Step 5: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 2-3 minutes for deployment
- [ ] Check status shows "Live"

### Step 6: Test
- [ ] Open: https://kenya-house-listings-api.onrender.com/api/health
- [ ] Should see: `{"status": "healthy", ...}`
- [ ] Test signup endpoint

### Step 7: Update Frontend
- [ ] Update `src/utils/api.js`:
```javascript
const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "https://kenya-house-listings-api.onrender.com";
```

## 🎯 Expected Result:
Your APIs will be live at: `https://kenya-house-listings-api.onrender.com`

## 🔧 If You Get Stuck:
1. Check Render logs for errors
2. Verify all environment variables are set
3. Make sure database credentials are correct
4. Test health endpoint first

## 📞 What I Can Help With:
- Answer questions about any step
- Fix any configuration issues
- Help troubleshoot deployment problems
- Update any code needed for deployment

Just follow the checklist and let me know if you need help with any specific step!
