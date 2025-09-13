# Candidate Management Feature

## Overview
The Candidate Management feature allows administrators to add new candidates to the system through two methods:
1. **Resume Upload**: Upload a resume file and automatically extract candidate information using AI
2. **Manual Entry**: Manually enter candidate information through a form

## Features

### Resume Upload
- **Supported Formats**: PDF, DOC, DOCX
- **File Size Limit**: 5MB maximum
- **AI Processing**: Automatically extracts:
  - Skills
  - Work experience
  - Education background
  - Contact information
- **Validation**: File type and size validation
- **n8n Integration**: Sends resume to n8n workflow for processing

### Manual Entry
- **Required Fields**: Name, Email
- **Optional Fields**: Phone, Skills, Experience, Education
- **Skills Input**: Comma-separated skills list
- **Form Validation**: Client-side validation for required fields

## Technical Implementation

### Components
- `CandidatesPage.tsx`: Main page with candidate list and add functionality
- `Modal`: Reusable modal component for the add candidate form
- `Input`: Reusable input component with validation
- `Button`: Reusable button component with loading states

### Services
- `N8nService.processResumeUpload()`: Handles resume upload and processing
- `N8nService.addCandidateManually()`: Handles manual candidate entry

### Types
- `AddCandidateRequest`: Interface for candidate data
- `ResumeUploadResponse`: Interface for resume processing response
- `Candidate`: Extended interface with resume-related fields

## n8n Webhook Integration

### Resume Processing Webhook
**Endpoint**: `POST /webhook/resume-processing`

**Request Format**:
```json
{
  "resume": "File (multipart/form-data)",
  "candidateData": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "timestamp": "ISO string"
}
```

**Response Format**:
```json
{
  "success": true,
  "candidateId": "string",
  "resumeText": "string",
  "extractedData": {
    "skills": ["string"],
    "experience": "string",
    "education": "string",
    "summary": "string"
  }
}
```

### Manual Entry Webhook
**Endpoint**: `POST /webhook/add-candidate`

**Request Format**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": "string",
  "education": "string",
  "timestamp": "ISO string"
}
```

**Response Format**:
```json
{
  "success": true,
  "candidateId": "string"
}
```

## Usage

### Adding a Candidate via Resume Upload
1. Click "Add Candidate" button
2. Select "Upload Resume" option
3. Upload a resume file (PDF, DOC, DOCX)
4. Fill in basic information (Name, Email, Phone)
5. Click "Add Candidate"
6. System processes resume and extracts information automatically

### Adding a Candidate Manually
1. Click "Add Candidate" button
2. Select "Manual Entry" option
3. Fill in all required and optional fields
4. Click "Add Candidate"
5. System saves candidate information

## Error Handling
- File validation errors (type, size)
- Network errors during webhook calls
- Form validation errors
- User-friendly error messages with retry options

## Future Enhancements
- Bulk resume upload
- Resume parsing preview
- Candidate profile editing
- Resume download/viewing
- Integration with job descriptions for skill matching
