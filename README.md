
  # Umedh Foundation Charity Platform UI

  This is a code bundle for Umedh Foundation Charity Platform UI. The original project is available at https://www.figma.com/design/UxVO9wdF2X5TlG4BIEvwMr/Umedh-Foundation-Charity-Platform-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Firebase Realtime Database

  This project now includes Firebase Realtime Database wiring for the donations screen.

  1. Copy `.env.example` to `.env.local`.
  2. In Firebase Console, open `Project settings` -> `General` -> `Your apps` -> Web app config.
  3. Paste the config for your current Firebase web app.
  4. Add the exact `VITE_FIREBASE_DATABASE_URL` from `Realtime Database` in Firebase Console.

  If the Realtime Database URL is missing, the app falls back to demo donation data so the UI still runs.

  ## Netlify Deployment

  This project is ready to be deployed on Netlify for free, including the Razorpay test payment flow.

  ### What is included

  - `netlify.toml` for build + SPA redirects
  - Netlify Functions for:
    - `/.netlify/functions/razorpay-order`
    - `/.netlify/functions/razorpay-verify`
  - Redirects from:
    - `/api/razorpay/order`
    - `/api/razorpay/verify`

  ### Deploy steps

  1. Push this project to GitHub.
  2. Log in to Netlify and choose `Add new site` -> `Import an existing project`.
  3. Select your GitHub repo.
  4. Keep these build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
  5. In `Site configuration` -> `Environment variables`, add:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `VITE_DEFAULT_ADMIN_NAME`
     - `VITE_DEFAULT_ADMIN_EMAIL`
     - `VITE_DEFAULT_ADMIN_PASSWORD`
  6. Trigger deploy.

  ### Important

  - Only `VITE_RAZORPAY_KEY_ID` should be exposed to the frontend.
  - `RAZORPAY_KEY_SECRET` must stay only in Netlify environment variables.
  - For production, replace test keys with live Razorpay keys.
  
