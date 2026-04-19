# Help Inspire · Bhopal

A full-featured donation campaign platform with Cashfree payment integration, built for Inspire HELP Bhopal.

## Features

### Public
- Multi-campaign homepage with progress bars and donor counts
- Campaign detail page with image slideshow
- Dynamic quick donation amounts based on campaign target (spiritual amounts ending in 1)
- Cashfree payment gateway with UPI, cards, netbanking, wallets
- UPI/QR fallback mode when Cashfree is unavailable
- Anonymous donation option
- Top donors display (aggregated, deduplicated)
- Recent donations ticker (active campaigns only)
- Total raised stats banner
- WhatsApp share with customizable message per campaign
- Copy link to clipboard
- Email donation receipt (Gmail SMTP)
- 80G tax receipt form link (configurable)
- Thank you page after successful payment
- "Find Nearby Centre" link to ISKCON directory
- Rotating Srila Prabhupada quotes in footer
- Mobile responsive design
- Broken image fallback
- Campaign not found page
- Toast notifications

### Admin Panel (`/admin`)
- Password-protected access
- Create, edit, hide, delete campaigns
- Multi-image upload (Cloudinary) with cover image
- Custom WhatsApp share message per campaign
- Download donors as CSV (with name, email, amount, payment ID, date)
- Payment mode toggle (Cashfree / UPI-QR)
- UPI settings (UPI ID, QR code image, WhatsApp number)
- 80G tax receipt form URL (configurable)
- Record offline/cash donations manually
- Analytics dashboard:
  - Total collected and donation count
  - Daily donation trend (last 30 days)
  - Top campaigns by collection
  - Top donors with campaign filter
- Donor tier system (Platinum/Gold/Silver/Bronze) with:
  - Auto-classification by total donation amount
  - Editable perks per tier
  - Tier summary counts

### Security
- Helmet security headers
- CORS locked to frontend domain
- Rate limiting (3 orders/min, 15 verifications/15min)
- All admin endpoints password-protected
- Input sanitization (XSS, length, type)
- Atomic payment verification (no double-counting)
- Amount mismatch detection
- Order ID sanitization
- Generic error messages (no internal details exposed)
- No sensitive data in logs
- `.env` in `.gitignore`

## Tech Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- MongoDB Atlas + Mongoose
- Cashfree Payments
- Cloudinary (image upload)
- Gmail SMTP (email receipts)

## Local Development

### Backend

```bash
cd backend
npm install
# Create .env file with variables listed below
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Create .env file with variables listed below
npm run dev
```

Open http://localhost:5173

Admin panel: http://localhost:5173/admin

## Environment Variables

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `CASHFREE_APP_ID` | Yes | Cashfree App ID |
| `CASHFREE_SECRET_KEY` | Yes | Cashfree Secret Key |
| `CASHFREE_ENV` | Yes | `sandbox` for test, `production` for live |
| `ADMIN_PASSWORD` | Yes | Admin panel password (change from default!) |
| `FRONTEND_URL` | Yes | Frontend URL for CORS, e.g. `https://help-inspire.vercel.app` (no trailing slash, comma-separate multiple) |
| `EMAIL_USER` | No | Gmail address for sending donation receipts |
| `EMAIL_PASS` | No | Gmail App Password (not regular password) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key (numeric) |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CASHFREE_ENV` | Yes | `sandbox` for test, `production` for live |
| `VITE_API_URL` | Yes | Backend API URL, e.g. `https://help-inspire.onrender.com/api` |

## Deployment

### Backend → Render

1. Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all backend env vars in Environment tab
6. Deploy

### Frontend → Vercel

1. Import from GitHub
2. Root Directory: `frontend`
3. Framework Preset: Vite
4. Add frontend env vars
5. Deploy
6. Whitelist your Vercel domain on Cashfree dashboard (Developers → Whitelisting)

### Post-Deployment Checklist

- [ ] Change `ADMIN_PASSWORD` to something strong
- [ ] Set `FRONTEND_URL` to your Vercel domain (no trailing slash)
- [ ] Set `VITE_API_URL` to your Render URL + `/api`
- [ ] Switch Cashfree to production keys when ready
- [ ] Whitelist domain on Cashfree (both sandbox and production)
- [ ] Tighten MongoDB Atlas IP allowlist
- [ ] Set up Gmail App Password for email receipts
- [ ] Upload QR code to Cloudinary for UPI mode
- [ ] Configure 80G form URL in admin settings
- [ ] Redeploy Vercel after env changes

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/campaigns | List visible campaigns with donor counts |
| GET | /api/campaign/:id | Get campaign details |
| GET | /api/donors/:campaignId | Top donors (aggregated by name) |
| GET | /api/recent-donations | Last 10 donations from active campaigns |
| GET | /api/stats | Total raised + donor count |
| GET | /api/settings/payment-mode | Payment mode, UPI details, 80G URL |
| POST | /api/create-order | Create Cashfree order |
| POST | /api/verify-payment | Verify Cashfree payment |
| POST | /api/record-upi-donation | Record UPI/QR donation |

### Admin (requires `x-admin-password` header or `adminPassword` in body)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/campaigns | All campaigns including hidden |
| GET | /api/admin/donors/:id | All donors for CSV export |
| GET | /api/admin/analytics | Dashboard analytics |
| GET | /api/admin/tier-perks | Get tier perks |
| POST | /api/campaign | Create campaign |
| PUT | /api/campaign/:id | Edit campaign |
| PATCH | /api/campaign/:id/toggle-hide | Show/hide campaign |
| DELETE | /api/campaign/:id | Delete campaign |
| POST | /api/admin/upload | Upload image to Cloudinary |
| POST | /api/admin/settings/payment-mode | Update payment/UPI/80G settings |
| POST | /api/admin/tier-perks | Update tier perks |
| POST | /api/admin/manual-donation | Record offline donation |

## Donor Tiers

| Tier | Badge | Minimum Amount |
|------|-------|---------------|
| Platinum | 🏆 | ₹1,00,001+ |
| Gold | 🥇 | ₹51,001+ |
| Silver | 🥈 | ₹21,001+ |
| Bronze | 🥉 | ₹5,001+ |
