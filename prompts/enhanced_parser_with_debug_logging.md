# Enhanced Parser with Debug Logging and Agent Status Tracking

```javascript
// Enhanced parser for named agent responses with comprehensive debugging
const items = $input.all();

console.log('🔍 Processing named agent responses:', {
  totalResponses: items.length,
  agentNames: items.map(item => Object.keys(item.json)[0]),
  timestamp: new Date().toISOString()
});

const allQuestions = [];
const agentErrors = [];
const agentStats = {};
const debugLog = [];

// Define expected agent mapping
const agentMapping = {
  'AI Technical MCQ Questions': { expectedType: 'mcq', expectedCategory: 'technical' },
  'AI Technical Text Questions': { expectedType: 'text', expectedCategory: 'technical' },
  'AI Aptitude MCQ Questions': { expectedType: 'mcq', expectedCategory: 'aptitude' },
  'AI Aptitude Text Questions': { expectedType: 'text', expectedCategory: 'aptitude' }
};

// Debug: Log initial setup
debugLog.push({
  step: 'initialization',
  message: 'Parser initialized successfully',
  totalAgents: Object.keys(agentMapping).length,
  expectedAgents: Object.keys(agentMapping),
  timestamp: new Date().toISOString()
});

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const agentName = Object.keys(item.json)[0];
  const agentInfo = agentMapping[agentName] || { expectedType: 'unknown', expectedCategory: 'unknown' };
  
  const agentDebug = {
    agentName,
    agentIndex: i,
    startTime: new Date().toISOString(),
    steps: []
  };
  
  try {
    console.log(`📋 Processing ${agentName}...`);
    agentDebug.steps.push({
      step: 'start_processing',
      message: `Started processing ${agentName}`,
      timestamp: new Date().toISOString()
    });
    
    // Step 1: Extract the JSON string from the agent name key
    const rawJsonString = item.json[agentName];
    
    if (!rawJsonString) {
      const error = `No data found for agent: ${agentName}`;
      console.error(`❌ ${error}`);
      agentDebug.steps.push({
        step: 'data_extraction',
        status: 'FAILED',
        message: error,
        timestamp: new Date().toISOString()
      });
      throw new Error(error);
    }
    
    agentDebug.steps.push({
      step: 'data_extraction',
      status: 'SUCCESS',
      message: `Data extracted for ${agentName}`,
      dataLength: rawJsonString.length,
      timestamp: new Date().toISOString()
    });
    
    // Step 2: Parse the stringified JSON safely
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawJsonString);
      agentDebug.steps.push({
        step: 'json_parsing',
        status: 'SUCCESS',
        message: `JSON parsed successfully for ${agentName}`,
        timestamp: new Date().toISOString()
      });
    } catch (parseError) {
      const error = `JSON Parse Error: ${parseError.message}`;
      console.error(`❌ Failed to parse ${agentName}:`, parseError.message);
      agentDebug.steps.push({
        step: 'json_parsing',
        status: 'FAILED',
        message: error,
        timestamp: new Date().toISOString()
      });
      agentErrors.push({
        agent: agentName,
        error: error,
        rawResponse: rawJsonString.substring(0, 200) + '...',
        debug: agentDebug
      });
      continue;
    }
    
    // Step 3: Validate structure
    if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
      const error = 'Missing or invalid generated_questions array';
      console.error(`❌ Invalid structure for ${agentName}: ${error}`);
      agentDebug.steps.push({
        step: 'structure_validation',
        status: 'FAILED',
        message: error,
        availableKeys: Object.keys(parsedResponse),
        timestamp: new Date().toISOString()
      });
      agentErrors.push({
        agent: agentName,
        error: error,
        structure: Object.keys(parsedResponse),
        debug: agentDebug
      });
      continue;
    }
    
    agentDebug.steps.push({
      step: 'structure_validation',
      status: 'SUCCESS',
      message: `Structure validated for ${agentName}`,
      questionsCount: parsedResponse.generated_questions.length,
      timestamp: new Date().toISOString()
    });
    
    // Step 4: Validate and clean questions with agent-specific validation
    const validQuestions = [];
    const invalidQuestions = [];
    
    parsedResponse.generated_questions.forEach((question, qIndex) => {
      const questionDebug = {
        questionIndex: qIndex,
        steps: []
      };
      
      // Basic validation
      if (!question.question_text || !question.question_type || !question.question_category) {
        const error = `Invalid question structure at index ${qIndex}`;
        console.warn(`⚠️ ${error} in ${agentName}:`, {
          hasText: !!question.question_text,
          hasType: !!question.question_type,
          hasCategory: !!question.question_category
        });
        questionDebug.steps.push({
          step: 'basic_validation',
          status: 'FAILED',
          message: error,
          details: {
            hasText: !!question.question_text,
            hasType: !!question.question_type,
            hasCategory: !!question.question_category
          }
        });
        invalidQuestions.push({ question, debug: questionDebug });
        return;
      }
      
      questionDebug.steps.push({
        step: 'basic_validation',
        status: 'SUCCESS',
        message: `Basic validation passed for question ${qIndex}`
      });
      
      // Agent-specific validation and correction
      let corrections = [];
      
      if (question.question_type !== agentInfo.expectedType) {
        const correction = `Question type corrected from ${question.question_type} to ${agentInfo.expectedType}`;
        console.warn(`⚠️ Question type mismatch in ${agentName}: expected ${agentInfo.expectedType}, got ${question.question_type}`);
        question.question_type = agentInfo.expectedType;
        corrections.push(correction);
      }
      
      if (question.question_category !== agentInfo.expectedCategory) {
        const correction = `Question category corrected from ${question.question_category} to ${agentInfo.expectedCategory}`;
        console.warn(`⚠️ Question category mismatch in ${agentName}: expected ${agentInfo.expectedCategory}, got ${question.question_category}`);
        question.question_category = agentInfo.expectedCategory;
        corrections.push(correction);
      }
      
      if (corrections.length > 0) {
        questionDebug.steps.push({
          step: 'agent_validation',
          status: 'CORRECTED',
          message: `Agent-specific corrections applied`,
          corrections: corrections
        });
      } else {
        questionDebug.steps.push({
          step: 'agent_validation',
          status: 'SUCCESS',
          message: `Agent-specific validation passed`
        });
      }
      
      // Add agent source metadata
      question._agent_source = agentName;
      question._agent_index = i;
      
      validQuestions.push({ question, debug: questionDebug });
    });
    
    agentDebug.steps.push({
      step: 'question_processing',
      status: 'SUCCESS',
      message: `Questions processed for ${agentName}`,
      validQuestions: validQuestions.length,
      invalidQuestions: invalidQuestions.length,
      timestamp: new Date().toISOString()
    });
    
    // Step 5: Update agent statistics
    agentStats[agentName] = {
      totalGenerated: parsedResponse.generated_questions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: invalidQuestions.length,
      expectedType: agentInfo.expectedType,
      expectedCategory: agentInfo.expectedCategory,
      metadata: parsedResponse.generation_metadata || {},
      debug: agentDebug,
      questionDebug: validQuestions.map(vq => vq.debug)
    };
    
    // Add valid questions to final output
    allQuestions.push(...validQuestions.map(vq => vq.question));
    
    console.log(`✅ ${agentName}: ${validQuestions.length} valid questions`);
    agentDebug.steps.push({
      step: 'completion',
      status: 'SUCCESS',
      message: `Successfully processed ${agentName}`,
      endTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ Error processing ${agentName}:`, error.message);
    agentDebug.steps.push({
      step: 'error_handling',
      status: 'FAILED',
      message: `Unexpected error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    agentErrors.push({
      agent: agentName,
      error: error.message,
      stack: error.stack,
      debug: agentDebug
    });
  }
  
  debugLog.push(agentDebug);
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
  debug_info: {
    total_debug_entries: debugLog.length,
    processing_time: new Date().toISOString(),
    parser_version: '2.3.0'
  },
  generation_time: new Date().toISOString(),
  parser_version: '2.3.0'
};

// Calculate topic distribution
allQuestions.forEach(question => {
  const topic = question.topic || 'Unknown';
  metadata.topic_distribution[topic] = (metadata.topic_distribution[topic] || 0) + 1;
});

// Step 7: Validate final output
if (allQuestions.length === 0) {
  const errorMessage = `No valid questions generated. Agent errors: ${JSON.stringify(agentErrors)}`;
  console.error('❌', errorMessage);
  throw new Error(errorMessage);
}

// Debug: Log final statistics
console.log('📊 Final Statistics:', {
  totalQuestions: allQuestions.length,
  technicalQuestions: metadata.technical_count,
  aptitudeQuestions: metadata.aptitude_count,
  mcqQuestions: metadata.mcq_count,
  textQuestions: metadata.text_count,
  agentErrors: agentErrors.length,
  successfulAgents: metadata.agent_performance.successful_agents,
  failedAgents: metadata.agent_performance.failed_agents
});

// Debug: Log agent performance summary
console.log('🎯 Agent Performance Summary:');
Object.entries(agentStats).forEach(([agentName, stats]) => {
  console.log(`  ${agentName}: ${stats.validQuestions}/${stats.totalGenerated} questions (${((stats.validQuestions/stats.totalGenerated)*100).toFixed(1)}% success rate)`);
});

// Debug: Log any errors
if (agentErrors.length > 0) {
  console.log('⚠️ Agent Errors:');
  agentErrors.forEach(error => {
    console.log(`  ${error.agent}: ${error.error}`);
  });
}

// Step 8: Return questions with enhanced metadata
// Return as n8n expects - each question as separate item
return allQuestions.map(question => ({ 
  json: {
    ...question,
    _metadata: {
      agent_source: question._agent_source,
      agent_index: question._agent_index,
      parser_version: '2.3.0',
      parsed_at: new Date().toISOString()
    }
  }
}));
```

## Key Debug Features Added

### 1. **Comprehensive Logging**
- Step-by-step processing logs
- Success/failure status for each step
- Timestamps for performance tracking
- Detailed error information

### 2. **Agent Performance Tracking**
- Individual agent success rates
- Question validation statistics
- Processing time tracking
- Error categorization

### 3. **Question-Level Debugging**
- Validation status for each question
- Correction tracking
- Invalid question identification
- Detailed error reporting

### 4. **Console Output**
- Real-time processing status
- Final statistics summary
- Agent performance overview
- Error summary

### 5. **Metadata Enhancement**
- Debug information in metadata
- Agent performance statistics
- Processing time tracking
- Error details

## Console Output Examples

```
🔍 Processing named agent responses: { totalResponses: 4, agentNames: [...] }
📋 Processing AI Technical MCQ Questions...
✅ AI Technical MCQ Questions: 7 valid questions
📋 Processing AI Technical Text Questions...
✅ AI Technical Text Questions: 4 valid questions
📊 Final Statistics: { totalQuestions: 16, technicalQuestions: 11, ... }
🎯 Agent Performance Summary:
  AI Technical MCQ Questions: 7/7 questions (100.0% success rate)
  AI Technical Text Questions: 4/4 questions (100.0% success rate)
```

This enhanced parser provides comprehensive debugging and monitoring capabilities for your multi-agent system.
