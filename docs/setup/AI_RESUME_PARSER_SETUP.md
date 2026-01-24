# AI Resume Parser Setup Guide

## Overview
The AI Resume Parser is an n8n workflow that automatically extracts structured information from resume files using OpenAI's GPT-4 model. It processes uploaded resume files and returns detailed candidate information in a standardized JSON format.

## Features
- **Automatic Text Extraction**: Extracts text from various resume formats (PDF, DOC, DOCX, TXT)
- **AI-Powered Parsing**: Uses GPT-4 to intelligently parse and structure resume information
- **Comprehensive Data Extraction**: Extracts name, contact info, experience, education, skills, and projects
- **Structured Output**: Returns data in a consistent JSON format for easy integration
- **Error Handling**: Graceful handling of corrupted or unreadable files

## Setup Instructions

### 1. n8n Workflow Setup

1. **Import the Workflow**:
   - Open your n8n instance
   - Go to "Workflows" → "Import from File"
   - Select `n8n/resume_parser_workflow.json`

2. **Configure OpenAI Node**:
   - Open the "OpenAI Resume Parser" node
   - Set your OpenAI API key in the credentials
   - Ensure the model is set to "gpt-4" (or "gpt-3.5-turbo" for cost optimization)

3. **Configure Webhook**:
   - The webhook URL will be: `https://your-n8n-instance.com/webhook-test/parse-resume`
   - Note this URL for frontend configuration

4. **Activate the Workflow**:
   - Save and activate the workflow
   - Test with a sample resume file

### 2. Frontend Configuration

1. **Update Environment Variables**:
   Add the resume parser webhook URL to your `.env` file:
   ```env
   REACT_APP_N8N_RESUME_PARSER_WEBHOOK=https://your-n8n-instance.com/webhook-test/parse-resume
   ```

2. **Update n8n Service**:
   The `N8nService.processResumeUpload()` method should already be configured to use the webhook URL.

## API Response Format

The workflow returns a JSON response with the following structure:

```json
{
  "success": true,
  "extractedData": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1 (555) 123-4567",
    "summary": "Experienced software developer with 5+ years in full-stack development",
    "experience": [
      {
        "title": "Senior Software Developer",
        "company": "Tech Corp",
        "duration": "2020 - Present",
        "description": "Led development of web applications using React and Node.js"
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Science in Computer Science",
        "institution": "University of Technology",
        "graduation_year": "2018"
      }
    ],
    "skills": {
      "Programming Languages": ["JavaScript", "Python", "Java"],
      "Frameworks": ["React", "Node.js", "Express"],
      "Databases": ["PostgreSQL", "MongoDB"],
      "Other": ["Git", "Docker", "AWS"]
    },
    "projects": [
      {
        "title": "E-commerce Platform",
        "description": "Built a full-stack e-commerce application with payment integration",
        "technologies_used": ["React", "Node.js", "PostgreSQL", "Stripe"]
      }
    ]
  },
  "skills": ["JavaScript", "Python", "Java", "React", "Node.js", "Express", "PostgreSQL", "MongoDB", "Git", "Docker", "AWS"],
  "resumeText": "Raw extracted text from resume...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Supported File Formats

- **PDF**: `.pdf` files
- **Microsoft Word**: `.doc`, `.docx` files
- **Plain Text**: `.txt` files
- **Rich Text**: `.rtf` files

## Error Handling

The workflow handles various error scenarios:

1. **Invalid File Format**: Returns error for unsupported file types
2. **Corrupted Files**: Gracefully handles unreadable files
3. **Empty Resumes**: Returns null values for missing information
4. **AI Parsing Errors**: Provides fallback responses

## Customization

### Modifying the AI Prompt

The AI prompt is defined in the OpenAI node. You can customize it by:

1. Opening the "OpenAI Resume Parser" node
2. Modifying the system message content
3. Adjusting the temperature and max tokens settings

### Adding New Fields

To extract additional information:

1. Update the system prompt in the workflow
2. Modify the data processor JavaScript code
3. Update the frontend types and processing logic

### Skills Categorization

The current prompt categorizes skills into:
- Programming Languages
- Frameworks
- Databases
- Other

You can modify these categories in the system prompt.

## Testing

### Manual Testing

1. **Upload a Resume**: Use the candidate upload feature in the frontend
2. **Check Console**: Monitor browser console for any errors
3. **Verify Data**: Ensure extracted data appears correctly in the candidate form

### API Testing

Test the webhook directly using curl:

```bash
curl -X POST https://your-n8n-instance.com/webhook-test/parse-resume \
  -F "resume=@sample-resume.pdf" \
  -F "timestamp=2024-01-01T12:00:00.000Z" \
  -F "fileName=sample-resume.pdf" \
  -F "fileSize=12345" \
  -F "fileType=application/pdf"
```

## Troubleshooting

### Common Issues

1. **Webhook Not Responding**:
   - Check if the n8n workflow is activated
   - Verify the webhook URL is correct
   - Check n8n execution logs

2. **AI Parsing Errors**:
   - Verify OpenAI API key is valid
   - Check if you have sufficient API credits
   - Review the AI response in n8n execution logs

3. **File Upload Issues**:
   - Ensure file size is within limits
   - Check if file format is supported
   - Verify file is not corrupted

### Debug Mode

Enable debug logging in the n8n workflow by adding console.log statements in the JavaScript code node.

## Cost Optimization

- Use GPT-3.5-turbo instead of GPT-4 for lower costs
- Implement file size limits to reduce processing time
- Add caching for repeated resume processing
- Use temperature=0.1 for consistent results

## Security Considerations

- Validate file types on the frontend before upload
- Implement file size limits
- Sanitize extracted data before storing
- Use HTTPS for all webhook communications
- Implement rate limiting for the webhook endpoint

## Performance Tips

- Process files asynchronously
- Implement progress indicators for large files
- Cache frequently used AI responses
- Optimize the AI prompt for faster processing
- Use streaming responses for large data sets
