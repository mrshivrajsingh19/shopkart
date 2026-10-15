# ShopKart

ShopKart is a full-stack shopping application with a React frontend, an Express
API, MongoDB persistence, customer authentication, product browsing, a
wishlist, a shopping cart, and Razorpay checkout.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- Razorpay test credentials for payment checkout

## Setup

1. Clone the repository and open its root directory.
2. Install backend dependencies:

   ```sh
   cd backend
   npm ci
   ```

3. Create `backend/.env` by copying `backend/.env.example`. Fill in the
   database URI and a strong, private JWT secret. Add Razorpay test credentials
   to use checkout. Never commit `.env` or put real credentials in the example
   file.
4. In a second terminal, install frontend dependencies:

   ```sh
   cd frontend
   npm ci
   ```

## Run locally

Start the API in one terminal:

```sh
cd backend
npm run dev
```

Start the frontend in another:

```sh
cd frontend
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). Vite
proxies API requests to the backend on port `5001`. The API connects to MongoDB
before it begins listening; check the backend terminal for connection errors.

## Environment variables

Set these in the ignored `backend/.env` file:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Private signing secret for authentication tokens |
| `PORT` | API port (defaults to `5001`) |
| `NODE_ENV` | Runtime environment, such as `development` |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Private Razorpay API key secret |

## Validation

Run the frontend production build and linter:

```sh
cd frontend
npm run build
npm run lint
```

## Main routes

- `/login`, `/register` — customer account access
- `/home`, `/products`, `/products/:id` — home and product catalog
- `/wishlist`, `/cart`, `/checkout` — shopping flow
- `/orders`, `/orders/:id` — order history and details

The Express API is served at `/` and exposes customer, product, wishlist, cart,
and order routes. For local development, the frontend's Vite configuration
proxies these requests to the API.
