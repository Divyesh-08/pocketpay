# PocketPay

PocketPay is a mobile first virtual payment demonstration. It uses an internal MongoDB wallet ledger and does not connect to banks, UPI, or payment providers. Balances are demo credits with no cash value.

## Requirements

- Node.js 20+
- MongoDB 6+ running locally or a MongoDB replica set (transactions require replica set support; MongoDB Atlas is suitable)

## Start locally

1. Copy `server/.env.example` to `server/.env` and set a private `JWT_SECRET`. Set `MONGODB_URI` to a running Mongo database. For local transaction support, configure MongoDB as a single node replica set (for example, set `replication.replSetName: rs0` in `mongod.cfg`, restart MongoDB, and run `mongosh --eval "rs.initiate()"`).
2. Install dependencies at the repo root: `npm install`. If npm has trouble resolving workspaces, use `npm install --prefix client` and `npm install --prefix server`.
3. Run both apps with `npm run dev`.
4. Open `http://localhost:5173`. The API health endpoint is `http://localhost:4000/api/health`.
5. Register accounts in separate browser sessions to try transfers. Each new account receives 2,500 demo credits. Use the admin bootstrapping notes below to access the dashboard.

For a quick local demo without installing MongoDB, set `MONGODB_URI=memory` in `server/.env`. The API downloads and starts a temporary MongoDB server the first time. Demo data is erased when the API stops; use a normal MongoDB replica set for data that must persist.

## Open the app on a phone

The interface is responsive and works in a mobile browser. To run it on a phone over your local Wi-Fi:

1. Connect your computer and phone to the same Wi-Fi network and allow Node.js through the computer's firewall on private networks.
2. Run `npm run dev:mobile` in the project folder. It starts the API and the phone accessible HTTPS web server together. API requests are proxied through HTTPS.
3. Find your computer's LAN IPv4 address with `ipconfig` (look for `IPv4 Address` on the active Wi-Fi adapter).
4. On the phone, open `https://<computer-ip>:5173` (replace the placeholder with that address). Accept the local development certificate warning if shown. Camera access needs HTTPS; a certificate warning can vary by browser/device. The development certificate includes the current LAN IP `<LAN-IP>`; if your computer gets a different IP, update `domains` in `client/vite.config.ts` and restart the command.

If the page loads but cannot contact the API, allow inbound Node.js connections for private networks in Windows Firewall. API requests use the same hostname as the page on port 4000.

## Shared cloud API

Phone-to-phone transfers require the API and a persistent MongoDB replica set to be hosted online. The API must stay on the server; it is not embedded in the APK.

1. Create a MongoDB Atlas cluster and database user. Add the cloud API host to the Atlas network access list. For a free Render service without static outbound IPs, Atlas may require a broad network entry; use a unique database password with only the needed database privileges.
2. Deploy this project to Render using `render.yaml`. Set `MONGODB_URI` to the Atlas connection string in the Render dashboard. Render generates `JWT_SECRET`; `CLIENT_ORIGIN` already allows the native app origins. The API health check is `/api/health`.
3. Render's free API service spins down after 15 minutes idle and typically takes about a minute to start. Upgrade it to `0.5c-512mb` for always-on service (currently $7/month). Atlas M0 is currently free with 512 MB storage; free clusters have limits and do not include backups by default.
4. Install/configure Android SDK and Java. Put the deployed API URL in `client/.env.production.local` as `VITE_API_URL=https://<service>.onrender.com/api`, then run `npm run android:apk --prefix client`.
5. Or use `powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1 -ApiUrl https://<service>.onrender.com/api`. It builds a debug APK and copies it to `outputs/PocketPay.apk`.
6. Install the new APK on all phones. Register/log into accounts on each phone; balances and transactions are shared through the hosted API. The offline demo APK does not sync.

The Android wrapper is in `client/android`. It has the GPay-inspired PocketPay screens and uses the same authenticated API as the web app. Credits are still virtual, with no cash value and no bank/UPI integration. Copy the resulting debug APK to each phone and allow sideloading if Android prompts. The debug APK is for demonstration, not a Play Store release.

## Create the first admin

Registration deliberately creates a regular member account. Promote the first account directly in the database, for example in `mongosh`:

```js
use pocketpay
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Sign out and sign back in after promotion so the JWT includes the admin role. Visit `/admin` to create demo users, assign credits, set spending limits, pause accounts, and review activity. Admin credit assignment is an administrative adjustment; normal user to user payments create a transaction plus balanced debit and credit ledger entries in one database transaction.

## What is included

- React, Vite, TypeScript, responsive UI, Framer Motion and Lucide icons.
- Express and TypeScript REST API, Mongoose models, bcrypt password hashing, JWT authentication.
- Virtual wallets, spending limits, atomic transfers, idempotency keys, transaction history and receipts.
- Personal versioned PocketPay QR generation; camera and gallery QR scanning with recipient validation.
- Admin and guardian tools, profile editing, dark mode, and demo rewards screen.

## API routes

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`
- Wallet: `GET /api/wallet`, `GET /api/wallet/balance`, `GET /api/wallet/transactions`
- Payments: `POST /api/payments/transfer`, `GET /api/payments/history`, `GET /api/payments/:transactionId`
- QR: `GET /api/qr/:userId`, `POST /api/qr/validate`
- Users: `GET /api/users/search`, `GET /api/users/:userId`
- Admin: `GET /api/admin/overview`, `POST /api/admin/credits`, `POST /api/admin/demo-user`, `PATCH /api/admin/users/:userId`

## Production notes

Set strong secrets, restrict CORS, use HTTPS, add rate limiting and monitoring, configure MongoDB replica set backups, and review privacy, child-safety, and account recovery requirements before any real deployment. Password reset is not enabled because a secure email delivery and recovery process has not been configured. There is no withdrawal or real money conversion.

