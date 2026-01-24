# N8N Workflow Setup Guide

## Overview
This guide explains how to set up and configure the N8N workflows for the AI-powered exam system.

## Prerequisites

1. **N8N Instance**: Running N8N server (local or cloud)
2. **OpenAI API Key**: Valid OpenAI API key with GPT-4 access
3. **Node.js**: Version 16 or higher
4. **Database**: PostgreSQL database (Supabase)

## Installation Steps

### 1. Install N8N

#### Option A: Local Installation
```bash
npm install -g n8n
n8n start
```

#### Option B: Docker Installation
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

#### Option C: N8N Cloud
Sign up at [n8n.cloud](https://n8n.cloud) for hosted N8N.

### 2. Access N8N Interface

Open your browser and navigate to:
- **Local**: `http://localhost:5678`
- **Docker**: `http://localhost:5678`
- **Cloud**: Your N8N cloud URL

### 3. Import Workflows

1. **Login to N8N** with your credentials
2. **Click "Import from File"** in the workflows page
3. **Import each workflow file**:
   - `question-generation-workflow.json`
   - `answer-evaluation-workflow.json`
   - `quality-assessment-workflow.json`

### 4. Configure OpenAI Credentials

1. **Go to Credentials** in N8N
2. **Click "Add Credential"**
3. **Select "OpenAI"**
4. **Enter your OpenAI API Key**
5. **Name it "OpenAI API"**
6. **Save the credential**

### 5. Configure Webhook URLs

After importing workflows, note the webhook URLs:

- **Question Generation**: `http://your-n8n-url/webhook/generate-questions`
- **Answer Evaluation**: `http://your-n8n-url/webhook/evaluate-answer`
- **Quality Assessment**: `http://your-n8n-url/webhook/assess-quality`

### 6. Update Environment Variables

Add these to your `.env` file:

```env
# N8N Configuration
REACT_APP_N8N_BASE_URL=http://localhost:5678
REACT_APP_N8N_API_KEY=your-n8n-api-key

# OpenAI Configuration (if not already set)
OPENAI_API_KEY=your-openai-api-key
```

## Workflow Details

### 1. Question Generation Workflow

**Purpose**: Generate exam questions based on job descriptions

**Input**:
- Job description data
- Generation configuration
- Topic distribution
- Input method (existing JD, upload, manual, custom)

**Output**:
- Array of generated questions
- Generation metadata
- Quality scores

**Webhook URL**: `/webhook/generate-questions`

### 2. Answer Evaluation Workflow

**Purpose**: Evaluate candidate text answers using AI

**Input**:
- Question details
- Candidate answer
- Correct answer
- Evaluation criteria

**Output**:
- Score and percentage
- Detailed feedback
- Keywords analysis
- Confidence score

**Webhook URL**: `/webhook/evaluate-answer`

### 3. Quality Assessment Workflow

**Purpose**: Assess question quality and detect biases

**Input**:
- Question text
- Question type and difficulty
- Correct answer
- MCQ options (if applicable)

**Output**:
- Quality score
- Issues and suggestions
- Bias detection
- Difficulty validation

**Webhook URL**: `/webhook/assess-quality`

## Testing Workflows

### 1. Test Question Generation

```bash
curl -X POST http://localhost:5678/webhook/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": {
      "title": "Frontend Developer",
      "description": "Develop user interfaces using React",
      "required_skills": ["React", "JavaScript", "CSS"],
      "preferred_skills": ["TypeScript", "Next.js"],
      "experience_level": "mid-level",
      "employment_type": "full-time",
      "technical_stack": ["React", "JavaScript", "CSS"],
      "key_responsibilities": ["Develop UI", "Optimize performance"],
      "education_requirements": "Bachelor degree"
    },
    "generation_config": {
      "total_questions": 5,
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
          "name": "React",
          "weight": 50,
          "min_questions": 2,
          "max_questions": 3
        }
      ]
    },
    "input_method": "existing_jd",
    "source_info": {}
  }'
```

### 2. Test Answer Evaluation

```bash
curl -X POST http://localhost:5678/webhook/evaluate-answer \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "test-1",
    "question_text": "What is React?",
    "correct_answer": "React is a JavaScript library for building user interfaces",
    "candidate_answer": "React is a frontend framework for building web applications",
    "question_type": "text",
    "difficulty_level": "easy",
    "points": 2,
    "evaluation_criteria": {
      "accuracy_weight": 0.4,
      "completeness_weight": 0.3,
      "clarity_weight": 0.2,
      "example_weight": 0.1
    }
  }'
```

### 3. Test Quality Assessment

```bash
curl -X POST http://localhost:5678/webhook/assess-quality \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "What is the time complexity of binary search?",
    "question_type": "mcq",
    "difficulty_level": "medium",
    "topic": "Algorithms",
    "mcq_options": [
      {"option": "A", "text": "O(n)"},
      {"option": "B", "text": "O(log n)"},
      {"option": "C", "text": "O(n log n)"},
      {"option": "D", "text": "O(1)"}
    ],
    "correct_answer": "B"
  }'
```

## Monitoring and Maintenance

### 1. Workflow Monitoring

- **Check execution logs** in N8N interface
- **Monitor success rates** and error patterns
- **Set up alerts** for failed executions
- **Track response times** and performance

### 2. Error Handling

- **Review error logs** regularly
- **Update prompts** based on common failures
- **Adjust validation rules** as needed
- **Monitor OpenAI API usage** and limits

### 3. Performance Optimization

- **Cache responses** for similar requests
- **Optimize prompts** for better results
- **Batch process** multiple questions
- **Monitor API costs** and usage

## Security Considerations

### 1. API Security

- **Use HTTPS** for production
- **Implement rate limiting**
- **Validate all inputs**
- **Sanitize outputs**

### 2. Data Privacy

- **Don't log sensitive data**
- **Use secure connections**
- **Implement access controls**
- **Regular security audits**

### 3. OpenAI API Security

- **Rotate API keys** regularly
- **Monitor usage** and costs
- **Set usage limits**
- **Use environment variables**

## Troubleshooting

### Common Issues

1. **Workflow not triggering**
   - Check webhook URL configuration
   - Verify N8N is running
   - Check firewall settings

2. **OpenAI API errors**
   - Verify API key is valid
   - Check API usage limits
   - Ensure sufficient credits

3. **JSON parsing errors**
   - Validate input format
   - Check prompt structure
   - Review AI response format

4. **Performance issues**
   - Monitor response times
   - Check OpenAI API latency
   - Optimize prompt length

### Debug Steps

1. **Check N8N execution logs**
2. **Test individual nodes**
3. **Validate input data**
4. **Review AI responses**
5. **Check network connectivity**

## Production Deployment

### 1. Environment Setup

- **Use production N8N instance**
- **Configure proper domain and SSL**
- **Set up monitoring and logging**
- **Implement backup strategies**

### 2. Scaling Considerations

- **Load balancing** for high traffic
- **Database optimization**
- **Caching strategies**
- **API rate limiting**

### 3. Maintenance

- **Regular updates** of N8N and workflows
- **Monitor performance** metrics
- **Backup workflows** and configurations
- **Update documentation**

## Support and Resources

- **N8N Documentation**: https://docs.n8n.io
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **Community Forum**: https://community.n8n.io
- **GitHub Issues**: Report bugs and feature requests
