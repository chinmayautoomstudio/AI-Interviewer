# Exam Report Generation Workflow

## 📊 Overview

The Exam Report Generation Workflow is a comprehensive n8n workflow that generates detailed, AI-powered exam reports for candidates. This workflow consolidates exam data from multiple sources and uses OpenAI GPT-4 to create professional, actionable reports with hiring recommendations.

## 🔄 Workflow Process

### 1. **Webhook Trigger**
- **Endpoint**: `/webhook-test/generate-exam-report`
- **Method**: POST
- **Input**: Session ID and report configuration options

### 2. **Data Extraction & Validation**
- Validates required fields (session_id)
- Prepares report generation parameters
- Sets default values for optional parameters

### 3. **Database Data Retrieval**
The workflow fetches data from multiple tables in parallel:

#### **Exam Session Data**
- Session details, status, duration, performance metadata
- Candidate and job description references

#### **Exam Results Data**
- Final scores, percentages, evaluation status
- AI evaluation data, text evaluation summaries
- Hiring recommendations and processing metadata

#### **Exam Responses Data**
- Individual question answers and scores
- Time taken per question, evaluation details

#### **Candidate Data**
- Personal information, experience, skills
- Education, current role, location

#### **Job Description Data**
- Position details, requirements, skills
- Experience level, employment type, salary range

#### **Exam Questions Data**
- Question text, type, category, difficulty
- Points, explanations, topic information

### 4. **Data Consolidation**
- Combines all data sources into a unified structure
- Separates MCQ and text responses
- Calculates performance statistics
- Prepares data for AI analysis

### 5. **AI Report Generation**
- Uses OpenAI GPT-4 for comprehensive analysis
- Generates structured JSON report with:
  - Executive summary
  - Performance analysis (MCQ vs Text)
  - Question-by-question analysis
  - Skill gap analysis
  - Strengths and weaknesses
  - Hiring recommendations
  - Development suggestions
  - Interview guidance

### 6. **Report Processing**
- Validates AI response format
- Handles parsing errors with fallback structure
- Adds metadata and processing information
- Prepares final report structure

### 7. **Database Storage**
- Saves comprehensive report to `exam_results` table
- Updates report generation timestamp
- Stores report version information

### 8. **Response**
- Returns success/failure status
- Includes key report metrics
- Provides error details if generation fails

## 📋 Input Parameters

```json
{
  "session_id": "uuid", // Required: Exam session ID
  "candidate_id": "uuid", // Optional: Candidate ID
  "job_description_id": "uuid", // Optional: Job description ID
  "include_detailed_analysis": true, // Optional: Include detailed analysis
  "include_hiring_recommendation": true, // Optional: Include hiring recommendations
  "include_skill_gaps": true, // Optional: Include skill gap analysis
  "report_format": "comprehensive" // Optional: Report format (comprehensive|summary|detailed)
}
```

## 📊 Output Structure

### **Success Response**
```json
{
  "success": true,
  "action": "exam_report_generated",
  "session_id": "uuid",
  "candidate_name": "John Doe",
  "job_title": "Software Developer",
  "report_generated": true,
  "hiring_recommendation": "hire",
  "confidence_level": 0.85,
  "overall_performance": "good",
  "report_metadata": {
    "generated_at": "2024-01-01T00:00:00.000Z",
    "report_version": "1.0",
    "ai_confidence": 0.92
  },
  "message": "Exam report generated successfully"
}
```

### **Error Response**
```json
{
  "success": false,
  "action": "exam_report_failed",
  "session_id": "uuid",
  "error": "Error message",
  "message": "Exam report generation failed"
}
```

## 🗄️ Database Schema Updates

### **New Columns in `exam_results` Table**
```sql
ALTER TABLE exam_results 
ADD COLUMN comprehensive_report JSONB,
ADD COLUMN report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN report_version VARCHAR(20) DEFAULT '1.0';
```

### **Indexes**
```sql
CREATE INDEX idx_exam_results_report_generated ON exam_results(report_generated_at);
CREATE INDEX idx_exam_results_report_version ON exam_results(report_version);
```

## 🔧 Integration

### **Frontend Integration**
```typescript
import { examReportWorkflowService } from '../services/examReportWorkflowService';

// Generate comprehensive report
const result = await examReportWorkflowService.generateExamReport({
  session_id: sessionId,
  include_detailed_analysis: true,
  include_hiring_recommendation: true,
  include_skill_gaps: true,
  report_format: 'comprehensive'
});

// Check if report exists
const hasReport = await examReportWorkflowService.hasComprehensiveReport(sessionId);

// Get comprehensive report
const report = await examReportWorkflowService.getComprehensiveReport(sessionId);
```

### **Environment Variables**
```env
REACT_APP_N8N_EXAM_REPORT_WEBHOOK=https://home.ausomemgr.com/webhook-test/generate-exam-report
```

## 📈 Report Features

### **Executive Summary**
- Overall performance rating
- Key strengths and concerns
- Hiring recommendation with confidence level
- Brief performance summary

### **Performance Analysis**
- **MCQ Performance**: Score, percentage, strengths, weaknesses
- **Text Performance**: Score, percentage, analysis
- **Overall Performance**: Combined metrics, time efficiency, consistency

### **Question Analysis**
- Individual question performance
- Time taken per question
- Correctness and feedback
- Strengths and improvement areas

### **Skill Gap Analysis**
- **Critical Gaps**: High-priority skill deficiencies
- **Important Gaps**: Medium-priority improvements
- **Nice-to-Have Gaps**: Low-priority enhancements
- Specific recommendations for each gap

### **Hiring Recommendation**
- Recommendation level (strong_hire, hire, conditional_hire, no_hire)
- Confidence score (0-1)
- Detailed reasoning
- Interview focus areas
- Salary recommendations

### **Development Suggestions**
- Immediate development areas
- Short-term goals (3-6 months)
- Long-term goals (6-12 months)
- Recommended learning resources

### **Interview Guidance**
- Focus areas for interviews
- Specific questions to ask
- Red flags to watch for
- Green flags to look for

## 🚀 Usage Examples

### **Generate Report for Single Session**
```typescript
const result = await examReportWorkflowService.generateExamReport({
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  report_format: "comprehensive"
});
```

### **Bulk Report Generation**
```typescript
const sessionIds = ["session1", "session2", "session3"];
const results = await examReportWorkflowService.generateBulkReports(sessionIds);
```

### **Check Report Status**
```typescript
const status = await examReportWorkflowService.getReportStatus(sessionId);
console.log(`Report exists: ${status.hasReport}`);
console.log(`Generated at: ${status.generatedAt}`);
```

## 🔍 Monitoring & Debugging

### **Log Points**
- Webhook data extraction
- Database query results
- AI response processing
- Report generation status

### **Error Handling**
- Graceful fallback for AI parsing errors
- Comprehensive error messages
- Retry mechanisms for failed requests

### **Performance Metrics**
- Processing time tracking
- Data completeness validation
- AI confidence scoring

## 🎯 Benefits

1. **Comprehensive Analysis**: Detailed evaluation of all exam aspects
2. **AI-Powered Insights**: Intelligent analysis and recommendations
3. **Professional Reports**: Well-structured, actionable reports
4. **Hiring Guidance**: Clear recommendations for hiring decisions
5. **Development Focus**: Specific areas for candidate improvement
6. **Interview Preparation**: Targeted questions and focus areas
7. **Scalable**: Handles bulk report generation efficiently

## 🔮 Future Enhancements

1. **Report Templates**: Customizable report formats
2. **Comparative Analysis**: Compare multiple candidates
3. **Trend Analysis**: Track performance over time
4. **Export Options**: PDF, Excel, Word formats
5. **Automated Scheduling**: Generate reports automatically
6. **Integration**: Connect with HR systems
7. **Analytics Dashboard**: Visual report insights

---

**Note**: This workflow requires proper n8n setup with OpenAI integration and database access. Ensure all environment variables are configured correctly before deployment.
