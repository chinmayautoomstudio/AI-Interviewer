# Enhanced Multi-Agent Response Parser with Agent Identification
// Handles merged responses from 4 AI agents with proper identification

// Step 1: Extract the merged response array
const mergedResponses = $input.all();

console.log('🔍 Processing merged responses:', {
  totalResponses: mergedResponses.length,
  sampleStructure: mergedResponses[0] ? Object.keys(mergedResponses[0].json) : 'No data'
});

// Step 2: Define expected agent mapping based on order
const agentMapping = [
  { name: 'Technical MCQ Questions', expectedType: 'mcq', expectedCategory: 'technical' },
  { name: 'Technical Text Questions', expectedType: 'text', expectedCategory: 'technical' },
  { name: 'Aptitude MCQ Questions', expectedType: 'mcq', expectedCategory: 'aptitude' },
  { name: 'Aptitude Text Questions', expectedType: 'text', expectedCategory: 'aptitude' }
];

// Step 3: Process each response with agent identification
const allQuestions = [];
const agentErrors = [];
const agentStats = {};

for (let i = 0; i < mergedResponses.length; i++) {
  const response = mergedResponses[i];
  const agentInfo = agentMapping[i] || { name: `Unknown Agent ${i + 1}`, expectedType: 'unknown', expectedCategory: 'unknown' };
  
  try {
    console.log(`📋 Processing ${agentInfo.name} (Response ${i + 1})...`);
    
    // Step 4: Extract and parse the JSON string response
    let parsedResponse;
    try {
      // Handle different response structures
      if (response.json && response.json.output) {
        // Standard n8n AI Agent response format
        parsedResponse = JSON.parse(response.json.output);
      } else if (response.json && response.json.generated_questions) {
        // Direct JSON object (already parsed)
        parsedResponse = response.json;
      } else if (typeof response.json === 'string') {
        // Direct JSON string
        parsedResponse = JSON.parse(response.json);
      } else {
        throw new Error('Unknown response format');
      }
    } catch (parseError) {
      console.error(`❌ Failed to parse ${agentInfo.name}:`, parseError.message);
      agentErrors.push({
        agent: agentInfo.name,
        responseIndex: i,
        error: `JSON Parse Error: ${parseError.message}`,
        rawResponse: JSON.stringify(response.json).substring(0, 200) + '...'
      });
      continue;
    }
    
    // Step 5: Validate structure
    if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
      console.error(`❌ Invalid structure for ${agentInfo.name}: missing generated_questions array`);
      agentErrors.push({
        agent: agentInfo.name,
        responseIndex: i,
        error: 'Missing or invalid generated_questions array',
        structure: Object.keys(parsedResponse)
      });
      continue;
    }
    
    // Step 6: Validate and clean questions with agent-specific validation
    const validQuestions = parsedResponse.generated_questions.filter(question => {
      // Basic validation
      if (!question.question_text || !question.question_type || !question.question_category) {
        console.warn(`⚠️ Invalid question in ${agentInfo.name}:`, {
          hasText: !!question.question_text,
          hasType: !!question.question_type,
          hasCategory: !!question.question_category
        });
        return false;
      }
      
      // Agent-specific validation and correction
      if (question.question_type !== agentInfo.expectedType) {
        console.warn(`⚠️ Question type mismatch in ${agentInfo.name}: expected ${agentInfo.expectedType}, got ${question.question_type}`);
        question.question_type = agentInfo.expectedType;
      }
      
      if (question.question_category !== agentInfo.expectedCategory) {
        console.warn(`⚠️ Question category mismatch in ${agentInfo.name}: expected ${agentInfo.expectedCategory}, got ${question.question_category}`);
        question.question_category = agentInfo.expectedCategory;
      }
      
      // Add agent source metadata
      question._agent_source = agentInfo.name;
      question._agent_index = i;
      
      return true;
    });
    
    // Step 7: Update agent statistics
    agentStats[agentInfo.name] = {
      totalGenerated: parsedResponse.generated_questions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: parsedResponse.generated_questions.length - validQuestions.length,
      expectedType: agentInfo.expectedType,
      expectedCategory: agentInfo.expectedCategory,
      metadata: parsedResponse.generation_metadata || {}
    };
    
    console.log(`✅ ${agentInfo.name}: ${validQuestions.length} valid questions`);
    allQuestions.push(...validQuestions);
    
  } catch (error) {
    console.error(`❌ Error processing ${agentInfo.name}:`, error.message);
    agentErrors.push({
      agent: agentInfo.name,
      responseIndex: i,
      error: error.message,
      stack: error.stack
    });
  }
}

// Step 8: Generate comprehensive metadata
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
    total_agents: agentMapping.length,
    successful_agents: agentMapping.length - agentErrors.length,
    failed_agents: agentErrors.length,
    agent_stats: agentStats,
    errors: agentErrors
  },
  generation_time: new Date().toISOString(),
  parser_version: '2.1.0'
};

// Calculate topic distribution
allQuestions.forEach(question => {
  const topic = question.topic || 'Unknown';
  metadata.topic_distribution[topic] = (metadata.topic_distribution[topic] || 0) + 1;
});

// Step 9: Validate final output
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

// Step 10: Return questions with enhanced metadata
// Return as n8n expects - each question as separate item
return allQuestions.map(question => ({ 
  json: {
    ...question,
    _metadata: {
      agent_source: question._agent_source,
      agent_index: question._agent_index,
      parser_version: '2.1.0',
      parsed_at: new Date().toISOString()
    }
  }
}));
