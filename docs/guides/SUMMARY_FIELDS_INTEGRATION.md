# Summary Fields Integration with n8n Workflows

## Overview

This document explains how to integrate AI-generated summaries for candidates and job descriptions using n8n workflows. The database now includes dedicated fields to store these summaries.

## Database Changes

### New Fields Added

#### Candidates Table
- **`resume_summary`** (TEXT): AI-generated summary of the candidate's resume
- **Purpose**: Store concise, AI-generated summaries of candidate profiles for quick reference and matching

#### Job Descriptions Table  
- **`jd_summary`** (TEXT): AI-generated summary of the job description
- **Purpose**: Store concise, AI-generated summaries of job requirements for quick reference and matching

## n8n Workflow Integration

### 1. Resume Summary Generation Workflow

**Trigger**: When a new resume is uploaded or processed
**Purpose**: Generate a concise summary of the candidate's resume

#### Workflow Steps:
1. **Webhook Trigger**: Receive resume data from frontend
2. **Extract Resume Text**: Parse resume content (PDF, DOC, etc.)
3. **AI Processing**: Use OpenAI/Claude to generate summary
4. **Database Update**: Update `candidates.resume_summary` field

#### Example n8n Workflow Structure:
```json
{
  "nodes": [
    {
      "name": "Resume Upload Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Extract Resume Text",
      "type": "n8n-nodes-base.openAi"
    },
    {
      "name": "Generate Summary",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "prompt": "Generate a concise 2-3 sentence summary of this resume highlighting key skills, experience, and qualifications."
      }
    },
    {
      "name": "Update Database",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "candidates",
        "updateKey": "id",
        "fields": {
          "resume_summary": "{{ $json.summary }}"
        }
      }
    }
  ]
}
```

### 2. Job Description Summary Generation Workflow

**Trigger**: When a new job description is created or updated
**Purpose**: Generate a concise summary of the job requirements

#### Workflow Steps:
1. **Webhook Trigger**: Receive job description data
2. **AI Processing**: Use OpenAI/Claude to generate summary
3. **Database Update**: Update `job_descriptions.jd_summary` field

#### Example n8n Workflow Structure:
```json
{
  "nodes": [
    {
      "name": "JD Creation Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Generate JD Summary",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "prompt": "Generate a concise 2-3 sentence summary of this job description highlighting key requirements, responsibilities, and qualifications."
      }
    },
    {
      "name": "Update Database",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "job_descriptions",
        "updateKey": "id",
        "fields": {
          "jd_summary": "{{ $json.summary }}"
        }
      }
    }
  ]
}
```

## Frontend Integration

### TypeScript Interfaces Updated

The following interfaces now include the summary fields:

```typescript
// Candidate interface
export interface Candidate {
  // ... existing fields
  resume_summary?: string; // AI-generated summary from n8n workflow
  // ... other fields
}

// JobDescription interface  
export interface JobDescription {
  // ... existing fields
  jd_summary?: string; // AI-generated summary from n8n workflow
  // ... other fields
}
```

### Displaying Summaries in UI

#### Candidate Profile Page
```typescript
// Display resume summary if available
{candidate.resume_summary && (
  <div className="mb-4">
    <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
      {candidate.resume_summary}
    </p>
  </div>
)}
```

#### Job Description Page
```typescript
// Display JD summary if available
{jobDescription.jd_summary && (
  <div className="mb-4">
    <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
      {jobDescription.jd_summary}
    </p>
  </div>
)}
```

## API Endpoints for n8n Integration

### Update Candidate Summary
```http
PATCH /rest/v1/candidates?id=eq.{candidate_id}
Content-Type: application/json
Authorization: Bearer {supabase_anon_key}

{
  "resume_summary": "AI-generated summary text here"
}
```

### Update Job Description Summary
```http
PATCH /rest/v1/job_descriptions?id=eq.{job_description_id}
Content-Type: application/json
Authorization: Bearer {supabase_anon_key}

{
  "jd_summary": "AI-generated summary text here"
}
```

## Benefits

### 1. **Quick Reference**
- Admins can quickly understand candidate profiles and job requirements
- Reduces time spent reading full resumes and job descriptions

### 2. **Better Matching**
- AI summaries can be used for automated candidate-job matching
- Improved search and filtering capabilities

### 3. **Interview Preparation**
- AI agents can use summaries for better interview preparation
- More targeted questions based on concise summaries

### 4. **Reporting & Analytics**
- Summaries can be used for generating reports
- Better insights into candidate pools and job requirements

## Implementation Checklist

- [ ] Run SQL script to add summary fields to database
- [ ] Update TypeScript interfaces
- [ ] Update Supabase database types
- [ ] Create n8n workflows for summary generation
- [ ] Test summary generation with sample data
- [ ] Update UI components to display summaries
- [ ] Test end-to-end workflow

## Testing

### Test Summary Generation
1. Upload a resume through the frontend
2. Verify n8n workflow processes the resume
3. Check that `resume_summary` is populated in database
4. Verify summary appears in candidate profile UI

### Test JD Summary Generation
1. Create a new job description
2. Verify n8n workflow processes the JD
3. Check that `jd_summary` is populated in database
4. Verify summary appears in job description UI

## Troubleshooting

### Common Issues
1. **Summary not generated**: Check n8n workflow logs
2. **Database update fails**: Verify Supabase permissions
3. **UI not displaying**: Check TypeScript interface updates
4. **Webhook not triggered**: Verify webhook URL configuration

### Debug Steps
1. Check n8n workflow execution logs
2. Verify database field names match exactly
3. Test API calls directly with Postman/curl
4. Check browser console for TypeScript errors
