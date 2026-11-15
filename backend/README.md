# Lapreh Backend

Simple Express + MongoDB ecommerce API.

## Environment

Copy `.env.example` to `.env` and configure MongoDB, JWT, and Razorpay credentials.
Razorpay orders are created on the server and successful Checkout responses are
verified with an HMAC-SHA256 signature before an order is marked paid.
Set `CLIENT_URL` in Render to the deployed frontend origin
(`https://lapreh.vercel.app`). That production origin is also explicitly
allowlisted in the backend; local development origins remain allowed.

Account verification email can use Resend's HTTPS API by setting `RESEND_API_KEY`
and `MAIL_FROM` in the backend environment. Verify the sender domain with Resend
before using it. This is recommended for Render services because it avoids SMTP
ports. For local development, Nodemailer SMTP remains available with
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` when `RESEND_API_KEY` is
not set. The Resend API path requires Node.js 18 or newer.

API requests are rate limited in memory by client IP. The defaults allow 300
requests per 15 minutes across `/api` and 20 authentication attempts per 15
minutes for login/register. Tune them with `RATE_LIMIT_WINDOW_MS`,
`RATE_LIMIT_MAX_REQUESTS`, `AUTH_RATE_LIMIT_WINDOW_MS`, and
`AUTH_RATE_LIMIT_MAX_REQUESTS`.

## Run

```bash
npm run dev
```

The server binds to `0.0.0.0` by default so it can be reached from another
device on the same local network.

## Main Routes

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/products
POST /api/products

GET  /api/categories
POST /api/categories

GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update/:itemId
DELETE /api/cart/remove/:itemId

POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders

POST /api/payments/create-order
POST /api/payments/verify

GET /api/admin/dashboard
```
