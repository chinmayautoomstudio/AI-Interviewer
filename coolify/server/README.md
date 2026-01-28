# Email API for Coolify

This Express server exposes `/api/send-email` with the same contract as the Netlify function `netlify/functions/send-email.js`, so the React app works on Coolify without Netlify Functions.

## Environment variables (set in Coolify)

- `RESEND_API_KEY` or `REACT_APP_RESEND_API_KEY` – Resend API key
- `REACT_APP_FROM_EMAIL` (optional) – e.g. `AI HR Saathi <noreply@aihrsaathi.com>`

## Run locally

```bash
cd coolify/server
npm install
RESEND_API_KEY=re_xxx npm start
```

Listens on port 3001 by default; override with `PORT`.

## Deploy on Coolify

1. Create a new service (Node / custom).
2. Build: leave empty or `npm install`.
3. Start: `npm start`.
4. Set env vars above in Coolify.
5. Expose port 3001 and (if frontend is on same domain) add a reverse-proxy path `/api` → this service, or use a separate subdomain for the API.
