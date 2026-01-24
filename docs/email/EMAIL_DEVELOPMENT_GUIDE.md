# Email Development Guide

## 🚀 How to Run the Application

### Option 1: With Netlify Functions (Recommended)
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run with Netlify Functions (includes email functionality)
netlify dev
```
- **URL**: http://localhost:8888
- **Email**: Works via Netlify Functions (no CORS issues)
- **Best for**: Full functionality testing

### Option 2: Regular React Development Server
```bash
# Regular React development server
npm start
```
- **URL**: http://localhost:3000
- **Email**: Works via direct API call (fallback)
- **Best for**: Frontend development only

## 🔧 Email Configuration

### Environment Variables Required
Make sure your `.env` file contains:
```bash
REACT_APP_RESEND_API_KEY=re_8r93pzmD_DWxZjzWhjQqeCi6qLfY4EPAk
REACT_APP_FROM_EMAIL=noreply@aiinterviewer.com
REACT_APP_COMPANY_NAME=AI Interviewer
REACT_APP_COMPANY_WEBSITE=https://aiinterviewer.com
REACT_APP_SUPPORT_EMAIL=support@aiinterviewer.com
```

### How Email Sending Works

1. **Primary Method**: Netlify Function (`/.netlify/functions/send-email`)
   - Used when running `netlify dev`
   - No CORS issues
   - API key handled on server

2. **Fallback Method**: Direct API call
   - Used when Netlify Function is not available
   - Used when running `npm start`
   - May have CORS issues in some browsers

## 🐛 Troubleshooting

### Error: "404 Not Found" for Netlify Function
- **Cause**: Running `npm start` instead of `netlify dev`
- **Solution**: Use `netlify dev` for full functionality

### Error: "CORS Missing Allow Origin"
- **Cause**: Direct API call blocked by browser
- **Solution**: Use `netlify dev` or deploy to Netlify

### Error: "Resend API key not configured"
- **Cause**: Environment variables not loaded
- **Solution**: Restart development server after adding/changing `.env` file

## 📋 Testing Email Functionality

1. **Start the application** with `netlify dev`
2. **Go to Interview Management** page
3. **Schedule a new interview**
4. **Check browser console** for email sending logs
5. **Check candidate's email** for the interview invitation

## 🚀 Production Deployment

When deployed to Netlify:
- Netlify Functions are automatically available
- Environment variables are set in Netlify dashboard
- Email functionality works without CORS issues
- No additional configuration needed
