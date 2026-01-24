# AWS Credentials Setup Guide for Amazon Transcribe

This guide will help you set up AWS credentials to use Amazon Transcribe for Speech-to-Text in your AI Interviewer.

## 📋 Prerequisites

- An AWS account (free tier available)
- Basic understanding of AWS services
- 10-15 minutes to complete setup

## 🚀 Step-by-Step Setup

### Step 1: Create AWS Account

1. **Go to AWS Console**: https://aws.amazon.com/
2. **Click "Create an AWS Account"**
3. **Fill in your details**:
   - Email address
   - Password
   - AWS account name
4. **Choose account type**: Personal
5. **Enter payment information** (required even for free tier)
6. **Verify your phone number**
7. **Choose support plan**: Basic (free)

### Step 2: Access AWS Console

1. **Sign in** to AWS Console: https://console.aws.amazon.com/
2. **Navigate to IAM** (Identity and Access Management):
   - Search "IAM" in the top search bar
   - Click on "IAM" service

### Step 3: Create IAM User

1. **In IAM Dashboard**:
   - Click "Users" in the left sidebar
   - Click "Create user"

2. **User Details**:
   - **User name**: `ai-interviewer-transcribe`
   - **Access type**: ✅ Programmatic access
   - Click "Next: Permissions"

3. **Attach Policies**:
   - Click "Attach existing policies directly"
   - Search for "Transcribe"
   - ✅ Check "AmazonTranscribeFullAccess"
   - Click "Next: Tags" (optional)
   - Click "Next: Review"

4. **Review and Create**:
   - Review your settings
   - Click "Create user"

### Step 4: Get Access Keys

1. **After user creation**:
   - You'll see a success message
   - **IMPORTANT**: Download or copy the credentials now!

2. **Access Key Details**:
   - **Access Key ID**: `AKIA...` (starts with AKIA)
   - **Secret Access Key**: `...` (long random string)
   - **⚠️ WARNING**: You can only see the secret key once!

3. **Download CSV** (recommended):
   - Click "Download .csv" button
   - Save the file securely

### Step 5: Configure Your Project

1. **Run the setup script**:
   ```bash
   node setup-amazon-transcribe.js
   ```

2. **Enter your credentials**:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...`
   - Region: `us-east-1` (or your preferred region)

3. **Verify setup**:
   - Check your `.env` file
   - Should contain:
     ```
     REACT_APP_AWS_ACCESS_KEY_ID=AKIA...
     REACT_APP_AWS_SECRET_ACCESS_KEY=...
     REACT_APP_AWS_REGION=us-east-1
     ```

## 🔒 Security Best Practices

### 1. Never Commit Credentials
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit AWS keys to Git
- ✅ Use environment variables

### 2. Rotate Keys Regularly
- Change access keys every 90 days
- Delete old keys when creating new ones
- Monitor usage in AWS Console

### 3. Use Least Privilege
- Only grant necessary permissions
- Use IAM roles when possible
- Monitor access logs

## 💰 Cost Management

### Free Tier (First 12 Months)
- **60 minutes/month** of transcription
- **Perfect for testing** and small projects
- **No credit card required** for free tier

### Pricing After Free Tier
- **Streaming**: $0.0336/minute (~$2/hour)
- **Batch**: $0.024/minute (~$1.44/hour)
- **Pay only for what you use**

### Cost Estimation
- **1 hour interview**: ~$2
- **10 interviews/month**: ~$20
- **100 interviews/month**: ~$200

## 🛠️ Troubleshooting

### Common Issues

1. **"Access Denied" Error**:
   - Check IAM permissions
   - Ensure user has Transcribe access
   - Verify region is correct

2. **"Invalid Credentials" Error**:
   - Double-check Access Key ID
   - Verify Secret Access Key
   - Check for typos

3. **"Region Not Available" Error**:
   - Use supported regions: us-east-1, us-west-2, eu-west-1
   - Check AWS service availability

### Verification Steps

1. **Test in AWS Console**:
   - Go to Amazon Transcribe
   - Try a sample transcription
   - Verify service is working

2. **Check IAM Permissions**:
   - Go to IAM → Users → Your User
   - Check attached policies
   - Ensure Transcribe access

3. **Verify Environment Variables**:
   - Check `.env` file
   - Restart development server
   - Check browser console for errors

## 📞 Support

### AWS Support
- **Documentation**: https://docs.aws.amazon.com/transcribe/
- **Pricing**: https://aws.amazon.com/transcribe/pricing/
- **Support**: https://console.aws.amazon.com/support/

### Project Support
- Check console logs for errors
- Verify microphone permissions
- Test with text input first

## 🎯 Next Steps

1. **Complete setup** using this guide
2. **Test voice input** in your AI Interviewer
3. **Monitor usage** in AWS Console
4. **Set up billing alerts** if needed
5. **Enjoy high-accuracy transcription!**

---

**Need Help?** If you encounter any issues, check the troubleshooting section or refer to AWS documentation.
