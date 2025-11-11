# Debugging Netlify Redirects - Static Asset Issue

## Current Configuration

The `netlify.toml` file now has debugging headers added to each redirect rule:
- `X-Debug-Redirect: static-asset` - For `/static/*` paths
- `X-Debug-Redirect: manifest` - For `/manifest.json`
- `X-Debug-Redirect: spa-catch-all` - For all other routes (catch-all)

## How to Debug

### 1. Open Browser Developer Tools
1. Navigate to your exam link: `https://your-site.netlify.app/candidate/exam/{token}`
2. Open Developer Tools (F12)
3. Go to the **Network** tab
4. Clear the network log
5. Refresh the page

### 2. Check Each Request

Look for these requests and check their response headers:

#### A. Check `/static/js/main.xxx.js`
- **Expected**: Should return JavaScript content with header `X-Debug-Redirect: static-asset`
- **If wrong**: If you see `X-Debug-Redirect: spa-catch-all`, the catch-all is catching it
- **Response**: Should be JavaScript, NOT HTML

#### B. Check `/static/css/main.xxx.css`
- **Expected**: Should return CSS content with header `X-Debug-Redirect: static-asset`
- **If wrong**: If you see `X-Debug-Redirect: spa-catch-all`, the catch-all is catching it
- **Response**: Should be CSS, NOT HTML

#### C. Check `/manifest.json`
- **Expected**: Should return JSON content with header `X-Debug-Redirect: manifest`
- **If wrong**: If you see `X-Debug-Redirect: spa-catch-all`, the catch-all is catching it
- **Response**: Should be JSON, NOT HTML

### 3. What to Look For

#### ✅ Correct Behavior
- Static assets return their actual content (JS/CSS/JSON)
- Response headers show the correct `X-Debug-Redirect` value
- Status code is 200
- Content-Type matches the file type

#### ❌ Problem Behavior
- Static assets return HTML (index.html content)
- Response headers show `X-Debug-Redirect: spa-catch-all` for static files
- Content-Type is `text/html` instead of `application/javascript`, `text/css`, or `application/json`

### 4. Document Your Findings

When checking the network tab, note:
1. Which requests are failing (JS, CSS, or manifest.json)
2. What `X-Debug-Redirect` header value they have
3. What Content-Type is returned
4. What the actual response content is (first few characters)

### 5. Expected Static Files

Based on the build directory, these files should exist:
- `/static/js/main.f9c0e26a.js`
- `/static/css/main.4144a514.css`
- `/manifest.json`

## Next Steps

After documenting your findings:
1. If static assets show `X-Debug-Redirect: spa-catch-all`, the explicit rules aren't working
2. If static assets show the correct debug header but still return HTML, there's a different issue
3. Share the findings to adjust the fix accordingly

