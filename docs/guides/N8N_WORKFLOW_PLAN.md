# N8N Workflow Plan for Exam System

## Overview
This document outlines the n8n workflows needed for the AI-powered exam system, including question generation and text answer evaluation.

## Workflow 1: AI Question Generation

### Input Parameters (What we provide to n8n)

#### 1. Job Description Data
```json
{
  "job_description": {
    "title": "Frontend Developer",
    "description": "Full job description text...",
    "required_skills": ["React", "JavaScript", "CSS", "HTML"],
    "preferred_skills": ["TypeScript", "Next.js", "Tailwind CSS"],
    "experience_level": "mid-level",
    "employment_type": "full-time",
    "technical_stack": ["React", "JavaScript", "CSS", "HTML", "Git"],
    "key_responsibilities": ["Develop user interfaces", "Optimize performance", "Collaborate with team"],
    "education_requirements": "Bachelor's degree in Computer Science or related field"
  }
}
```

#### 2. Question Generation Configuration
```json
{
  "generation_config": {
    "total_questions": 15,
    "technical_percentage": 70,
    "aptitude_percentage": 30,
    "difficulty_distribution": {
      "easy": 20,
      "medium": 50,
      "hard": 30
    },
    "question_types": {
      "mcq": 60,
      "text": 40
    },
    "topics": [
      {
        "name": "JavaScript",
        "weight": 40,
        "min_questions": 3,
        "max_questions": 6
      },
      {
        "name": "React",
        "weight": 30,
        "min_questions": 2,
        "max_questions": 5
      },
      {
        "name": "Logical Reasoning",
        "weight": 20,
        "min_questions": 2,
        "max_questions": 4
      },
      {
        "name": "Problem Solving",
        "weight": 10,
        "min_questions": 1,
        "max_questions": 3
      }
    ]
  }
}
```

#### 3. Input Method Context
```json
{
  "input_method": "existing_jd", // "existing_jd" | "upload_pdf" | "manual_input" | "custom_topic"
  "source_info": {
    "job_description_id": "JD-123",
    "extracted_text": "Text from PDF if uploaded",
    "manual_description": "Manually typed description",
    "custom_topic": "Machine Learning",
    "topic_insights": "Focus on algorithms, data structures, and practical applications"
  }
}
```

### Expected Output (What we get from n8n)

#### 1. Generated Questions Array
```json
{
  "generated_questions": [
    {
      "question_text": "What is the time complexity of binary search algorithm?",
      "question_type": "mcq",
      "question_category": "technical",
      "difficulty_level": "medium",
      "topic": "Data Structures & Algorithms",
      "subtopic": "Search Algorithms",
      "points": 2,
      "time_limit_seconds": 60,
      "mcq_options": [
        {
          "option": "A",
          "text": "O(n)"
        },
        {
          "option": "B", 
          "text": "O(log n)"
        },
        {
          "option": "C",
          "text": "O(n log n)"
        },
        {
          "option": "D",
          "text": "O(1)"
        }
      ],
      "correct_answer": "B",
      "answer_explanation": "Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.",
      "tags": ["algorithms", "search", "complexity", "binary-search"]
    },
    {
      "question_text": "Explain the concept of closures in JavaScript and provide a practical example.",
      "question_type": "text",
      "question_category": "technical",
      "difficulty_level": "hard",
      "topic": "JavaScript",
      "subtopic": "Advanced Concepts",
      "points": 3,
      "time_limit_seconds": 120,
      "correct_answer": "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function returns. Example: function outer(x) { return function inner(y) { return x + y; }; }",
      "answer_explanation": "Closures allow functions to maintain access to their lexical scope, enabling powerful patterns like data privacy and function factories.",
      "tags": ["javascript", "closures", "scope", "functions"]
    }
  ]
}
```

#### 2. Generation Metadata
```json
{
  "generation_metadata": {
    "total_generated": 15,
    "technical_count": 11,
    "aptitude_count": 4,
    "mcq_count": 9,
    "text_count": 6,
    "difficulty_breakdown": {
      "easy": 3,
      "medium": 8,
      "hard": 4
    },
    "topic_distribution": {
      "JavaScript": 6,
      "React": 4,
      "Logical Reasoning": 3,
      "Problem Solving": 2
    },
    "generation_time": "2024-01-15T10:30:00Z",
    "ai_model_used": "gpt-4",
    "confidence_score": 0.92
  }
}
```

## Workflow 2: Text Answer Evaluation

### Input Parameters

#### 1. Answer Evaluation Request
```json
{
  "evaluation_request": {
    "question_id": "q-123",
    "question_text": "Explain the concept of closures in JavaScript and provide a practical example.",
    "correct_answer": "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function returns.",
    "candidate_answer": "A closure is when a function can access variables from outside its scope. For example, function outer() { var x = 1; return function inner() { return x; }; }",
    "question_type": "text",
    "difficulty_level": "hard",
    "points": 3,
    "evaluation_criteria": {
      "accuracy_weight": 0.4,
      "completeness_weight": 0.3,
      "clarity_weight": 0.2,
      "example_weight": 0.1
    }
  }
}
```

### Expected Output

#### 1. Evaluation Result
```json
{
  "evaluation_result": {
    "is_correct": true,
    "score": 2.7,
    "max_score": 3.0,
    "percentage": 90.0,
    "detailed_scores": {
      "accuracy": 0.9,
      "completeness": 0.85,
      "clarity": 0.95,
      "example": 0.8
    },
    "feedback": {
      "strengths": [
        "Correctly identified the core concept of closures",
        "Provided a working example",
        "Clear and concise explanation"
      ],
      "improvements": [
        "Could mention that closures maintain access to outer scope even after outer function returns",
        "Example could be more comprehensive"
      ],
      "overall_feedback": "Good understanding of closures with a practical example. Minor improvements in completeness."
    },
    "keywords_found": ["function", "access", "variables", "scope", "example"],
    "keywords_missing": ["outer", "enclosing", "returns"],
    "evaluation_confidence": 0.88
  }
}
```

## Workflow 3: Question Quality Assessment

### Input Parameters
```json
{
  "quality_assessment": {
    "question_text": "What is React?",
    "question_type": "mcq",
    "difficulty_level": "easy",
    "topic": "React",
    "mcq_options": [...],
    "correct_answer": "A"
  }
}
```

### Expected Output
```json
{
  "quality_assessment": {
    "overall_quality": "good",
    "quality_score": 0.85,
    "issues": [],
    "suggestions": [
      "Consider making the question more specific",
      "Add more context to the question"
    ],
    "difficulty_validation": {
      "assessed_difficulty": "easy",
      "matches_intended": true,
      "confidence": 0.92
    },
    "bias_check": {
      "has_bias": false,
      "bias_types": [],
      "inclusivity_score": 0.95
    }
  }
}
```

## N8N Workflow Structure

### 1. Question Generation Workflow
```
HTTP Request (Input) 
→ Data Validation 
→ AI Prompt Generation 
→ OpenAI API Call 
→ Response Parsing 
→ Question Validation 
→ Quality Assessment 
→ Database Formatting 
→ HTTP Response (Output)
```

### 2. Answer Evaluation Workflow
```
HTTP Request (Input) 
→ Answer Preprocessing 
→ AI Evaluation Prompt 
→ OpenAI API Call 
→ Score Calculation 
→ Feedback Generation 
→ HTTP Response (Output)
```

### 3. Quality Assessment Workflow
```
HTTP Request (Input) 
→ Question Analysis 
→ AI Quality Check 
→ Bias Detection 
→ Difficulty Validation 
→ HTTP Response (Output)
```

## API Endpoints

### 1. Question Generation
- **URL**: `POST /webhook/generate-questions`
- **Authentication**: API Key
- **Rate Limiting**: 10 requests/minute
- **Timeout**: 60 seconds

### 2. Answer Evaluation
- **URL**: `POST /webhook/evaluate-answer`
- **Authentication**: API Key
- **Rate Limiting**: 50 requests/minute
- **Timeout**: 30 seconds

### 3. Quality Assessment
- **URL**: `POST /webhook/assess-quality`
- **Authentication**: API Key
- **Rate Limiting**: 20 requests/minute
- **Timeout**: 45 seconds

## Error Handling

### Common Error Responses
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Job description is required",
    "details": {
      "field": "job_description",
      "expected_type": "string",
      "received": null
    }
  }
}
```

### Retry Logic
- **Max Retries**: 3
- **Retry Delay**: 2 seconds
- **Exponential Backoff**: Yes
- **Timeout Handling**: Graceful degradation

## Security Considerations

1. **API Key Authentication**
2. **Input Validation and Sanitization**
3. **Rate Limiting**
4. **Request Logging**
5. **Response Caching**
6. **Error Message Sanitization**

## Performance Optimization

1. **Response Caching** for similar requests
2. **Batch Processing** for multiple questions
3. **Async Processing** for large requests
4. **Connection Pooling**
5. **Response Compression**

## Monitoring and Logging

1. **Request/Response Logging**
2. **Performance Metrics**
3. **Error Tracking**
4. **Usage Analytics**
5. **Quality Metrics Tracking**
