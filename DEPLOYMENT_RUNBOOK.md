# Deployment Runbook

## 1) Configure secrets and endpoint

### Cloud Function secret

For production, keep the key out of source control and set it in Firebase config:

- `firebase functions:config:set paystack.secret_key="sk_live_or_test_key"`

Then deploy functions:

- `firebase deploy --only functions`

For local development, copy `functions/.env.example` to `functions/.env` and set:

- `PAYSTACK_SECRET_KEY=sk_test_or_live_key`

The function code uses Firebase config in production and falls back to `functions/.env` for local testing.

For front-end deployment on Vercel, set the front-end API endpoint as a Vercel environment variable:

- `VOTE_API_URL=https://us-central1-coc-voting-platform.cloudfunctions.net/verifyAndRecordVote`

Vercel will generate `env.js` during build and make `window.VOTE_API_URL` available to the browser.

### Frontend endpoint

Update `VOTE_API_URL` in:

- `firebase-init.js`
- `Admin/firebase-init.js`

to your deployed function URL, e.g.:

`https://us-central1-coc-voting-platform.cloudfunctions.net/verifyAndRecordVote`

## 2) Deploy Firestore rules + functions

From repo root:

1. Install Firebase CLI if needed.
2. Deploy rules:
   - `firebase deploy --only firestore:rules`
3. Deploy functions:
   - `cd functions`
   - `npm install`
   - `cd ..`
   - `firebase deploy --only functions`

## 3) Tailwind production setup (optional but recommended)

From repo root:

- `npm install`
- `npm run build:tailwind`

This generates `dist/tailwind.css` for production usage.

## 4) Recommended production follow-ups

- Replace test Paystack public key with live public key in frontend.
- Keep Paystack secret key only in backend/function env.
- Serve site over HTTPS.
- Run `QA_SMOKE_CHECKLIST.md` before release.
