# Netlify Deployment Guide for Email Functionality

## 🚨 Current Issue
The email functionality is failing in production because:
1. Netlify Functions are not properly configured
2. Environment variables are missing
3. CORS is blocking direct API calls
4. **404 Error**: Function not deployed (most common issue)

## ✅ Solution Steps

### Step 0: Verify Function Deployment (CRITICAL)

1. **Test the function endpoint first:**
   - Visit: `https://ai-interviewer-sys.netlify.app/.netlify/functions/test`
   - You should see: `{"success": true, "message": "Test function is working!"}`
   - If you get 404, the functions are not deployed

2. **If test function fails (404):**
   - Go to Netlify Dashboard → Functions tab
   - Check if any functions are listed
   - If no functions appear, the deployment is not including the functions directory

### Step 1: Set Environment Variables in Netlify

1. **Go to your Netlify Dashboard**
   - Visit: https://app.netlify.com/
   - Select your site: `ai-interviewer-sys`

2. **Navigate to Site Settings**
   - Click on your site
   - Go to "Site settings" → "Environment variables"

3. **Add the following environment variables:**
   ```
   REACT_APP_RESEND_API_KEY=re_8r93pzmD_DWxZjzWhjQqeCi6qLfY4EPAk
   REACT_APP_FROM_EMAIL=noreply@aiinterviewer.com
   REACT_APP_COMPANY_NAME=AI Interviewer
   REACT_APP_COMPANY_WEBSITE=https://aiinterviewer.com
   REACT_APP_SUPPORT_EMAIL=support@aiinterviewer.com
   ```

4. **Save the environment variables**

### Step 2: Redeploy Your Site

1. **Trigger a new deployment:**
   - Go to "Deploys" tab in Netlify
   - Click "Trigger deploy" → "Deploy site"
   - Or push a new commit to trigger automatic deployment

### Step 3: Verify Function Deployment

1. **Check if the function is deployed:**
   - Visit: `https://ai-interviewer-sys.netlify.app/.netlify/functions/send-email`
   - You should see a "Method not allowed" error (this is expected for GET requests)

2. **Test the function with a POST request:**
   ```bash
   curl -X POST https://ai-interviewer-sys.netlify.app/.netlify/functions/send-email \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","subject":"Test","html":"<p>Test email</p>"}'
   ```

### Step 4: Alternative Solution (If Functions Still Don't Work)

If Netlify Functions continue to fail, we can implement a serverless solution using Netlify's built-in form handling or switch to a different email service.

## 🔧 Troubleshooting

### 404 Error - Function Not Found (MOST COMMON)

**Symptoms:**
- `POST https://ai-interviewer-sys.netlify.app/.netlify/functions/send-email 404 (Not Found)`
- Test function also returns 404

**Solutions:**

1. **Check Functions Tab:**
   - Go to Netlify Dashboard → Functions tab
   - If no functions are listed, the functions directory is not being deployed

2. **Force Redeploy:**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Clear cache and deploy site"
   - This forces a complete rebuild

3. **Check Build Logs:**
   - Go to Deploys tab → Click on latest deploy
   - Look for "Functions" section in build logs
   - Should show: "Functions directory: netlify/functions"

4. **Verify Directory Structure:**
   - Ensure `netlify/functions/` directory exists in your repo
   - Ensure `netlify.toml` has correct functions configuration

5. **Alternative: Manual Function Upload:**
   - If automatic deployment fails, you can manually upload functions
   - Go to Functions tab → "Add function" → Upload the function files

### Check Function Logs
1. Go to Netlify Dashboard → Functions tab
2. Click on `send-email` function
3. Check the logs for any errors

### Common Issues:
- **404 Error**: Function not deployed → Force redeploy with cache clear
- **500 Error**: Environment variables missing → Add env vars and redeploy
- **CORS Error**: Function not responding → Check function logs

## 📧 Email Service Status

The email service is configured to:
- ✅ Use Resend API
- ✅ Send professional interview invitation emails
- ✅ Include interview links and credentials
- ✅ Handle errors gracefully

## 🚀 Next Steps

1. **Set environment variables** in Netlify dashboard
2. **Redeploy** your site
3. **Test** the email functionality
4. **Check function logs** if issues persist

## 📞 Support

If you continue to have issues:
1. Check Netlify function logs
2. Verify environment variables are set
3. Test the function endpoint directly
4. Consider using Netlify Forms as an alternative
