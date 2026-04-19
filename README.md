# Help Inspire MANIT Bhopal

A donation campaign web app with Cashfree payment integration built for Inspire MANIT Bhopal.

## Tech Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- MongoDB Atlas + Mongoose
- Razorpay Payments
- Cloudinary (image upload)
- Resend / Gmail SMTP (email receipts)

## Local Development

### 1. Backend

```bash
cd backend
npm install
# Create .env file with variables listed below
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
# Create .env file with variables listed below
npm run dev
```

Open http://localhost:5173

### 3. Admin Panel

Go to http://localhost:5173/admin

## Environment Variables

### Backend (`backend/.env` or Render Environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `RAZORPAY_KEY_ID` | Yes | Razorpay Key ID (`rzp_test_` for test, `rzp_live_` for production) |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay Key Secret |
| `ADMIN_PASSWORD` | Yes | Password for admin panel access |
| `FRONTEND_URL` | No | Comma-separated allowed origins for CORS (e.g. `https://iskconujjain.com,https://www.iskconujjain.com`). Defaults to `*` |
| `EMAIL_USER` | No | Gmail address for SMTP email receipts |
| `EMAIL_PASS` | No | Gmail App Password for SMTP |
| `RESEND_API_KEY` | No | Resend API key (fallback if SMTP unavailable) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

### Frontend (`frontend/.env` or Vercel Environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_RAZORPAY_KEY_ID` | Yes | Razorpay Key ID (same as backend) |
| `VITE_API_URL` | No | Backend API URL. Leave empty for local dev (Vite proxy handles it). For production: `https://your-backend.onrender.com/api` |

## Deployment

### Backend → Render (free)

1. Push `backend/` to GitHub
2. Render → New Web Service → connect repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add all backend env vars in Environment tab

### Frontend → Vercel (free)

1. Push `frontend/` to GitHub
2. Vercel → Import Project → connect repo
3. Root Directory: `frontend`
4. Framework Preset: Vite
5. Add frontend env vars in Environment Variables
6. Set `VITE_API_URL` to your Render backend URL + `/api`

### Post-Deployment Checklist

- [ ] Change `ADMIN_PASSWORD` from `admin123` to something strong
- [ ] Switch Razorpay from test keys to live keys
- [ ] Set `FRONTEND_URL` in backend to your actual domain(s)
- [ ] Tighten MongoDB Atlas IP allowlist to Render server IP
- [ ] Verify domain on Resend for branded emails
- [ ] Connect custom domain on Vercel

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/campaigns | Public | List visible campaigns |
| GET | /api/campaign/:id | Public | Get campaign details |
| GET | /api/donors/:campaignId | Public | Top donors (aggregated) |
| GET | /api/recent-donations | Public | Last 10 donations |
| GET | /api/stats | Public | Total raised + donor count |
| POST | /api/create-order | Public | Create Razorpay order |
| POST | /api/verify-payment | Public | Verify payment + update |
| POST | /api/campaign | Admin | Create campaign |
| PATCH | /api/campaign/:id/toggle-hide | Admin | Show/hide campaign |
| DELETE | /api/campaign/:id | Admin | Delete campaign |
| GET | /api/admin/campaigns | Admin | All campaigns (inc. hidden) |
| GET | /api/admin/donors/:id | Admin | All donors for export |
| GET | /api/admin/analytics | Admin | Dashboard analytics |
| POST | /api/admin/upload | Admin | Upload image to Cloudinary |
