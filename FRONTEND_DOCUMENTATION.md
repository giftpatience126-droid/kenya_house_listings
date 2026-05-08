# Kenya House Listings - Frontend Documentation

## 📋 Overview

Kenya House Listings is a comprehensive real estate platform built with React that allows users to browse, book, and manage property listings in Kenya. The platform features property search, booking management, premium payments, and M-Pesa integration.

## 🏗️ Tech Stack

### Frontend Technologies
- **React 19.2.5** - Core UI framework
- **React Router 7.14.1** - Client-side routing
- **Axios 1.15.0** - HTTP client for API calls
- **Bootstrap 5.3.8** - CSS framework for responsive design
- **CSS Variables** - Custom theming system

### Backend Integration
- **Flask API** - RESTful backend service
- **SQLite Database** - Local data storage
- **M-Pesa API** - Mobile payment integration
- **JSON Web Tokens** - Authentication state management

### Development Tools
- **Vercel** - Production hosting
- **Local Development** - Flask backend on localhost:5000
- **Git** - Version control
- **VS Code** - Development environment

## 📁 Project Structure

```
kenyahouselistings/
├── public/                    # Static assets
│   ├── index.html           # Main HTML template
│   ├── favicon.ico          # Site favicon
│   ├── manifest.json        # PWA configuration
│   └── robots.txt           # SEO configuration
├── src/                       # Source code
│   ├── components/           # Reusable UI components
│   │   ├── AdBanner.js
│   │   ├── ChatbotWidget.js
│   │   ├── PremiumPayment.js
│   │   └── PropertyCard.js
│   ├── contexts/            # React Context providers
│   │   └── ThemeContext.js
│   ├── pages/               # Page components
│   │   ├── AddProperty.js
│   │   ├── Auth.css
│   │   ├── Cart.js
│   │   ├── Checkout.js
│   │   ├── Dashboard.css
│   │   ├── Dashboard.js
│   │   ├── Home.css
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── ViewDetails.css
│   │   └── ViewDetails.js
│   ├── utils/               # Utility functions
│   │   ├── api.js           # API client configuration
│   │   ├── apiStatus.js     # API health checker
│   │   ├── auth.js          # Authentication helpers
│   │   ├── cart.js          # Shopping cart management
│   │   ├── chatbot.js       # Chatbot functionality
│   │   ├── listings.js      # Property listing data
│   │   ├── messages.js      # Message handling
│   │   └── reservations.js # Booking management
│   ├── App.js               # Main application component
│   ├── App.css              # Global styles
│   ├── index.js             # Application entry point
│   ├── index.css            # Base styles
│   ├── reportWebVitals.js    # Performance monitoring
│   └── setupTests.js         # Test configuration
├── package.json              # Dependencies and scripts
├── vercel.json             # Deployment configuration
└── .env.production          # Environment variables
```

## 🎨 UI/UX Features

### Theme System
- **Dark/Light Mode** - Persistent theme switching
- **CSS Variables** - Dynamic color theming
- **Responsive Design** - Mobile-first approach
- **Bootstrap Integration** - Consistent component styling

### Navigation
- **React Router** - Client-side routing
- **Protected Routes** - Authentication-based access
- **Navigation Guards** - Route protection logic

### User Experience
- **Loading States** - Async operation feedback
- **Error Boundaries** - Graceful error handling
- **Form Validation** - Real-time input validation
- **Success Messages** - Clear user feedback

## 🔍 Search & Discovery

### Property Search
```javascript
// Advanced search functionality
const searchFeatures = {
  textQuery: "Property name, location, description",
  categoryFilter: "Airbnbs, Homes, Hotels, Restaurants",
  priceRange: "Min/max price filtering",
  locationSearch: "Geographic property search",
  guestCapacity: "Filter by number of guests",
  amenitiesFilter: "Filter by available amenities"
}
```

### Property Categories
- **All Properties** - Comprehensive listing view
- **Airbnbs** - Vacation rental properties
- **Homes** - Residential properties
- **Hotels** - Hospitality properties
- **Restaurants** - Food & dining establishments

## 🛒 Shopping Cart System

### Cart Management
```javascript
// Cart functionality
const cartFeatures = {
  addProperty: "Add properties to cart",
  removeProperty: "Remove from cart",
  updateQuantity: "Modify booking dates",
  persistStorage: "Local storage persistence",
  syncWithBackend: "Server synchronization"
}
```

### Booking Flow
1. **Property Selection** - Browse and select properties
2. **Add to Cart** - Temporary booking storage
3. **Checkout Process** - Guest information collection
4. **Payment Integration** - M-Pesa payment processing
5. **Confirmation** - Booking confirmation and management

## 💳 Payment Integration

### M-Pesa API Integration
```javascript
// M-Pesa payment configuration
const mpesaConfig = {
  consumerKey: "GTWADFxIpUfDoNikNGqq1C3023evM6UH",
  consumerSecret: "amFbAoUByPV2rM5A",
  shortcode: "174379",
  passkey: "174379bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  environment: "sandbox"
}
```

### Payment Flow
1. **Initiate Payment** - Send payment details to M-Pesa
2. **STK Push** - Mobile money prompt to user
3. **Callback Handling** - Process payment confirmation
4. **Verification** - Confirm successful payment
5. **Booking Update** - Update reservation status

### Premium Plans
- **Free Plan** - Basic property browsing
- **Premium Plan** - Advanced features (100 Ksh)
- **Payment Verification** - Real-time payment confirmation

## 👤 User Authentication

### Authentication System
```javascript
// User session management
const authFeatures = {
  localStorage: "Persistent user sessions",
  sessionTimeout: "Automatic logout protection",
  roleBasedAccess: "Buyer/Seller permissions",
  premiumVerification: "Plan-based feature access"
}
```

### User Roles
- **Buyer** - Property browsing and booking
- **Seller** - Property listing and management
- **Premium** - Enhanced features and analytics

## 📊 Dashboard Features

### Seller Dashboard
```javascript
// Dashboard analytics
const dashboardFeatures = {
  propertyListings: "Manage property listings",
  bookingManagement: "View and manage reservations",
  analytics: "Property performance metrics",
  revenueTracking: "Income and payment tracking"
}
```

### Dashboard Components
- **Statistics Cards** - Key metrics display
- **Property Management** - CRUD operations for listings
- **Reservation Tracking** - Booking status monitoring
- **Revenue Analytics** - Financial performance data

## 🔧 API Integration

### API Client Configuration
```javascript
// API endpoints configuration
const apiConfig = {
  baseURL: "http://localhost:5000", // Development
  productionURL: "https://kenya-house-listings-api.onrender.com", // Production
  endpoints: {
    signin: "/api/signin",
    signup: "/api/signup",
    addproducts: "/api/addproducts",
    mpesa_payment: "/api/mpesa_payment",
    premium_payment: "/api/premium_payment",
    verify_listing_payment: "/api/verify_listing_payment",
    verify_premium_payment: "/api/verify_premium_payment",
    cart: "/api/cart",
    reservations: "/api/reservations",
    dashboard_stats: "/api/dashboard/stats/:email",
    user_listings: "/api/dashboard/listings/:email",
    user_reservations: "/api/dashboard/reservations/:email"
  }
}
```

### API Error Handling
- **Network Errors** - Connection failure handling
- **Server Errors** - HTTP error response handling
- **Timeout Management** - Request timeout handling
- **Retry Logic** - Automatic retry mechanisms
- **Fallback Services** - Local storage when API unavailable

## 🤖 Chatbot Integration

### Chatbot Features
```javascript
// Chatbot functionality
const chatbotFeatures = {
  propertyInquiries: "Answer property questions",
  bookingAssistance: "Help with booking process",
  paymentGuidance: "M-Pesa payment help",
  generalSupport: "Customer service automation"
}
```

### Chat Implementation
- **Natural Language Processing** - Basic intent recognition
- **FAQ Database** - Pre-defined responses
- **Escalation Logic** - Human agent handoff
- **Message History** - Conversation persistence

## 🎨 Styling & Theming

### CSS Architecture
```css
/* Theme system implementation */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --light-bg: #ffffff;
  --dark-bg: #1a1a1a;
}

[data-theme="dark"] {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --light-bg: #1a1a1a;
  --dark-bg: #ffffff;
}
```

### Responsive Design
- **Mobile-First** - Progressive enhancement
- **Breakpoints** - Tablet and desktop adaptations
- **Touch-Friendly** - Mobile interaction design
- **Accessibility** - WCAG compliance considerations

## 🚀 Deployment

### Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "outputDirectory": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Environment Variables
```bash
# Production environment
REACT_APP_API_ORIGIN=https://kenya-house-listings-api.onrender.com
NODE_ENV=production

# Development environment
REACT_APP_API_ORIGIN=http://localhost:5000
NODE_ENV=development
```

## 🔧 Development Setup

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Start backend server
cd Flask_Backend
python app.py
```

### Build Process
```bash
# Create production build
npm run build

# Deploy to Vercel
vercel --prod
```

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 576px
- **Tablet**: 576px - 768px
- **Desktop**: 768px - 992px
- **Large**: > 992px

### Mobile Features
- **Touch Gestures** - Swipe and tap interactions
- **Optimized Forms** - Mobile-friendly input
- **Compressed Images** - Fast loading on mobile
- **Progressive Enhancement** - Core functionality first

## 🔒 Security Features

### Client-Side Security
- **Input Sanitization** - XSS prevention
- **CSRF Protection** - Token-based requests
- **Secure Storage** - Encrypted local storage
- **HTTPS Enforcement** - Secure API communication

### Authentication Security
- **Session Management** - Secure token handling
- **Role Validation** - Permission-based access
- **Premium Verification** - Feature access control
- **Logout Protection** - Session cleanup

## 📈 Performance Optimization

### Code Splitting
- **Lazy Loading** - Component-based loading
- **Route-Based Splitting** - Page-specific bundles
- **Dynamic Imports** - On-demand loading
- **Cache Strategies** - Browser caching optimization

### Asset Optimization
- **Image Compression** - Optimized media files
- **Bundle Minification** - Reduced file sizes
- **Tree Shaking** - Dead code elimination
- **Service Workers** - Offline functionality

## 🧪 Testing Strategy

### Unit Testing
- **Component Tests** - Individual component testing
- **Utility Tests** - Function validation
- **Integration Tests** - Component interaction testing
- **Mock Services** - API simulation

### End-to-End Testing
- **User Flows** - Complete user journey testing
- **Payment Scenarios** - M-Pesa integration testing
- **Cross-Browser** - Compatibility testing
- **Mobile Testing** - Device-specific testing

## 🔄 State Management

### Local State Management
- **Component State** - Local component data
- **Context API** - Global application state
- **Local Storage** - Persistent data storage
- **Session Storage** - Temporary user data

### Data Flow
- **Props Drilling** - Parent to child data flow
- **Context Consumption** - Global state access
- **Event Handling** - User interaction response
- **API Synchronization** - Server data consistency

## 🎯 Key Features Summary

### Core Functionality
✅ **Property Search & Filtering** - Advanced search capabilities
✅ **Property Management** - CRUD operations for sellers
✅ **Booking System** - Complete reservation flow
✅ **Payment Integration** - M-Pesa mobile payments
✅ **User Authentication** - Secure login/registration
✅ **Dashboard Analytics** - Performance metrics
✅ **Premium Features** - Enhanced functionality
✅ **Chatbot Support** - Automated customer service
✅ **Mobile Responsive** - Cross-device compatibility
✅ **Theme System** - Dark/light mode switching

### Technical Achievements
✅ **Modern React** - Latest React features and hooks
✅ **RESTful Integration** - Comprehensive API connectivity
✅ **Error Handling** - Graceful failure management
✅ **Performance Optimization** - Fast loading and interaction
✅ **Security Implementation** - Best practice security measures
✅ **Deployment Ready** - Production-ready configuration

---

## 📞 Support & Maintenance

### Common Issues & Solutions
- **API Connection**: Check backend server status
- **Payment Failures**: Verify M-Pesa credentials
- **Theme Issues**: Clear browser localStorage
- **Mobile Responsiveness**: Test on different devices
- **Performance**: Optimize images and bundles

### Development Guidelines
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML elements
- Maintain consistent code style
- Test thoroughly before deployment

---

*Last Updated: May 2026*
*Version: 1.0.0*
