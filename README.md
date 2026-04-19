# Help Inspire MANIT Bhopal

A donation campaign web app with Cashfree payment integration built for Inspire MANIT Bhopal.

## Tech Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- MongoDB Atlas + Mongoose
- Cashfree Payments
- Cloudinary (image upload)
- Gmail SMTP (email receipts)

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
| `CASHFREE_APP_ID` | Yes | Cashfree App ID |
| `CASHFREE_SECRET_KEY` | Yes | Cashfree Secret Key |
| `CASHFREE_ENV` | Yes | `sandbox` for test, `production` for live |
| `ADMIN_PASSWORD` | Yes | Password for admin panel access |
| `FRONTEND_URL` | No | Comma-separated allowed origins for CORS. Defaults to `*` |
| `EMAIL_USER` | No | Gmail address for SMTP email receipts |
| `EMAIL_PASS` | No | Gmail App Password for SMTP |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

### Frontend (`frontend/.env` or Vercel Environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CASHFREE_ENV` | Yes | `sandbox` for test, `production` for live |
| `VITE_API_URL` | No | Backend API URL. Leave empty for local dev. For production: `https://your-backend.onrender.com/api` |

## Deployment

### Backend → Render

1. Push to GitHub
2. Render → New Web Service → connect repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add all backend env vars

### Frontend → Vercel

1. Import project from GitHub
2. Root Directory: `frontend`
3. Framework Preset: Vite
4. Add frontend env vars
5. Whitelist your Vercel domain on Cashfree dashboard

### Post-Deployment Checklist

- [ ] Change `ADMIN_PASSWORD` to something strong
- [ ] Switch Cashfree to production keys
- [ ] Set `FRONTEND_URL` to your actual domain(s)
- [ ] Tighten MongoDB Atlas IP allowlist
- [ ] Whitelist domain on Cashfree dashboard

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/campaigns | Public | List visible campaigns |
| GET | /api/campaign/:id | Public | Get campaign details |
| GET | /api/donors/:campaignId | Public | Top donors (aggregated) |
| GET | /api/recent-donations | Public | Last 10 donations |
| GET | /api/stats | Public | Total raised + donor count |
| POST | /api/create-order | Public | Create Cashfree order |
| POST | /api/verify-payment | Public | Verify payment + update |
| POST | /api/campaign | Admin | Create campaign |
| PUT | /api/campaign/:id | Admin | Edit campaign |
| PATCH | /api/campaign/:id/toggle-hide | Admin | Show/hide campaign |
| DELETE | /api/campaign/:id | Admin | Delete campaign |
| GET | /api/admin/campaigns | Admin | All campaigns (inc. hidden) |
| GET | /api/admin/donors/:id | Admin | All donors for export |
| GET | /api/admin/analytics | Admin | Dashboard analytics |
| POST | /api/admin/upload | Admin | Upload image to Cloudinary |
