# Resume Parser Data Flow

## Complete Data Flow: n8n → Website → Supabase

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Uploads  │    │   n8n Workflow   │    │  Website/Frontend│    │    Supabase     │
│   Resume File   │───▶│   (AI Parser)    │───▶│   (React App)   │───▶│   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step-by-Step Process

### 1. 📁 **User Uploads Resume**
- User selects resume file (PDF, DOC, DOCX, TXT)
- File is sent to n8n webhook via `N8nService.processResumeUpload()`

### 2. 🤖 **n8n Workflow Processing**
- **Input**: Resume file (binary data)
- **AI Processing**: GPT-4 analyzes resume text using our improved prompt
- **Output**: Structured JSON with extracted data

#### n8n Response Format:
```json
{
  "success": true,
  "extractedData": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1 (555) 123-4567",
    "summary": "Experienced software developer...",
    "experience": [
      {
        "title": "Senior Software Developer",
        "company": "Tech Corp",
        "duration": "2020 - Present",
        "description": "Led development of web applications..."
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
        "description": "Built a full-stack e-commerce application...",
        "technologies_used": ["React", "Node.js", "PostgreSQL", "Stripe"]
      }
    ]
  },
  "skills": ["JavaScript", "Python", "Java", "React", "Node.js", "Express", "PostgreSQL", "MongoDB", "Git", "Docker", "AWS"],
  "resumeText": "Raw extracted text from resume...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. 🔄 **Website Processing**
- **Service**: `N8nService.processResumeUpload()` receives n8n response
- **Data Transformation**: Converts structured arrays to database-friendly strings
- **Validation**: Ensures data integrity before database insertion

#### Data Transformation:
```javascript
// Experience Array → String
[
  {
    "title": "Senior Software Developer",
    "company": "Tech Corp", 
    "duration": "2020 - Present",
    "description": "Led development of web applications..."
  }
]
↓
"Senior Software Developer at Tech Corp (2020 - Present): Led development of web applications..."

// Education Array → String  
[
  {
    "degree": "Bachelor of Science in Computer Science",
    "institution": "University of Technology",
    "graduation_year": "2018"
  }
]
↓
"Bachelor of Science in Computer Science from University of Technology (2018)"

// Projects Array → String
[
  {
    "title": "E-commerce Platform",
    "description": "Built a full-stack e-commerce application...",
    "technologies_used": ["React", "Node.js", "PostgreSQL", "Stripe"]
  }
]
↓
"E-commerce Platform: Built a full-stack e-commerce application... (Technologies: React, Node.js, PostgreSQL, Stripe)"
```

### 4. 💾 **Supabase Database Insert**
- **Table**: `candidates`
- **Operation**: `INSERT` new candidate record
- **Fields**: All extracted data mapped to database columns

#### Database Insert:
```sql
INSERT INTO candidates (
  name,
  email, 
  phone,
  resume_text,
  summary,
  skills,
  experience,
  education,
  projects,
  status
) VALUES (
  'John Doe',
  'john.doe@email.com',
  '+1 (555) 123-4567',
  'Raw extracted text from resume...',
  'Experienced software developer...',
  ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Git', 'Docker', 'AWS'],
  'Senior Software Developer at Tech Corp (2020 - Present): Led development of web applications...',
  'Bachelor of Science in Computer Science from University of Technology (2018)',
  'E-commerce Platform: Built a full-stack e-commerce application... (Technologies: React, Node.js, PostgreSQL, Stripe)',
  'pending'
);
```

## Key Features

### ✅ **Backward Compatibility**
- Handles both new structured format and legacy format
- Graceful fallback for older n8n workflows

### ✅ **Data Integrity**
- Validates all data before database insertion
- Handles missing or null values appropriately
- Converts arrays to readable strings for storage

### ✅ **Error Handling**
- n8n processing errors are caught and handled
- Database insertion errors don't break the flow
- User gets appropriate feedback for all scenarios

### ✅ **Structured Storage**
- Skills stored as JSON array for easy querying
- Experience, education, and projects as formatted strings
- Raw resume text preserved for reference

## Result

After the complete flow:
1. ✅ **Resume is processed** by AI in n8n
2. ✅ **Structured data is extracted** and returned to website
3. ✅ **Data is transformed** for database storage
4. ✅ **Candidate record is created** in Supabase
5. ✅ **User sees success message** with candidate details
6. ✅ **Candidate appears** in the candidates list
7. ✅ **Can be assigned** to job descriptions immediately

The entire process is automated and seamless! 🚀
