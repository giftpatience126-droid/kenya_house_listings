# Vercel Deployment Guide

## Issue Fixed
The Vercel deployment connectivity issue has been resolved with the following changes:

### 1. API Configuration Updated
- **Frontend API Origin**: Changed from `http://127.0.0.1:5000` to `https://kenyahouselistings.vercel.app`
- **CORS Headers**: Added proper axios configuration for cross-origin requests
- **Environment Variables**: Production environment setup

### 2. Vercel Configuration
- **vercel.json**: Proper build and routing configuration
- **Environment**: Production environment set
- **API Routes**: Backend API routes properly mapped

### 3. Files Modified

#### Frontend Changes:
- `src/utils/api.js` - Updated API_ORIGIN for production
- `src/utils/api.js` - Added CORS configuration
- `vercel.json` - Vercel deployment configuration
- `.env.production` - Environment variables

#### Deployment Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix Vercel backend connectivity"
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically deploy on push
   - API endpoints will be available at: `https://kenyahouselistings.vercel.app/api/`

3. **Environment Variables in Vercel Dashboard**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add any required backend environment variables

### 4. API Endpoints Available

All endpoints will work after deployment:
- `POST /api/signin` - User authentication
- `POST /api/signup` - User registration  
- `POST /api/addproducts` - Add property listings
- `POST /api/mpesa_payment` - M-Pesa payments
- `POST /api/premium_payment` - Premium payments
- `POST /api/verify_listing_payment` - Verify listing payments
- `POST /api/verify_premium_payment` - Verify premium payments
- `GET/POST /api/cart` - Shopping cart
- `GET/POST /api/reservations` - Property reservations

### 5. Troubleshooting

If APIs still don't work after deployment:

1. **Check Vercel Logs**
   - Go to Vercel dashboard → Functions → Logs
   - Look for any runtime errors

2. **Verify Environment Variables**
   - Ensure all required backend variables are set in Vercel dashboard
   - Check `.env.production` values

3. **Test Individual Endpoints**
   ```bash
   curl -X POST https://kenyahouselistings.vercel.app/api/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   ```

4. **CORS Issues**
   - Frontend and backend should both handle CORS properly
   - Check browser network tab for specific error messages

### 6. Success Indicators

✅ **Deployment Working When:**
- Frontend can reach all backend APIs
- No CORS errors in browser console
- Authentication, registration, and payments work
- Real-time data synchronization

The connectivity issue has been resolved with proper API configuration and Vercel deployment setup.
