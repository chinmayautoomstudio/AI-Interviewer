# n8n Webhook Integration

## Resume Processing Webhook

### Webhook URL
```
https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8
```

### Request Format
The webhook receives a `multipart/form-data` request with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `resume` | File (binary) | The resume file (PDF, DOC, DOCX) |
| `timestamp` | String | ISO timestamp of the request |
| `fileName` | String | Original filename of the resume |
| `fileSize` | String | File size in bytes |
| `fileType` | String | MIME type of the file |

**Note**: Candidate information (name, email, phone) will be automatically extracted from the resume by the n8n workflow.

### Example Request
```javascript
const formData = new FormData();
formData.append('resume', resumeFile, 'john_doe_resume.pdf');
formData.append('timestamp', '2024-01-15T10:30:00.000Z');
formData.append('fileName', 'john_doe_resume.pdf');
formData.append('fileSize', '245760');
formData.append('fileType', 'application/pdf');

fetch('https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8', {
  method: 'POST',
  body: formData
});
```

### Expected Response Format
The webhook should return a JSON response with the following structure:

```json
{
  "success": true,
  "candidateId": "generated-candidate-id",
  "resumeText": "Extracted text content from resume",
  "extractedData": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-123-4567",
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "experience": "5 years of software development experience...",
    "education": "Bachelor's degree in Computer Science...",
    "summary": "Experienced software developer with expertise in..."
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Testing the Integration

### 1. Test with Browser Console
Open the browser console and test the webhook directly:

```javascript
// Create a test file
const testFile = new File(['Test resume content'], 'test-resume.pdf', { type: 'application/pdf' });

// Create form data
const formData = new FormData();
formData.append('resume', testFile);
formData.append('candidateName', 'Test Candidate');
formData.append('candidateEmail', 'test@example.com');
formData.append('timestamp', new Date().toISOString());
formData.append('fileName', 'test-resume.pdf');
formData.append('fileSize', testFile.size.toString());
formData.append('fileType', testFile.type);

// Send to webhook
fetch('https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log('Webhook response:', data))
.catch(error => console.error('Error:', error));
```

### 2. Test with Application
1. Go to `http://localhost:3000/candidates`
2. Click "Add Candidate"
3. Select "Upload Resume"
4. Upload a test resume file
5. Fill in candidate details
6. Click "Add Candidate"
7. Check browser console for webhook logs

## Environment Configuration

Add the following to your `.env` file:

```env
REACT_APP_N8N_BASE_URL=https://home.ausomemgr.com
REACT_APP_N8N_RESUME_WEBHOOK=https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8
REACT_APP_N8N_API_KEY=your-api-key
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the n8n webhook allows CORS requests from your domain
2. **File Size Limits**: Ensure the webhook can handle files up to 5MB
3. **Response Format**: Verify the webhook returns the expected JSON structure
4. **Network Issues**: Check if the webhook URL is accessible

### Debug Logs
The application logs detailed information to the browser console:
- Webhook URL being called
- File details (name, size, type)
- Response status and data
- Any errors encountered

Check the browser console for these logs when testing the resume upload functionality.
