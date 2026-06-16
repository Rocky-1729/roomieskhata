# 🏡 Roomies Khata — Track. Split. Settle.

**Roomies Khata** is a production-ready, mobile-first full-stack web application designed for roommates, shared apartments, hostel students, and PG residents to manage shared expenses without the drama. 

It makes tracking rent, utilities (WiFi, electricity, gas, water), and detailed groceries (chicken, eggs, vegetables, milk) simple, transparent, and instant.

---

## ⚡ Key Features

*   **🔒 Secure Authentication:** Sign up/log in using standard email and password or instantly using **Google Sign-in**.
*   **🏢 Room Ledger Hubs:** Create a room to generate a unique 8-character invite code, or join an existing roommate group instantly.
*   **💸 Smart Expense Logging:** Add expenses with customizable splits. Category-specific icons make it easy to spot rent, utility bills, or grocery runs.
*   **📸 Receipt Uploads:** Attach images of bills, grocery receipts, or payment screenshots directly to expenses using **Cloudinary** (with a local server fallback).
*   **📊 Interactive Room Analytics:** Beautiful Pie Charts (category distribution) and Bar Charts (roommate contribution ratios) powered by **Recharts**.
*   **🤖 Debt Simplification Engine:** Cash-flow minimization algorithm that calculates the absolute minimum number of transfers required to settle the flat.
*   **🔌 Real-Time Socket Sync:** Powered by **Socket.io**. When any roommate logs an expense or settlement, balances and timeline feeds sync instantly across all screens.
*   **📲 Scan-to-Pay UPI QR Codes:** Auto-generates scannable UPI Payment QR codes inside the settlement panel for fast mobile payments.

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Zustand (state management), React Query (caching), React Router, Recharts, Socket.io-client
*   **Backend:** Node.js, Express, Socket.io
*   **Database:** MongoDB & Mongoose
*   **Cloud Storage:** Cloudinary

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have Node.js and MongoDB installed on your computer.

### 2. Installation
Clone this repository to your local system. Run this command in the root folder to install dependencies for the root, backend, and frontend concurrently:

```bash
npm run install-all
```
*(If running on React 19 peer-dependency warnings, use: `npm install && npm install --prefix backend && npm install --prefix frontend --legacy-peer-deps`)*

### 3. Environment Configuration

Create a `.env` file in your `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roomies-khata
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name     # Optional local fallback
CLOUDINARY_API_KEY=your_cloudinary_key           # Optional local fallback
CLOUDINARY_API_SECRET=your_cloudinary_secret     # Optional local fallback
GOOGLE_CLIENT_ID=your_google_oauth_client_id     # Optional dev mock fallback
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in your `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id  # Optional dev mock fallback
```

### 4. Running Locally
Run this command in the root folder to start both the Express backend and the Vite frontend concurrently:

```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to interact with your application!

---

## 🌐 Production Deployment

### Backend (Render)
1.  Create a **Web Service** on Render connected to your Git repository.
2.  Set Build Command: `npm install --prefix backend`
3.  Set Start Command: `npm start --prefix backend`
4.  Configure your environment variables (`MONGODB_URI` from MongoDB Atlas, `JWT_SECRET`, `CLOUDINARY_*`, `GOOGLE_CLIENT_ID`, and `FRONTEND_URL` pointing to your live frontend).

### Frontend (Vercel / Netlify)
1.  Import your repository onto Vercel or Netlify.
2.  Set Build settings:
    *   **Base Directory:** `frontend`
    *   **Build Command:** `npm run build`
    *   **Publish Directory:** `frontend/dist`
3.  Add environment variables:
    *   `VITE_API_URL` = `https://<your-backend-url>/api/v1`
    *   `VITE_SOCKET_URL` = `https://<your-backend-url>`
    *   `VITE_GOOGLE_CLIENT_ID` = `your_google_oauth_client_id`
4.  *(Vercel handles SPA routing automatically. For Netlify, add a `_redirects` file to `frontend/public/` containing `/* /index.html 200` to support React Router refreshes).*