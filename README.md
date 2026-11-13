# Lapreh Developer Guide

Lapreh is a full-stack ecommerce application for fashion and lifestyle products. The repository contains a React storefront and an Express API backed by MongoDB.

## Repository layout

```text
Lapreh - Copy/
├── backend/       # Express API, MongoDB models, routes, and tests
├── frontend/      # React storefront built with Vite
├── lapreh.products.json
└── lapreh.products-org.json
```

## Prerequisites

- Node.js and npm
- MongoDB, running locally or available through MongoDB Atlas
- Razorpay test credentials to exercise online checkout
- Optional SMTP credentials for email features

## First-time setup

### 1. Configure the backend

From the project root:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set at least `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`. `CLIENT_URL` should match the frontend's local address (by default, `http://127.0.0.1:5173`). Email delivery settings are optional.

Example local values:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
CLIENT_URL=http://127.0.0.1:5173
MONGO_URI=mongodb://127.0.0.1:27017/lapreh
JWT_SECRET=replace-with-a-long-random-secret
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Do not commit `.env` or use development credentials in production.

### 2. Install dependencies

Open a terminal at the project root and install each app's dependencies:

```powershell
Set-Location backend
npm install
Set-Location ..\frontend
npm install
```

### 3. Start MongoDB and the applications

Start MongoDB using your local installation or Atlas connection. Then run the API and storefront in separate terminals.

Backend terminal:

```powershell
Set-Location backend
npm run dev
```

Frontend terminal:

```powershell
Set-Location frontend
npm run dev
```

By default, the storefront is available at `http://localhost:5173` and the API at `http://localhost:3000`. Vite proxies `/api` and `/uploads` requests to the backend. To change the proxy target, set `VITE_DEV_SERVER_PROXY_TARGET` or `VITE_BACKEND_URL` in the frontend environment.

## Database seeding

The backend seed command loads catalog records from `lapreh.products-org.json` and requires the referenced categories to already exist in MongoDB. It also **deletes existing products, orders, carts, and users** before inserting demo data. Only run it against a disposable development database after backing up anything you need.

```powershell
Set-Location backend
npm run seed
```

## Common commands

Run these commands from the corresponding app directory.

### Backend

```powershell
npm run dev       # Start the API with automatic restart
npm start         # Start the API without nodemon
npm run seed      # Replace database data with development seed data (destructive)
```

### Frontend

```powershell
npm run dev       # Start the Vite development server
npm run build     # Build the production frontend
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```

## API overview

The API is mounted under `/api`. Main route groups include:

- `/api/auth` — registration, login, and current-user information
- `/api/products` and `/api/categories` — catalog
- `/api/cart` and `/api/wishlist` — customer shopping lists
- `/api/orders` — order creation and order history
- `/api/payments` — Razorpay order creation and payment verification
- `/api/admin` — administrator dashboard

See [backend/README.md](./backend/README.md) for the route list and backend-specific behavior.

## Configuration reference

The backend example environment file documents server, database, authentication, payment, rate-limit, and optional SMTP variables. Frontend configuration is read from `VITE_*` variables; defaults such as the app name and contact details are defined in `frontend/src/config/env.js`.

## Troubleshooting

- **Database connection fails:** confirm MongoDB is running and `MONGO_URI` points to the intended database.
- **Storefront cannot reach the API:** confirm the backend is listening on port `3000` and check `VITE_DEV_SERVER_PROXY_TARGET` / `VITE_BACKEND_URL`.
- **Payment checkout fails:** use matching Razorpay test credentials in the backend environment.
- **Seed reports missing categories:** create the categories referenced by the product dataset before running the seed command.
