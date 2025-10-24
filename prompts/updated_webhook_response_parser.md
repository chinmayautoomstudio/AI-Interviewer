# Updated Parser for Direct n8n Webhook Response

```javascript
// Enhanced parser for direct n8n webhook response with question storage
const items = $input.all();

console.log('🔍 Processing n8n webhook response:', {
  totalItems: items.length,
  timestamp: new Date().toISOString()
});

const allQuestions = [];
const debugLog = [];
const processingStats = {
  totalReceived: 0,
  validQuestions: 0,
  invalidQuestions: 0,
  errors: []
};

try {
  // Step 1: Extract questions from webhook response
  const webhookResponse = items[0].json;
  
  if (!webhookResponse || !Array.isArray(webhookResponse)) {
    throw new Error('Invalid webhook response format: expected array of questions');
  }
  
  processingStats.totalReceived = webhookResponse.length;
  console.log(`📋 Processing ${processingStats.totalReceived} questions from webhook response`);
  
  // Step 2: Process each question
  webhookResponse.forEach((question, index) => {
    const questionDebug = {
      questionIndex: index,
      steps: []
    };
    
    try {
      // Basic validation
      if (!question.question_text || !question.question_type || !question.question_category) {
        const error = `Invalid question structure at index ${index}`;
        console.warn(`⚠️ ${error}:`, {
          hasText: !!question.question_text,
          hasType: !!question.question_type,
          hasCategory: !!question.question_category
        });
        questionDebug.steps.push({
          step: 'validation',
          status: 'FAILED',
          message: error
        });
        processingStats.invalidQuestions++;
        return;
      }
      
      questionDebug.steps.push({
        step: 'validation',
        status: 'SUCCESS',
        message: `Question ${index} validated successfully`
      });
      
      // Clean and prepare question data
      const cleanedQuestion = {
        question_text: question.question_text,
        question_type: question.question_type,
        question_category: question.question_category,
        difficulty_level: question.difficulty_level || 'medium',
        topic: question.topic || 'General',
        subtopic: question.subtopic || 'General',
        points: question.points || 1,
        time_limit_seconds: question.time_limit_seconds || 60,
        mcq_options: question.mcq_options || [],
        correct_answer: question.correct_answer || '',
        answer_explanation: question.answer_explanation || '',
        tags: question.tags || [],
        job_relevance: question.job_relevance || '',
        // Preserve agent metadata if available
        _agent_source: question._agent_source || 'Unknown',
        _agent_index: question._agent_index || 0,
        _metadata: question._metadata || {
          parser_version: '2.4.0',
          processed_at: new Date().toISOString()
        }
      };
      
      // Additional validation for MCQ questions
      if (cleanedQuestion.question_type === 'mcq') {
        if (!cleanedQuestion.mcq_options || cleanedQuestion.mcq_options.length < 2) {
          console.warn(`⚠️ MCQ question ${index} has insufficient options`);
          questionDebug.steps.push({
            step: 'mcq_validation',
            status: 'WARNING',
            message: 'Insufficient MCQ options'
          });
        }
        
        if (!cleanedQuestion.correct_answer) {
          console.warn(`⚠️ MCQ question ${index} missing correct answer`);
          questionDebug.steps.push({
            step: 'mcq_validation',
            status: 'WARNING',
            message: 'Missing correct answer'
          });
        }
      }
      
      questionDebug.steps.push({
        step: 'processing',
        status: 'SUCCESS',
        message: `Question ${index} processed successfully`
      });
      
      allQuestions.push(cleanedQuestion);
      processingStats.validQuestions++;
      
    } catch (error) {
      console.error(`❌ Error processing question ${index}:`, error.message);
      questionDebug.steps.push({
        step: 'error',
        status: 'FAILED',
        message: error.message
      });
      processingStats.errors.push({
        questionIndex: index,
        error: error.message
      });
      processingStats.invalidQuestions++;
    }
    
    debugLog.push(questionDebug);
  });
  
  // Step 3: Generate comprehensive metadata
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
    agent_distribution: {},
    processing_stats: processingStats,
    debug_info: {
      total_debug_entries: debugLog.length,
      processing_time: new Date().toISOString(),
      parser_version: '2.4.0'
    },
    generation_time: new Date().toISOString(),
    parser_version: '2.4.0'
  };
  
  // Calculate topic distribution
  allQuestions.forEach(question => {
    const topic = question.topic || 'Unknown';
    metadata.topic_distribution[topic] = (metadata.topic_distribution[topic] || 0) + 1;
  });
  
  // Calculate agent distribution
  allQuestions.forEach(question => {
    const agent = question._agent_source || 'Unknown';
    metadata.agent_distribution[agent] = (metadata.agent_distribution[agent] || 0) + 1;
  });
  
  // Step 4: Validate final output
  if (allQuestions.length === 0) {
    throw new Error(`No valid questions processed. Errors: ${JSON.stringify(processingStats.errors)}`);
  }
  
  // Step 5: Log final statistics
  console.log('📊 Final Processing Statistics:', {
    totalReceived: processingStats.totalReceived,
    validQuestions: processingStats.validQuestions,
    invalidQuestions: processingStats.invalidQuestions,
    successRate: `${((processingStats.validQuestions / processingStats.totalReceived) * 100).toFixed(1)}%`,
    errors: processingStats.errors.length
  });
  
  console.log('📈 Question Distribution:', {
    technical: metadata.technical_count,
    aptitude: metadata.aptitude_count,
    mcq: metadata.mcq_count,
    text: metadata.text_count,
    easy: metadata.difficulty_breakdown.easy,
    medium: metadata.difficulty_breakdown.medium,
    hard: metadata.difficulty_breakdown.hard
  });
  
  console.log('🤖 Agent Distribution:', metadata.agent_distribution);
  
  // Step 6: Return questions with enhanced metadata
  // Return as n8n expects - each question as separate item
  return allQuestions.map(question => ({ 
    json: {
      ...question,
      _metadata: {
        ...question._metadata,
        parser_version: '2.4.0',
        processed_at: new Date().toISOString()
      }
    }
  }));
  
} catch (error) {
  console.error('❌ Critical error in parser:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Return error information
  return [{
    json: {
      error: true,
      message: error.message,
      stack: error.stack,
      processing_stats: processingStats,
      debug_info: {
        total_debug_entries: debugLog.length,
        processing_time: new Date().toISOString(),
        parser_version: '2.4.0'
      }
    }
  }];
}
```

## Key Features of Updated Parser

### 1. **Direct Webhook Response Handling**
- Processes the array of questions directly from n8n webhook
- No need for JSON parsing or extraction
- Handles the exact format you provided

### 2. **Comprehensive Question Validation**
- Validates required fields (question_text, question_type, question_category)
- Special validation for MCQ questions (options, correct answer)
- Preserves all metadata and agent information

### 3. **Enhanced Debugging**
- Step-by-step processing logs
- Question-level validation tracking
- Comprehensive error reporting
- Processing statistics

### 4. **Metadata Generation**
- Question distribution by category, type, difficulty
- Agent distribution tracking
- Topic distribution analysis
- Processing performance metrics

### 5. **Error Handling**
- Graceful error handling for individual questions
- Critical error reporting
- Detailed error information with stack traces

## Console Output Examples

**Processing Status:**
```
🔍 Processing n8n webhook response: { totalItems: 1, timestamp: "2025-10-24T10:33:27.574Z" }
📋 Processing 16 questions from webhook response
```

**Final Statistics:**
```
📊 Final Processing Statistics: {
  totalReceived: 16,
  validQuestions: 16,
  invalidQuestions: 0,
  successRate: "100.0%",
  errors: 0
}
```

**Question Distribution:**
```
📈 Question Distribution: {
  technical: 11,
  aptitude: 5,
  mcq: 10,
  text: 6,
  easy: 4,
  medium: 7,
  hard: 5
}
```

**Agent Distribution:**
```
🤖 Agent Distribution: {
  "AI Technical MCQ Questions": 8,
  "AI Technical Text Questions": 3,
  "AI Aptitude MCQ Questions": 3,
  "AI Aptitude Text Questions": 2
}
```

## Benefits

1. **Direct Processing**: Handles your exact webhook response format
2. **Comprehensive Validation**: Ensures data quality and integrity
3. **Detailed Debugging**: Full visibility into processing steps
4. **Performance Tracking**: Monitors processing efficiency
5. **Error Resilience**: Continues processing even with individual question errors
6. **Metadata Preservation**: Maintains all agent and processing information

This updated parser is specifically designed to handle your n8n webhook response format and provides comprehensive debugging and monitoring capabilities.
