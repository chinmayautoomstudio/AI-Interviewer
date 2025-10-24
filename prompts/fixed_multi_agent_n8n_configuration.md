# Fixed Multi-Agent n8n Workflow Configuration

## Updated AI Agent System Messages

### 1. Technical MCQ Agent
```json
{
  "name": "Technical MCQ Agent",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "model": "gpt-4",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "You are a specialized Technical MCQ Question Generator. Your task is to generate exactly {count} technical multiple-choice questions based on the provided job description and configuration.\n\nCRITICAL REQUIREMENTS:\n1. Return a valid JSON OBJECT, not a JSON string\n2. Each question must have question_type: 'mcq'\n3. Each question must have question_category: 'technical'\n4. Generate questions relevant to the job description\n5. Include proper MCQ options (A, B, C, D)\n6. Provide detailed explanations\n\nOUTPUT FORMAT:\n{\n  \"generated_questions\": [\n    {\n      \"question_text\": \"Question here\",\n      \"question_type\": \"mcq\",\n      \"question_category\": \"technical\",\n      \"difficulty_level\": \"easy|medium|hard\",\n      \"topic\": \"Topic name\",\n      \"subtopic\": \"Subtopic name\",\n      \"points\": 2,\n      \"time_limit_seconds\": 60,\n      \"mcq_options\": [\n        {\"option\": \"A\", \"text\": \"Option A\"},\n        {\"option\": \"B\", \"text\": \"Option B\"},\n        {\"option\": \"C\", \"text\": \"Option C\"},\n        {\"option\": \"D\", \"text\": \"Option D\"}\n      ],\n      \"correct_answer\": \"A\",\n      \"answer_explanation\": \"Explanation here\",\n      \"tags\": [\"tag1\", \"tag2\"],\n      \"job_relevance\": \"Relevance explanation\"\n    }\n  ]\n}\n\nGenerate exactly {count} questions with difficulty distribution: {difficulty_distribution}"
        }
      ]
    },
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

### 2. Technical Text Agent
```json
{
  "name": "Technical Text Agent",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "model": "gpt-4",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "You are a specialized Technical Text Question Generator. Your task is to generate exactly {count} technical text-based questions based on the provided job description and configuration.\n\nCRITICAL REQUIREMENTS:\n1. Return a valid JSON OBJECT, not a JSON string\n2. Each question must have question_type: 'text'\n3. Each question must have question_category: 'technical'\n4. Generate questions relevant to the job description\n5. NO MCQ options (empty array)\n6. Provide detailed explanations\n\nOUTPUT FORMAT:\n{\n  \"generated_questions\": [\n    {\n      \"question_text\": \"Question here\",\n      \"question_type\": \"text\",\n      \"question_category\": \"technical\",\n      \"difficulty_level\": \"easy|medium|hard\",\n      \"topic\": \"Topic name\",\n      \"subtopic\": \"Subtopic name\",\n      \"points\": 4,\n      \"time_limit_seconds\": 120,\n      \"mcq_options\": [],\n      \"correct_answer\": \"Expected answer here\",\n      \"answer_explanation\": \"Explanation here\",\n      \"tags\": [\"tag1\", \"tag2\"],\n      \"job_relevance\": \"Relevance explanation\"\n    }\n  ]\n}\n\nGenerate exactly {count} questions with difficulty distribution: {difficulty_distribution}"
        }
      ]
    },
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

### 3. Aptitude MCQ Agent
```json
{
  "name": "Aptitude MCQ Agent",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "model": "gpt-4",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "You are a specialized Aptitude MCQ Question Generator. Your task is to generate exactly {count} aptitude multiple-choice questions.\n\nCRITICAL REQUIREMENTS:\n1. Return a valid JSON OBJECT, not a JSON string\n2. Each question must have question_type: 'mcq'\n3. Each question must have question_category: 'aptitude'\n4. Generate general aptitude questions (logical reasoning, quantitative, verbal)\n5. Include proper MCQ options (A, B, C, D)\n6. Provide detailed explanations\n\nOUTPUT FORMAT:\n{\n  \"generated_questions\": [\n    {\n      \"question_text\": \"Question here\",\n      \"question_type\": \"mcq\",\n      \"question_category\": \"aptitude\",\n      \"difficulty_level\": \"easy|medium|hard\",\n      \"topic\": \"Logical Reasoning|Quantitative Aptitude|Verbal Ability\",\n      \"subtopic\": \"Subtopic name\",\n      \"points\": 2,\n      \"time_limit_seconds\": 60,\n      \"mcq_options\": [\n        {\"option\": \"A\", \"text\": \"Option A\"},\n        {\"option\": \"B\", \"text\": \"Option B\"},\n        {\"option\": \"C\", \"text\": \"Option C\"},\n        {\"option\": \"D\", \"text\": \"Option D\"}\n      ],\n      \"correct_answer\": \"A\",\n      \"answer_explanation\": \"Explanation here\",\n      \"tags\": [\"tag1\", \"tag2\"],\n      \"job_relevance\": \"Relevance explanation\"\n    }\n  ]\n}\n\nGenerate exactly {count} questions with difficulty distribution: {difficulty_distribution}"
        }
      ]
    },
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

### 4. Aptitude Text Agent
```json
{
  "name": "Aptitude Text Agent",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "model": "gpt-4",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "You are a specialized Aptitude Text Question Generator. Your task is to generate exactly {count} aptitude text-based questions.\n\nCRITICAL REQUIREMENTS:\n1. Return a valid JSON OBJECT, not a JSON string\n2. Each question must have question_type: 'text'\n3. Each question must have question_category: 'aptitude'\n4. Generate general aptitude questions (logical reasoning, quantitative, verbal)\n5. NO MCQ options (empty array)\n6. Provide detailed explanations\n\nOUTPUT FORMAT:\n{\n  \"generated_questions\": [\n    {\n      \"question_text\": \"Question here\",\n      \"question_type\": \"text\",\n      \"question_category\": \"aptitude\",\n      \"difficulty_level\": \"easy|medium|hard\",\n      \"topic\": \"Logical Reasoning|Quantitative Aptitude|Verbal Ability|Data Interpretation\",\n      \"subtopic\": \"Subtopic name\",\n      \"points\": 4,\n      \"time_limit_seconds\": 120,\n      \"mcq_options\": [],\n      \"correct_answer\": \"Expected answer here\",\n      \"answer_explanation\": \"Explanation here\",\n      \"tags\": [\"tag1\", \"tag2\"],\n      \"job_relevance\": \"Relevance explanation\"\n    }\n  ]\n}\n\nGenerate exactly {count} questions with difficulty distribution: {difficulty_distribution}"
        }
      ]
    },
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

## Updated Structured Output Parser Schemas

### Technical MCQ Schema
```json
{
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
          "mcq_options": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "option": {"type": "string"},
                "text": {"type": "string"}
              }
            }
          },
          "correct_answer": {"type": "string"},
          "answer_explanation": {"type": "string"},
          "tags": {"type": "array"},
          "job_relevance": {"type": "string"}
        },
        "required": ["question_text", "question_type", "question_category", "difficulty_level", "topic", "points", "time_limit_seconds", "mcq_options", "correct_answer", "answer_explanation", "tags", "job_relevance"]
      }
    }
  },
  "required": ["generated_questions"]
}
```

### Technical Text Schema
```json
{
  "type": "object",
  "properties": {
    "generated_questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question_text": {"type": "string"},
          "question_type": {"type": "string", "enum": ["text"]},
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
        "required": ["question_text", "question_type", "question_category", "difficulty_level", "topic", "points", "time_limit_seconds", "mcq_options", "correct_answer", "answer_explanation", "tags", "job_relevance"]
      }
    }
  },
  "required": ["generated_questions"]
}
```

### Aptitude MCQ Schema
```json
{
  "type": "object",
  "properties": {
    "generated_questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question_text": {"type": "string"},
          "question_type": {"type": "string", "enum": ["mcq"]},
          "question_category": {"type": "string", "enum": ["aptitude"]},
          "difficulty_level": {"type": "string", "enum": ["easy", "medium", "hard"]},
          "topic": {"type": "string", "enum": ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability"]},
          "subtopic": {"type": "string"},
          "points": {"type": "number"},
          "time_limit_seconds": {"type": "number"},
          "mcq_options": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "option": {"type": "string"},
                "text": {"type": "string"}
              }
            }
          },
          "correct_answer": {"type": "string"},
          "answer_explanation": {"type": "string"},
          "tags": {"type": "array"},
          "job_relevance": {"type": "string"}
        },
        "required": ["question_text", "question_type", "question_category", "difficulty_level", "topic", "points", "time_limit_seconds", "mcq_options", "correct_answer", "answer_explanation", "tags", "job_relevance"]
      }
    }
  },
  "required": ["generated_questions"]
}
```

### Aptitude Text Schema
```json
{
  "type": "object",
  "properties": {
    "generated_questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question_text": {"type": "string"},
          "question_type": {"type": "string", "enum": ["text"]},
          "question_category": {"type": "string", "enum": ["aptitude"]},
          "difficulty_level": {"type": "string", "enum": ["easy", "medium", "hard"]},
          "topic": {"type": "string", "enum": ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Data Interpretation"]},
          "subtopic": {"type": "string"},
          "points": {"type": "number"},
          "time_limit_seconds": {"type": "number"},
          "mcq_options": {"type": "array"},
          "correct_answer": {"type": "string"},
          "answer_explanation": {"type": "string"},
          "tags": {"type": "array"},
          "job_relevance": {"type": "string"}
        },
        "required": ["question_text", "question_type", "question_category", "difficulty_level", "topic", "points", "time_limit_seconds", "mcq_options", "correct_answer", "answer_explanation", "tags", "job_relevance"]
      }
    }
  },
  "required": ["generated_questions"]
}
```

## Workflow Configuration Steps

1. **Update each AI Agent** with the new system messages
2. **Add Structured Output Parser** after each AI Agent
3. **Configure response format** to "JSON" for each agent
4. **Test individual agents** before testing the full workflow
5. **Use the new multi_agent_response_parser.js** for final response processing

## Key Changes Made

1. **Explicit JSON Object Requirement**: Each agent now explicitly instructed to return JSON objects, not strings
2. **Strict Question Type Validation**: Each agent has enum constraints for question_type and question_category
3. **Specialized Prompts**: Each agent has specific instructions for their question type
4. **Comprehensive Schemas**: Structured Output Parser enforces correct format
5. **Error Handling**: New parser handles malformed responses gracefully
