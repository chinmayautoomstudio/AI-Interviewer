# Simple Agent Identification Solution

## Quick Fix: Add Agent Names in Edit Fields Node

Since you're already using an "Edit Fields" node after the Merge, here's how to modify it to add agent identification:

### Current Edit Fields Node Configuration

```javascript
// In your Edit Fields node after Merge
// Add this code to identify each response by index

const items = $input.all();
const agentNames = [
  'Technical MCQ Questions',
  'Technical Text Questions', 
  'Aptitude MCQ Questions',
  'Aptitude Text Questions'
];

const processedItems = items.map((item, index) => {
  const agentName = agentNames[index] || `Unknown Agent ${index + 1}`;
  
  return {
    json: {
      ...item.json,
      agent_name: agentName,
      agent_index: index,
      agent_type: agentName.includes('MCQ') ? 'mcq' : 'text',
      agent_category: agentName.includes('Technical') ? 'technical' : 'aptitude'
    }
  };
});

return processedItems;
```

### Alternative: Use Set Node Before Merge

Add a "Set" node before each Merge input:

#### Set Node 1 (Technical MCQ):
```json
{
  "name": "Set Agent ID 1",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Technical MCQ Questions"
        },
        {
          "name": "agent_index",
          "value": 0
        }
      ]
    }
  }
}
```

#### Set Node 2 (Technical Text):
```json
{
  "name": "Set Agent ID 2", 
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Technical Text Questions"
        },
        {
          "name": "agent_index",
          "value": 1
        }
      ]
    }
  }
}
```

#### Set Node 3 (Aptitude MCQ):
```json
{
  "name": "Set Agent ID 3",
  "type": "n8n-nodes-base.set", 
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Aptitude MCQ Questions"
        },
        {
          "name": "agent_index",
          "value": 2
        }
      ]
    }
  }
}
```

#### Set Node 4 (Aptitude Text):
```json
{
  "name": "Set Agent ID 4",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "agent_name",
          "value": "Aptitude Text Questions"
        },
        {
          "name": "agent_index",
          "value": 3
        }
      ]
    }
  }
}
```

### Updated Workflow Structure

```
Webhook Trigger
    ↓
Validate Input
    ↓
Edit Fields
    ↓
Code (Distribution Logic)
    ↓
    ├── AI Technical MCQ Agent → Set Agent ID 1 → Merge
    ├── AI Technical Text Agent → Set Agent ID 2 → Merge
    ├── AI Aptitude MCQ Agent → Set Agent ID 3 → Merge
    └── AI Aptitude Text Agent → Set Agent ID 4 → Merge
    ↓
Edit Fields (Add Agent Names) ← Your current node
    ↓
Parse & Validate Response
    ↓
Success Response / Error Response
```

### Enhanced Parser for Identified Responses

Use this parser in your "Parse & Validate Response" node:

```javascript
// Enhanced parser that handles agent identification
const items = $input.all();

console.log('🔍 Processing identified agent responses:', {
  totalResponses: items.length,
  agentNames: items.map(item => item.json.agent_name)
});

const allQuestions = [];
const agentErrors = [];
const agentStats = {};

for (const item of items) {
  const agentName = item.json.agent_name || 'Unknown Agent';
  const agentIndex = item.json.agent_index || 0;
  
  try {
    console.log(`📋 Processing ${agentName}...`);
    
    // Parse the JSON string response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(item.json.output);
    } catch (parseError) {
      console.error(`❌ Failed to parse ${agentName}:`, parseError.message);
      agentErrors.push({
        agent: agentName,
        error: `JSON Parse Error: ${parseError.message}`
      });
      continue;
    }
    
    // Validate structure
    if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
      console.error(`❌ Invalid structure for ${agentName}: missing generated_questions array`);
      agentErrors.push({
        agent: agentName,
        error: 'Missing or invalid generated_questions array'
      });
      continue;
    }
    
    // Process questions with agent identification
    const validQuestions = parsedResponse.generated_questions.map(question => ({
      ...question,
      _agent_source: agentName,
      _agent_index: agentIndex,
      _metadata: {
        agent_source: agentName,
        agent_index: agentIndex,
        parsed_at: new Date().toISOString()
      }
    }));
    
    // Update agent statistics
    agentStats[agentName] = {
      totalGenerated: parsedResponse.generated_questions.length,
      validQuestions: validQuestions.length,
      metadata: parsedResponse.generation_metadata || {}
    };
    
    console.log(`✅ ${agentName}: ${validQuestions.length} questions`);
    allQuestions.push(...validQuestions);
    
  } catch (error) {
    console.error(`❌ Error processing ${agentName}:`, error.message);
    agentErrors.push({
      agent: agentName,
      error: error.message
    });
  }
}

// Generate metadata
const metadata = {
  total_questions: allQuestions.length,
  technical_count: allQuestions.filter(q => q.question_category === 'technical').length,
  aptitude_count: allQuestions.filter(q => q.question_category === 'aptitude').length,
  mcq_count: allQuestions.filter(q => q.question_type === 'mcq').length,
  text_count: allQuestions.filter(q => q.question_type === 'text').length,
  agent_performance: {
    total_agents: items.length,
    successful_agents: items.length - agentErrors.length,
    failed_agents: agentErrors.length,
    agent_stats: agentStats,
    errors: agentErrors
  },
  generation_time: new Date().toISOString()
};

console.log('📊 Final Statistics:', metadata);

// Return questions as separate items
return allQuestions.map(question => ({ json: question }));
```

### Benefits

1. **Minimal Changes**: Only need to modify existing Edit Fields node
2. **Clear Identification**: Each response tagged with agent name
3. **Better Tracking**: Know which agent generated each question
4. **Error Monitoring**: Track failures by agent
5. **Performance Stats**: Monitor each agent's performance

### Implementation

1. **Update your Edit Fields node** with the agent identification code
2. **Replace your current parser** with the enhanced version
3. **Test the workflow** to verify agent identification works
4. **Monitor agent performance** through the metadata

This solution provides clear agent identification without major workflow changes.
