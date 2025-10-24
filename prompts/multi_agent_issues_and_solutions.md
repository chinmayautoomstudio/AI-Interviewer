# Multi-Agent System Issues and Solutions

## Current Problems Identified

### 1. **Agent Response Format Issue**
- **Problem**: Each agent is returning a JSON string instead of a JSON object
- **Current Format**: `"Technical MCQ Questions": "{\"generated_questions\": [...]}"`
- **Expected Format**: `"Technical MCQ Questions": {"generated_questions": [...]}`

### 2. **Agent Specialization Failure**
- **Problem**: Agents are generating wrong question types
- **Examples**:
  - Technical Text agent generating MCQ questions
  - Aptitude agents generating technical questions
  - All agents generating same questions

### 3. **Response Parsing Issues**
- **Problem**: Current parser expects single JSON object
- **Reality**: Receives array of objects with stringified JSON responses

## Root Causes

### 1. **n8n AI Agent Configuration**
The AI agents in n8n are likely configured incorrectly:
- **System Message**: Not specifying output format clearly
- **Response Format**: Agents returning stringified JSON instead of objects
- **Tool Usage**: Agents not using specialized prompts properly

### 2. **Agent Prompt Issues**
Each agent needs specific instructions:
- **Technical MCQ Agent**: Should only generate technical MCQ questions
- **Technical Text Agent**: Should only generate technical text questions  
- **Aptitude MCQ Agent**: Should only generate aptitude MCQ questions
- **Aptitude Text Agent**: Should only generate aptitude text questions

### 3. **n8n Workflow Configuration**
The workflow needs proper configuration:
- **Response Format**: Set to "JSON" not "Text"
- **Structured Output**: Use Structured Output Parser
- **Agent Isolation**: Ensure each agent gets correct input

## Solutions

### 1. **Update n8n AI Agent Configuration**

For each agent, update the system message:

```json
{
  "system_message": "You are a specialized question generator for [AGENT_TYPE]. You MUST return a valid JSON object with the following structure: {\"generated_questions\": [...]}. Do NOT return a JSON string. Generate exactly [COUNT] questions of type [QUESTION_TYPE] for category [CATEGORY].",
  "response_format": "JSON",
  "temperature": 0.7,
  "max_tokens": 4000
}
```

### 2. **Fix Agent Specialization**

**Technical MCQ Agent**:
```json
{
  "system_message": "You are a Technical MCQ Question Generator. Generate exactly {count} technical multiple-choice questions. Each question must have question_type: 'mcq' and question_category: 'technical'. Return valid JSON object, not string.",
  "response_format": "JSON"
}
```

**Technical Text Agent**:
```json
{
  "system_message": "You are a Technical Text Question Generator. Generate exactly {count} technical text-based questions. Each question must have question_type: 'text' and question_category: 'technical'. Return valid JSON object, not string.",
  "response_format": "JSON"
}
```

**Aptitude MCQ Agent**:
```json
{
  "system_message": "You are an Aptitude MCQ Question Generator. Generate exactly {count} aptitude multiple-choice questions. Each question must have question_type: 'mcq' and question_category: 'aptitude'. Return valid JSON object, not string.",
  "response_format": "JSON"
}
```

**Aptitude Text Agent**:
```json
{
  "system_message": "You are an Aptitude Text Question Generator. Generate exactly {count} aptitude text-based questions. Each question must have question_type: 'text' and question_category: 'aptitude'. Return valid JSON object, not string.",
  "response_format": "JSON"
}
```

### 3. **Update n8n Workflow**

Add Structured Output Parser after each AI Agent:

```json
{
  "name": "Structured Output Parser - Technical MCQ",
  "type": "n8n-nodes-base.structuredOutputParser",
  "parameters": {
    "schema": {
      "type": "object",
      "properties": {
        "generated_questions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "question_text": {"type": "string"},
              "question_type": {"type": "string", "enum": ["mcq"]},
              "question_category": {"type": "string", "enum": ["technical"]},
              "difficulty_level": {"type": "string", "enum": ["easy", "medium", "hard"]},
              "topic": {"type": "string"},
              "subtopic": {"type": "string"},
              "points": {"type": "number"},
              "time_limit_seconds": {"type": "number"},
              "mcq_options": {"type": "array"},
              "correct_answer": {"type": "string"},
              "answer_explanation": {"type": "string"},
              "tags": {"type": "array"},
              "job_relevance": {"type": "string"}
            },
            "required": ["question_text", "question_type", "question_category", "difficulty_level", "topic", "points", "time_limit_seconds", "correct_answer", "answer_explanation", "tags", "job_relevance"]
          }
        }
      },
      "required": ["generated_questions"]
    }
  }
}
```

### 4. **Update Response Parser**

Use the new `multi_agent_response_parser.js` which:
- Handles JSON string responses from agents
- Validates question types and categories
- Fixes mismatched question types
- Provides comprehensive error reporting
- Returns properly formatted questions

### 5. **Testing Steps**

1. **Test Individual Agents**:
   - Send test requests to each agent
   - Verify response format (JSON object, not string)
   - Check question type and category

2. **Test Multi-Agent Workflow**:
   - Run complete workflow
   - Verify all agents respond
   - Check final question distribution

3. **Test Response Parser**:
   - Feed multi-agent response to parser
   - Verify all questions are extracted
   - Check metadata generation

## Implementation Priority

1. **High Priority**: Fix agent response format (JSON object vs string)
2. **High Priority**: Fix agent specialization (correct question types)
3. **Medium Priority**: Update response parser
4. **Low Priority**: Add comprehensive error handling

## Expected Outcome

After implementing these fixes:
- Each agent returns proper JSON objects
- Agents generate correct question types
- Response parser handles multi-agent format
- Final output contains properly categorized questions
- Comprehensive metadata and error reporting
