# 🚀 AWS Credentials Quick Setup

## Quick 5-Minute Setup

### 1. Create AWS Account
- Go to: https://aws.amazon.com/
- Click "Create an AWS Account"
- Use your email and create password
- Add payment info (required even for free tier)

### 2. Get Credentials
1. **Sign in** to AWS Console
2. **Search "IAM"** in top search bar
3. **Click "Users"** → "Create user"
4. **User name**: `ai-interviewer`
5. **Access type**: ✅ Programmatic access
6. **Permissions**: Search "Transcribe" → ✅ AmazonTranscribeFullAccess
7. **Create user**
8. **Copy credentials** (you only see secret key once!)

### 3. Configure Project
```bash
# Run setup script
node setup-amazon-transcribe.js

# Enter your credentials when prompted
# Access Key ID: AKIA...
# Secret Access Key: ...
# Region: us-east-1
```

### 4. Test It
```bash
# Restart your dev server
npm run dev

# Test voice input in your AI Interviewer
# Should now use Amazon Transcribe!
```

## 💰 Cost
- **Free**: 60 minutes/month for first year
- **After free tier**: ~$2/hour
- **Perfect for testing** and small projects

## 🔒 Security
- Never commit `.env` file to Git
- Add `.env` to `.gitignore`
- Rotate keys every 90 days

## ❓ Need Help?
- Check browser console for errors
- Verify microphone permissions
- Test with text input first
- See full guide: `AWS_CREDENTIALS_SETUP.md`
