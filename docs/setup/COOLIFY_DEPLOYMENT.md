# Coolify Deployment Guide

This guide covers deploying AI HR Saathi on Coolify, including DNS, SPA routing, and the email API.

## 1. DNS (fix "This site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN)

If `aihrsaathi.com` does not resolve, the domain’s **nameservers** must point to the same place where you added the Coolify A record.

### Check nameservers

- **PowerShell:** `nslookup -type=NS aihrsaathi.com`
- **Online:** [whatsmydns.net – NS for aihrsaathi.com](https://www.whatsmydns.net/#NS/aihrsaathi.com)

If NS still point to Netlify (or another host), either:

- **Option A:** At your **domain registrar**, set nameservers to the DNS host where you added the Coolify A record (e.g. registrar default DNS or Cloudflare), or  
- **Option B:** Add the Coolify A record in the DNS that is currently authoritative (e.g. Netlify DNS) so that `@` (and optionally `www`) point to your Coolify server IP.

### Required DNS records

- **A** for `@` (or `aihrsaathi.com`) → Coolify server IP  
- **A** or **CNAME** for `www` → same server or `@` (optional)

Allow up to 24–48 hours for propagation; recheck with `nslookup aihrsaathi.com` or whatsmydns.net.

---

## 2. Coolify: serve the built SPA

- **Build:** Use the React build output (e.g. `npm run build` → `build/`).  
- **Publish directory:** Point Coolify’s static / web root to `build` (or the folder that contains `index.html` and static assets).

### SPA routing (client-side routes)

The app uses React Router. All paths (e.g. `/login`, `/candidate/exam/...`) must serve `index.html` so the client can route.

- If Coolify uses **Nginx**, use the config in [coolify/nginx.conf](../../coolify/nginx.conf):  
  `try_files $uri $uri/ /index.html;`
- If Coolify has an **SPA** or **History fallback** option, enable it so non-file requests return `index.html`.

---

## 3. Email API (Coolify backend)

Netlify Functions (e.g. `/.netlify/functions/send-email`) do not run on Coolify. Use the provided Node API so email keeps working.

### Deploy the email API

1. In Coolify, create a **second service** (Node / custom).
2. **Source:** Use the same repo; set **root** or **start path** to `coolify/server` (or the folder containing `server.js` and `package.json`).
3. **Build:** `npm install` (or leave empty if Coolify runs it).
4. **Start:** `npm start` (runs `node server.js`; listens on `PORT` or default 3001).
5. **Environment variables** (in Coolify):
   - `RESEND_API_KEY` or `REACT_APP_RESEND_API_KEY` – Resend API key  
   - `REACT_APP_FROM_EMAIL` (optional) – e.g. `AI HR Saathi <noreply@aihrsaathi.com>`
6. Expose the service (e.g. port 3001) and set up the **reverse proxy** so that your main domain (or subdomain) serves `/api` at this service (e.g. `https://aihrsaathi.com/api/*` → email API).

### Frontend: use the Coolify email API

When the site is hosted on Coolify, the frontend must call your API instead of Netlify:

- In the **main (React) app** env in Coolify, set:  
  `REACT_APP_EMAIL_API_URL=/api/send-email`  
  (or the full URL to your email API if it is on another origin).
- Rebuild and deploy the React app so the new env is baked in.

The app uses this in [src/config/emailConfig.ts](../../src/config/emailConfig.ts): if `REACT_APP_EMAIL_API_URL` is set, it is used; otherwise it falls back to `/.netlify/functions/send-email`.

---

## 4. Summary checklist

| Item | Action |
|------|--------|
| DNS authoritative | Run `nslookup -type=NS aihrsaathi.com`; nameservers must match where you manage DNS. |
| A record | `@` (and optionally `www`) → Coolify server IP. |
| Propagation | Check with whatsmydns.net or nslookup; wait up to 24–48 h if needed. |
| Coolify static app | Serve `build/`; use [coolify/nginx.conf](../../coolify/nginx.conf) or SPA fallback so all routes serve `index.html`. |
| Email API | Deploy `coolify/server` as a separate service; proxy `/api` to it; set `RESEND_API_KEY` (or `REACT_APP_RESEND_API_KEY`) and optional `REACT_APP_FROM_EMAIL`. |
| Frontend env | Set `REACT_APP_EMAIL_API_URL=/api/send-email` for the React app on Coolify. |
