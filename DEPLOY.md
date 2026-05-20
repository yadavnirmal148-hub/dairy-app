# Gokul Fresh — Deploy for real customers

## What works without Razorpay

- **Registration** (OTP saved in MongoDB — survives server restart)
- **UPI QR** checkout (uses your UPI ID in `.env`)
- **Cash on Delivery (COD)**
- **Admin panel** (orders, products, users, delivery locations)
- **Product names** in cart and checkout

**Razorpay** only works after you add valid keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys). Invalid keys are hidden automatically; UPI + COD still work.

---

## 1. MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) or a VPS with MongoDB.

Copy the connection string into `dairy-backend/.env`:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/gokul_fresh
```

---

## 2. Backend (`dairy-backend`)

### `.env` (production)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_atlas_uri
JWT_SECRET=long_random_secret_at_least_32_chars

# Payments
UPI_ID=yournumber@paytm
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_live_secret

# Email OTP (recommended for production)
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SENDER_EMAIL=Gokul Fresh <your@gmail.com>
```

### Run locally

```bash
cd dairy-backend
npm install
npm start
```

### Make yourself admin

```bash
node scripts/makeAdmin.js your@email.com
```

Then **logout and login** again so the JWT includes admin access.

### Seed sample products (optional)

```bash
node scripts/seedProducts.js
```

---

## 3. Frontend (`frontend`)

### `.env`

```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Build

```bash
cd frontend
npm install
npm run build
```

Serve the `build/` folder with **Netlify**, **Vercel**, or **Nginx**.

---

## 4. Typical hosting

| Part     | Suggestion                          |
|----------|-------------------------------------|
| API      | Render, Railway, or a VPS + PM2   |
| Database | MongoDB Atlas                     |
| Website  | Netlify / Vercel (static `build`) |

Point `REACT_APP_API_URL` to your live API (must include `/api`).

Enable **CORS** on the API for your frontend domain if needed (current setup allows all origins).

---

## 5. Before going live checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production` on the server
- [ ] Configure SMTP so OTP emails send (or users cannot register without `devOtp`)
- [ ] Add real **UPI_ID** for QR payments
- [ ] Add valid **Razorpay** keys if you want card/UPI via Razorpay
- [ ] Run `makeAdmin.js` for your account
- [ ] Add products in **Admin → Products**
- [ ] Test: register → login → add to cart → checkout (COD or UPI)

---

## 6. Restart after code changes

```bash
# Terminal 1
cd dairy-backend && npm start

# Terminal 2 (development)
cd frontend && npm start
```

Health check: `GET http://localhost:5000/api/health`
