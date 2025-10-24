# Updated Parse & Validate Response Code for Named Agent Responses

## Current Response Format
Your responses now have agent names as keys with JSON strings as values:
```json
[
  {
    "AI Technical MCQ Questions": "{\"generated_questions\": [...]}"
  },
  {
    "AI Technical Text Questions": "{\"generated_questions\": [...]}"
  },
  {
    "AI Aptitude MCQ Questions": "{\"generated_questions\": [...]}"
  },
  {
    "AI Aptitude Text Questions": "{\"generated_questions\": [...]}"
  }
]
```

## Updated Parser Code

```javascript
// Enhanced parser for named agent responses
const items = $input.all();

console.log('🔍 Processing named agent responses:', {
  totalResponses: items.length,
  agentNames: items.map(item => Object.keys(item.json)[0])
});

const allQuestions = [];
const agentErrors = [];
const agentStats = {};

// Define expected agent mapping
const agentMapping = {
  'AI Technical MCQ Questions': { expectedType: 'mcq', expectedCategory: 'technical' },
  'AI Technical Text Questions': { expectedType: 'text', expectedCategory: 'technical' },
  'AI Aptitude MCQ Questions': { expectedType: 'mcq', expectedCategory: 'aptitude' },
  'AI Aptitude Text Questions': { expectedType: 'text', expectedCategory: 'aptitude' }
};

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const agentName = Object.keys(item.json)[0];
  const agentInfo = agentMapping[agentName] || { expectedType: 'unknown', expectedCategory: 'unknown' };
  
  try {
    console.log(`📋 Processing ${agentName}...`);
    
    // Step 1: Extract the JSON string from the agent name key
    const rawJsonString = item.json[agentName];
    
    if (!rawJsonString) {
      throw new Error(`No data found for agent: ${agentName}`);
    }
    
    // Step 2: Parse the stringified JSON safely
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawJsonString);
    } catch (parseError) {
      console.error(`❌ Failed to parse ${agentName}:`, parseError.message);
      agentErrors.push({
        agent: agentName,
        error: `JSON Parse Error: ${parseError.message}`,
        rawResponse: rawJsonString.substring(0, 200) + '...'
      });
      continue;
    }
    
    // Step 3: Validate structure
    if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
      console.error(`❌ Invalid structure for ${agentName}: missing generated_questions array`);
      agentErrors.push({
        agent: agentName,
        error: 'Missing or invalid generated_questions array',
        structure: Object.keys(parsedResponse)
      });
      continue;
    }
    
    // Step 4: Validate and clean questions with agent-specific validation
    const validQuestions = parsedResponse.generated_questions.filter(question => {
      // Basic validation
      if (!question.question_text || !question.question_type || !question.question_category) {
        console.warn(`⚠️ Invalid question in ${agentName}:`, {
          hasText: !!question.question_text,
          hasType: !!question.question_type,
          hasCategory: !!question.question_category
        });
        return false;
      }
      
      // Agent-specific validation and correction
      if (question.question_type !== agentInfo.expectedType) {
        console.warn(`⚠️ Question type mismatch in ${agentName}: expected ${agentInfo.expectedType}, got ${question.question_type}`);
        question.question_type = agentInfo.expectedType;
      }
      
      if (question.question_category !== agentInfo.expectedCategory) {
        console.warn(`⚠️ Question category mismatch in ${agentName}: expected ${agentInfo.expectedCategory}, got ${question.question_category}`);
        question.question_category = agentInfo.expectedCategory;
      }
      
      // Add agent source metadata
      question._agent_source = agentName;
      question._agent_index = i;
      
      return true;
    });
    
    // Step 5: Update agent statistics
    agentStats[agentName] = {
      totalGenerated: parsedResponse.generated_questions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: parsedResponse.generated_questions.length - validQuestions.length,
      expectedType: agentInfo.expectedType,
      expectedCategory: agentInfo.expectedCategory,
      metadata: parsedResponse.generation_metadata || {}
    };
    
    console.log(`✅ ${agentName}: ${validQuestions.length} valid questions`);
    allQuestions.push(...validQuestions);
    
  } catch (error) {
    console.error(`❌ Error processing ${agentName}:`, error.message);
    agentErrors.push({
      agent: agentName,
      error: error.message,
      stack: error.stack
    });
  }
}

// Step 6: Generate comprehensive metadata
const metadata = {
  total_questions: allQuestions.length,
  technical_count: allQuestions.filter(q => q.question_category === 'technical').length,
  aptitude_count: allQuestions.filter(q => q.question_category === 'aptitude').length,
  mcq_count: allQuestions.filter(q => q.question_type === 'mcq').length,
  text_count: allQuestions.filter(q => q.question_type === 'text').length,
  difficulty_breakdown: {
    easy: allQuestions.filter(q => q.difficulty_level === 'easy').length,
    medium: allQuestions.filter(q => q.difficulty_level === 'medium').length,
    hard: allQuestions.filter(q => q.difficulty_level === 'hard').length
  },
  topic_distribution: {},
  agent_performance: {
    total_agents: Object.keys(agentMapping).length,
    successful_agents: Object.keys(agentMapping).length - agentErrors.length,
    failed_agents: agentErrors.length,
    agent_stats: agentStats,
    errors: agentErrors
  },
  generation_time: new Date().toISOString(),
  parser_version: '2.2.0'
};

// Calculate topic distribution
allQuestions.forEach(question => {
  const topic = question.topic || 'Unknown';
  metadata.topic_distribution[topic] = (metadata.topic_distribution[topic] || 0) + 1;
});

// Step 7: Validate final output
if (allQuestions.length === 0) {
  throw new Error(`No valid questions generated. Agent errors: ${JSON.stringify(agentErrors)}`);
}

console.log('📊 Final Statistics:', {
  totalQuestions: allQuestions.length,
  technicalQuestions: metadata.technical_count,
  aptitudeQuestions: metadata.aptitude_count,
  mcqQuestions: metadata.mcq_count,
  textQuestions: metadata.text_count,
  agentErrors: agentErrors.length,
  agentStats: agentStats
});

// Step 8: Return questions with enhanced metadata
// Return as n8n expects - each question as separate item
return allQuestions.map(question => ({ 
  json: {
    ...question,
    _metadata: {
      agent_source: question._agent_source,
      agent_index: question._agent_index,
      parser_version: '2.2.0',
      parsed_at: new Date().toISOString()
    }
  }
}));
```

## Key Changes Made

1. **Agent Name Extraction**: `Object.keys(item.json)[0]` to get the agent name
2. **JSON String Extraction**: `item.json[agentName]` to get the JSON string
3. **Agent Mapping**: Added mapping for expected question types and categories
4. **Validation**: Added agent-specific validation and correction
5. **Metadata**: Added agent source tracking to each question
6. **Error Handling**: Enhanced error reporting with agent identification

## Expected Output

Each question will now have:
```json
{
  "question_text": "Question here",
  "question_type": "mcq",
  "question_category": "technical",
  "_agent_source": "AI Technical MCQ Questions",
  "_agent_index": 0,
  "_metadata": {
    "agent_source": "AI Technical MCQ Questions",
    "agent_index": 0,
    "parser_version": "2.2.0",
    "parsed_at": "2024-01-15T10:30:00Z"
  }
}
```

## Benefits

1. **Agent Identification**: Each question tagged with its source agent
2. **Data Validation**: Questions validated against agent specialization
3. **Error Tracking**: Clear error reporting by agent
4. **Performance Monitoring**: Agent statistics and success rates
5. **Data Integrity**: Automatic correction of mismatched question types

This parser handles your new response format and provides comprehensive agent tracking and validation.
