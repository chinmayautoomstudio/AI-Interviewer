# Job Description (JD) Handling Documentation

## Overview
This document describes how the AI Interviewer application handles Job Description parsing, processing, and management.

## JD Parser Service

### Webhook Endpoints
- **Text Parsing**: `https://home.ausomemgr.com/webhook-test/parse-job-description`
- **File Upload**: `https://home.ausomemgr.com/webhook-test/parse-job-description-file`

### Response Format
The JD parser returns data in the following JSON structure:

```json
[
  {
    "job_summary": "Detailed job description text...",
    "job_title": "Web Developer Trainee",
    "department": "Development",
    "location": "Bhubaneswar, Odisha",
    "experience_level": "entry-level",
    "employment_type": "full-time",
    "work_mode": "on-site",
    "salary_range": "Up to ₹60,000.00 per year",
    "key_responsibilities": [
      "Learn and collaborate with senior developers...",
      "Gain hands-on experience in frontend development..."
    ],
    "required_skills": [
      "HTML5 (1 year experience)",
      "JavaScript (1 year experience)",
      "CSS (1 year experience)"
    ],
    "preferred_skills": [
      "Basic knowledge of HTML, CSS, and JavaScript",
      "PHP (1 year experience)"
    ],
    "technical_stack": [
      "HTML",
      "CSS", 
      "JavaScript",
      "PHP",
      "Node.js",
      "Python",
      "WordPress (CMS)"
    ],
    "education_requirements": "Bachelor's degree (Required)",
    "company_culture": "Dynamic and innovative digital solutions company...",
    "growth_opportunities": "Opportunity to learn from experienced professionals...",
    "benefits": [
      "Competitive stipend during the trainee period",
      "Flexible schedule"
    ],
    "qualifications": {
      "minimum": [
        "Bachelor's degree",
        "1 year experience in HTML5",
        "Strong passion for web development..."
      ],
      "preferred": [
        "Basic knowledge of HTML, CSS, and JavaScript",
        "1 year experience in PHP"
      ]
    }
  }
]
```

## Data Mapping

### Form Field Mapping
The parsed data is automatically mapped to form fields as follows:

| JSON Field | Form Field | Description |
|------------|------------|-------------|
| `job_title` | `title` | Job title |
| `job_summary` | `description` | Job description text |
| `location` | `location` | Job location |
| `employment_type` | `employmentType` | Full-time, Part-time, etc. |
| `salary_range` | `salaryRange` | Salary information |
| `department` | `department` | Department name |
| `experience_level` | `experienceLevel` | Entry, Mid, Senior level |
| `work_mode` | `workMode` | On-site, Remote, Hybrid |
| `company_name` | `companyName` | Company name |
| `required_skills` | `requirementsList` | Array of required skills |
| `key_responsibilities` | `responsibilitiesList` | Array of responsibilities |
| `technical_stack` | `skillsList` | Array of technical skills |
| `benefits` | `benefitsList` | Array of benefits |

## File Upload Support

### Supported Formats
- **PDF files only**
- **Maximum file size**: 10MB
- **Upload method**: FormData with original file

### Upload Process
1. User selects PDF file
2. File validation (type and size)
3. File sent to webhook as FormData
4. AI processes the file content
5. Parsed data returned in JSON format
6. Form auto-filled with extracted data

## Text Parsing Support

### Input Format
- Raw job description text
- Pasted from any source
- No specific format requirements

### Processing
1. Text sent to webhook as JSON
2. AI analyzes and structures the content
3. Extracted data returned in standardized format
4. Form auto-filled with parsed information

## Error Handling

### Common Error Scenarios
- **Invalid file format**: Only PDF files accepted
- **File too large**: Maximum 10MB limit
- **Network errors**: Connection issues with webhook
- **Parsing failures**: AI unable to extract structured data
- **Invalid response**: Webhook returns unexpected format

### Error Messages
- User-friendly error messages displayed in modal
- Console logging for debugging
- Graceful fallback to manual entry

## Auto-Fill Features

### Automatic Population
When parsing succeeds, the following fields are automatically populated:
- Basic job information (title, location, company)
- Employment details (type, level, mode)
- Job description and requirements
- Skills and responsibilities arrays
- Benefits and perks
- **Custom Job ID** (AS-WD-6581 format)

### Custom Job ID Generation
The system automatically generates unique job IDs in the format: `AS-{ABBREVIATION}-{TIMESTAMP}`

**Examples:**
- "Web Developer" → `AS-WD-6581`
- "Senior Software Engineer" → `AS-SS-7429`
- "Data Analyst" → `AS-DA-8156`

**Format Breakdown:**
- `AS` = Autoom Studio prefix
- `{ABBREVIATION}` = First letters of job title words
- `{TIMESTAMP}` = Last 4 digits of current timestamp

### Manual Override
Users can:
- Edit any auto-filled field
- Add additional requirements/skills
- Remove unwanted items
- Modify parsed content

## Integration Points

### Dashboard Integration
- Quick action buttons open JD modal
- Direct access from job descriptions page
- Seamless workflow integration

### Database Storage
- Parsed data stored in job_descriptions table
- Structured format for easy querying
- Support for complex job requirements

## Best Practices

### For Users
1. **File Quality**: Use clear, well-formatted PDFs
2. **Content Completeness**: Include all relevant job details
3. **Review Parsed Data**: Always verify auto-filled information
4. **Manual Enhancement**: Add missing details manually

### For Developers
1. **Error Handling**: Always handle parsing failures gracefully
2. **Data Validation**: Validate parsed data before saving
3. **User Feedback**: Provide clear success/error messages
4. **Logging**: Log parsing attempts for debugging

## Troubleshooting

### Common Issues
1. **"Failed to parse"**: Check webhook connectivity
2. **"Invalid file format"**: Ensure PDF file is selected
3. **"File too large"**: Compress PDF or split content
4. **"No data found"**: Verify webhook response format

### Debug Information
- Check browser console for detailed logs
- Verify webhook URL configuration
- Test with sample job descriptions
- Monitor network requests in DevTools

## Future Enhancements

### Planned Features
- Support for additional file formats (DOC, DOCX)
- Batch processing of multiple JDs
- Template-based JD creation
- Integration with job boards
- Advanced AI parsing options

### API Improvements
- Rate limiting and caching
- Response format versioning
- Enhanced error reporting
- Webhook retry mechanisms
