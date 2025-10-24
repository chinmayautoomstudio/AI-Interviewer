# Improved n8n Workflow: Agent Identification Before Merge

## Current Problem
The Merge node combines all agent responses without identifying which agent produced each response, making it impossible to track the source of each question.

## Solution: Add Agent Identification Before Merge

### 1. **Add "Set" Node After Each AI Agent**

Instead of merging directly, add a "Set" node after each AI Agent to add identification:

#### After Technical MCQ Agent:
```json
{
  "name": "Set Technical MCQ ID",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Technical MCQ Questions"
        },
        {
          "name": "agent_type", 
          "value": "mcq"
        },
        {
          "name": "agent_category",
          "value": "technical"
        },
        {
          "name": "agent_index",
          "value": 0
        }
      ]
    },
    "options": {}
  }
}
```

#### After Technical Text Agent:
```json
{
  "name": "Set Technical Text ID",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Technical Text Questions"
        },
        {
          "name": "agent_type",
          "value": "text"
        },
        {
          "name": "agent_category", 
          "value": "technical"
        },
        {
          "name": "agent_index",
          "value": 1
        }
      ]
    },
    "options": {}
  }
}
```

#### After Aptitude MCQ Agent:
```json
{
  "name": "Set Aptitude MCQ ID",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Aptitude MCQ Questions"
        },
        {
          "name": "agent_type",
          "value": "mcq"
        },
        {
          "name": "agent_category",
          "value": "aptitude"
        },
        {
          "name": "agent_index",
          "value": 2
        }
      ]
    },
    "options": {}
  }
}
```

#### After Aptitude Text Agent:
```json
{
  "name": "Set Aptitude Text ID",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Aptitude Text Questions"
        },
        {
          "name": "agent_type",
          "value": "text"
        },
        {
          "name": "agent_category",
          "value": "aptitude"
        },
        {
          "name": "agent_index",
          "value": 3
        }
      ]
    },
    "options": {}
  }
}
```

### 2. **Updated Workflow Structure**

```
Webhook Trigger
    ↓
Validate Input
    ↓
Edit Fields
    ↓
Code (Distribution Logic)
    ↓
    ├── AI Technical MCQ Agent → Set Technical MCQ ID → Merge
    ├── AI Technical Text Agent → Set Technical Text ID → Merge  
    ├── AI Aptitude MCQ Agent → Set Aptitude MCQ ID → Merge
    └── AI Aptitude Text Agent → Set Aptitude Text ID → Merge
    ↓
Parse & Validate Response (Enhanced Parser)
    ↓
Success Response / Error Response
```

### 3. **Alternative: Use "Edit Fields" Node**

If you prefer using "Edit Fields" instead of "Set":

#### Technical MCQ Edit Fields:
```json
{
  "name": "Edit Technical MCQ Fields",
  "type": "n8n-nodes-base.editFields",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Technical MCQ Questions"
        },
        {
          "name": "agent_type",
          "value": "mcq"
        },
        {
          "name": "agent_category",
          "value": "technical"
        },
        {
          "name": "agent_index",
          "value": 0
        }
      ]
    },
    "options": {}
  }
}
```

### 4. **Updated Merge Node Configuration**

The Merge node will now receive responses with identification:

```json
{
  "name": "Merge Agent Responses",
  "type": "n8n-nodes-base.merge",
  "parameters": {
    "mode": "append",
    "options": {}
  }
}
```

**Input Structure After Merge:**
```json
[
  {
    "output": "{\"generated_questions\": [...]}",
    "agent_name": "Technical MCQ Questions",
    "agent_type": "mcq",
    "agent_category": "technical",
    "agent_index": 0
  },
  {
    "output": "{\"generated_questions\": [...]}",
    "agent_name": "Technical Text Questions", 
    "agent_type": "text",
    "agent_category": "technical",
    "agent_index": 1
  },
  {
    "output": "{\"generated_questions\": [...]}",
    "agent_name": "Aptitude MCQ Questions",
    "agent_type": "mcq", 
    "agent_category": "aptitude",
    "agent_index": 2
  },
  {
    "output": "{\"generated_questions\": [...]}",
    "agent_name": "Aptitude Text Questions",
    "agent_type": "text",
    "agent_category": "aptitude", 
    "agent_index": 3
  }
]
```

### 5. **Enhanced Parser Usage**

Use the new `enhanced_multi_agent_parser_with_identification.js` which:
- Reads agent identification from each response
- Validates questions against expected agent types
- Provides detailed agent performance statistics
- Adds agent source metadata to each question

### 6. **Benefits of This Approach**

1. **Clear Agent Identification**: Each response is tagged with agent information
2. **Better Error Tracking**: Know exactly which agent failed
3. **Performance Monitoring**: Track each agent's success rate
4. **Data Integrity**: Validate questions against agent specialization
5. **Debugging**: Easier to identify issues with specific agents

### 7. **Implementation Steps**

1. **Add Set/Edit Fields nodes** after each AI Agent
2. **Configure agent identification** for each node
3. **Update Merge node** to append responses
4. **Replace current parser** with enhanced version
5. **Test workflow** to verify agent identification

### 8. **Expected Output**

After implementation, each question will have:
```json
{
  "question_text": "Question here",
  "question_type": "mcq",
  "question_category": "technical",
  "_agent_source": "Technical MCQ Questions",
  "_agent_index": 0,
  "_metadata": {
    "agent_source": "Technical MCQ Questions",
    "agent_index": 0,
    "parser_version": "2.1.0",
    "parsed_at": "2024-01-15T10:30:00Z"
  }
}
```

This approach ensures you can always track which agent generated each question and provides comprehensive monitoring of the multi-agent system.
