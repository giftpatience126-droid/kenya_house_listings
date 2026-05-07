# Kenya House Listings Project Documentation

## 1. What This Project Does

Kenya House Listings is a property marketplace. Visitors can browse homes, Airbnbs, hotels, and restaurants. Registered users can log in, add listings, save carts, create reservations, and start payment flows.

The project has two main parts:

- `kenyahouselistings/`: the React website users see in the browser.
- `Flask_Backend/`: the Flask API that handles accounts, listings, carts, reservations, dashboard data, and payment requests.

The root `vercel.json` connects both parts for Vercel publishing.

## 2. Main Folder Structure

```text
KHL/
  api/
    index.py
  Flask_Backend/
    app.py
    api/index.py
    requirements.txt
    kenyahouselistings.db
    database_schema.sql
    deployment docs
  kenyahouselistings/
    src/
      components/
      contexts/
      pages/
      utils/
    public/
    package.json
    build/
  vercel.json
  requirements.txt
  README.md
  PROJECT_DOCUMENTATION.md
```

## 3. Root Files

### `vercel.json`

This file tells Vercel how to build and route the project.

```json
{
  "version": 2,
  "buildCommand": "cd kenyahouselistings && npm ci && npm run build",
  "outputDirectory": "kenyahouselistings/build",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Important behavior:

- `/api/...` goes to the Flask backend.
- every other route goes to React, so routes like `/login`, `/cart`, and `/dashboard` work after refresh.
- `npm ci` installs exact frontend dependencies from `package-lock.json`.

### `requirements.txt`

This root file lets Vercel install the Python packages needed by the API:

- `Flask`
- `pymysql`
- `Flask-CORS`
- `requests`
- `python-dotenv`

### `api/index.py`

This is the serverless entrypoint Vercel uses for backend requests. It adds `Flask_Backend/` to Python's import path, sets safe defaults, and exports the Flask app.

```python
os.environ.setdefault("DB_TYPE", "sqlite")
os.environ.setdefault("SQLITE_DB_PATH", os.path.join(tempfile.gettempdir(), "kenyahouselistings.db"))

from app import app
```

The temporary SQLite path prevents Vercel filesystem write errors. For real production data, use MySQL environment variables instead.

## 4. Backend: `Flask_Backend/`

### `app.py`

This is the main API file. It creates the Flask app, configures CORS, connects to SQLite or MySQL, creates SQLite tables when needed, and defines all routes.

Database mode:

- `DB_TYPE=sqlite`: uses SQLite.
- any other value: uses MySQL through `pymysql`.

SQLite path:

- local default: `Flask_Backend/kenyahouselistings.db`
- Vercel default: temporary serverless storage
- configurable with `SQLITE_DB_PATH`

### Backend API Routes

- `GET /`: backend status and route summary.
- `GET /api/health`: health check used by the frontend and deployment checks.
- `POST /api/signin`: logs in a user.
- `POST /api/signup`: creates a user.
- `POST /api/addproducts`: creates a listing.
- `POST /api/cart`: saves cart data.
- `POST /api/reservations`: creates a reservation.
- `POST /api/mpesa_payment`: starts an M-Pesa STK push or returns mock success when credentials are missing.
- `POST /api/verify_listing_payment`: verifies listing payment data.
- `POST /api/premium_payment`: starts a premium payment flow.
- `POST /api/verify_premium_payment`: verifies premium payment data.
- `GET /api/categories`: returns listing categories.
- `GET /api/dashboard/stats/<email>`: returns seller/buyer dashboard counts.
- `GET /api/dashboard/listings/<email>`: returns listings for a seller.
- `GET /api/dashboard/reservations/<email>`: returns reservations for a seller.

### Environment Variables

Use these in Vercel when needed:

```text
DB_TYPE=mysql
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
CORS_ORIGINS=https://your-vercel-domain.vercel.app
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/mpesa_callback
```

If M-Pesa variables are missing, the API returns a mock payment response so the website does not crash during testing.

## 5. Frontend: `kenyahouselistings/`

### `package.json`

This defines the React app dependencies and commands.

Common commands:

```text
npm start
npm run build
npm test
```

### `src/App.js`

This file defines the browser routes:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/add`
- `/premium-payment`
- `/ViewDetails`
- `/cart`
- `/checkout`

### `src/utils/api.js`

This is the frontend API client. It builds all API URLs and sends requests with Axios.

Production behavior:

- `REACT_APP_API_ORIGIN=` is blank.
- API calls use same-origin paths like `/api/signin`.
- This avoids hardcoding a Vercel domain and prevents cross-domain mistakes.

Development behavior:

- `.env.development` sets `REACT_APP_API_ORIGIN=http://localhost:5000`.
- local React can talk to a local Flask server.

### `src/utils/apiStatus.js`

This checks `GET /api/health`. Older code tried `HEAD` requests against `POST` routes, which can report false failures. The current check uses the real health endpoint.

### `src/contexts/ThemeContext.js`

This stores the selected light or dark theme in local storage and applies it to the page. The default is light.

### `src/index.css` and Page CSS Files

Global colors and theme variables live in `src/index.css`. The deployed background is explicitly set on `html`, `body`, and `#root`, and the dark theme uses a dark gray/blue background instead of pure black.

## 6. How To Run Locally

### Frontend

```text
cd kenyahouselistings
npm install
npm start
```

The website opens at `http://localhost:3000`.

### Backend

```text
cd Flask_Backend
pip install -r requirements.txt
python app.py
```

The API runs at `http://localhost:5000`.

## 7. How To Deploy To Vercel

1. Push the full `KHL` folder to GitHub.
2. Open Vercel and import the GitHub repository.
3. Keep the project root as the repository root.
4. Let Vercel use the root `vercel.json`.
5. Add environment variables in Vercel if using MySQL or real M-Pesa.
6. Click Deploy.
7. After deployment, visit:

```text
https://your-project.vercel.app/api/health
```

You should see a JSON response with `"status": "healthy"`.

## 8. Deployment Fixes Made

- Added root `api/index.py` so Vercel can run Flask.
- Added root `requirements.txt` so Vercel installs Python packages.
- Updated root `vercel.json` so API requests are routed before React fallback routes.
- Changed the frontend production API origin to same-origin `/api/...`.
- Fixed the API health checker to use `GET /api/health`.
- Changed SQLite to use a configurable path and a safe temporary path on Vercel.
- Made the deployed page background explicit and softened dark mode away from pure black.

## 9. Production Notes

SQLite on Vercel is temporary because serverless functions do not provide permanent writable storage. It is fine for testing, but real accounts, listings, carts, and reservations should use MySQL or another hosted database.

For permanent data, set the MySQL environment variables in Vercel and set:

```text
DB_TYPE=mysql
```

## 10. Quick Test Checklist

After deployment, test these:

1. Visit `/api/health`.
2. Open the homepage.
3. Register a test user.
4. Log in.
5. Add a listing as a seller.
6. Add a listing to cart.
7. Create a reservation.
8. Try the payment flow.
9. Refresh `/dashboard` directly to confirm React routing works.
