# AI Job Description Parser Setup

## Overview
The AI Job Description Parser replaces the regex-based parsing with a more accurate AI-powered solution using n8n workflows and OpenAI GPT-4.

## Architecture
```
User Input (JD Text) → n8n Webhook → OpenAI GPT-4 → Data Processing → JSON Response → Frontend Form
```

## Files Created/Updated

### 1. AI Prompt (`prompts/jd_parser_ai_prompt.md`)
- **Purpose**: Comprehensive prompt for the AI agent
- **Features**: 
  - Detailed parsing rules for all job description fields
  - JSON output format specification
  - Error handling instructions
  - Examples and edge cases

### 2. n8n Workflow (`n8n/jd_parser_workflow.json`)
- **Purpose**: n8n workflow configuration for the AI parser
- **Components**:
  - Webhook trigger endpoint
  - OpenAI GPT-4 integration
  - Data processing and validation
  - JSON response formatting

### 3. Service Layer (`src/services/jdParser.ts`)
- **Purpose**: Frontend service to communicate with n8n webhook
- **Features**:
  - HTTP request handling
  - Error management
  - Data validation
  - Test functionality

### 4. Updated JobDescriptionsPage (`src/pages/JobDescriptionsPage.tsx`)
- **Changes**:
  - Replaced regex-based parsing with AI parser
  - Updated button text to "🤖 AI Parse & Auto-Fill"
  - Enhanced error handling
  - Better user feedback

### 5. Environment Configuration (`env.example`)
- **Added**: `REACT_APP_N8N_JD_PARSER_WEBHOOK` variable

## Setup Instructions

### Step 1: Deploy n8n Workflow
1. **Import the workflow**:
   - Copy content from `n8n/jd_parser_workflow.json`
   - Import into your n8n instance
   - Activate the workflow

2. **Configure OpenAI**:
   - Add your OpenAI API key to n8n
   - Ensure GPT-4 access is available
   - Test the workflow with sample data

3. **Get Webhook URL**:
   - Copy the webhook URL from the trigger node
   - Format: `https://home.ausomemgr.com/webhook-test/parse-job-description`

### Step 2: Configure Environment Variables
1. **Update `.env` file**:
   ```env
   REACT_APP_N8N_JD_PARSER_WEBHOOK=https://home.ausomemgr.com/webhook-test/parse-job-description
   ```

2. **Restart the application**:
   ```bash
   npm start
   ```

### Step 3: Test the Integration
1. **Go to Job Descriptions page**
2. **Click "Add Job Description"**
3. **Paste a job description** in the text area
4. **Click "🤖 AI Parse & Auto-Fill"**
5. **Verify** that all fields are populated correctly

## Expected JSON Response Format

```json
{
  "success": true,
  "data": {
    "title": "Senior Software Developer",
    "department": "Engineering",
    "location": "Bangalore, India",
    "employmentType": "full-time",
    "experienceLevel": "senior",
    "salaryMin": 1200000,
    "salaryMax": 1800000,
    "currency": "INR",
    "description": "We are looking for a senior software developer...",
    "requirements": [
      "5+ years of experience in React and Node.js",
      "Strong problem-solving skills"
    ],
    "responsibilities": [
      "Develop and maintain web applications",
      "Collaborate with cross-functional teams"
    ],
    "skills": ["React", "Node.js", "JavaScript"],
    "qualifications": ["Bachelor's degree in Computer Science"],
    "benefits": ["Health insurance", "Flexible hours"],
    "companyName": "TechCorp India",
    "workMode": "on-site",
    "jobCategory": "software_development",
    "contactEmail": "hr@techcorp.com",
    "applicationDeadline": "2024-12-31"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

### Common Issues and Solutions

1. **"Failed to parse job description"**
   - Check n8n workflow is active
   - Verify webhook URL is correct
   - Check OpenAI API key and quota

2. **"No data returned from AI parser"**
   - AI response format issue
   - Check n8n workflow logs
   - Verify prompt configuration

3. **"Job title is required but not found"**
   - AI couldn't extract title from text
   - Improve job description format
   - Check AI prompt effectiveness

### Debugging Steps

1. **Check n8n workflow execution**:
   - Go to n8n dashboard
   - View execution history
   - Check for errors in each node

2. **Test with sample data**:
   ```javascript
   // Use the test function in JDParserService
   const result = await JDParserService.testParser();
   console.log(result);
   ```

3. **Verify webhook connectivity**:
   ```bash
   curl -X POST https://home.ausomemgr.com/webhook-test/parse-job-description \
     -H "Content-Type: application/json" \
     -d '{"jobDescription": "Test job description"}'
   ```

## Performance Considerations

- **Response Time**: Typically 2-5 seconds for AI parsing
- **Rate Limits**: Respect OpenAI API rate limits
- **Caching**: Consider caching parsed results for identical inputs
- **Fallback**: Keep manual form filling as backup option

## Cost Optimization

- **Token Usage**: Monitor OpenAI token consumption
- **Batch Processing**: Consider batching multiple JDs
- **Caching**: Cache frequently parsed job descriptions
- **Prompt Optimization**: Fine-tune prompts for efficiency

## Security Considerations

- **API Keys**: Store securely in environment variables
- **Input Validation**: Sanitize job description input
- **Rate Limiting**: Implement rate limiting on webhook
- **Error Messages**: Don't expose sensitive information in errors

## Future Enhancements

1. **Multi-language Support**: Parse JDs in different languages
2. **Industry-specific Parsing**: Specialized prompts for different industries
3. **Learning from Feedback**: Improve parsing based on user corrections
4. **Batch Processing**: Parse multiple JDs simultaneously
5. **Integration with Job Boards**: Direct parsing from job board URLs

## Troubleshooting

### n8n Workflow Issues
- Check workflow activation status
- Verify node configurations
- Review execution logs
- Test individual nodes

### OpenAI API Issues
- Verify API key validity
- Check quota and billing
- Monitor rate limits
- Review API response format

### Frontend Integration Issues
- Check network requests in browser dev tools
- Verify environment variables
- Test service functions
- Review error messages

## Support

For issues with:
- **n8n Workflow**: Check n8n documentation and community
- **OpenAI API**: Review OpenAI API documentation
- **Frontend Integration**: Check browser console and network tab
- **Database Issues**: Run the database fix scripts provided
