/**
 * Email API base URL. Use REACT_APP_EMAIL_API_URL when hosting on Coolify (or other non-Netlify)
 * so the app calls your own send-email API instead of Netlify Functions.
 */
export const EMAIL_API_URL =
  process.env.REACT_APP_EMAIL_API_URL || '/.netlify/functions/send-email';
