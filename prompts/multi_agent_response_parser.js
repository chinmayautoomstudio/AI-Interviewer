// Enhanced Multi-Agent Response Parser
// Handles the new multi-agent format where each agent returns a JSON string

// Step 1: Extract the multi-agent response structure
const multiAgentResponse = $input.first().json;

console.log('🔍 Multi-Agent Response Structure:', {
  keys: Object.keys(multiAgentResponse),
  totalAgents: Object.keys(multiAgentResponse).length
});

// Step 2: Process each agent's response
const allQuestions = [];
const agentErrors = [];

// Define expected agent keys
const expectedAgents = [
  'Technical MCQ Questions',
  'Technical Text Question', 
  'Aptitude MCQ Questions',
  'Aptitude Text Questions'
];

for (const [agentName, agentResponse] of Object.entries(multiAgentResponse)) {
  try {
    console.log(`📋 Processing ${agentName}...`);
    
    // Check if this is a valid agent response
    if (!expectedAgents.includes(agentName)) {
      console.warn(`⚠️ Unknown agent: ${agentName}`);
      continue;
    }
    
    // Step 3: Parse the JSON string response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(agentResponse);
    } catch (parseError) {
      console.error(`❌ Failed to parse ${agentName}:`, parseError.message);
      agentErrors.push({
        agent: agentName,
        error: `JSON Parse Error: ${parseError.message}`,
        rawResponse: agentResponse.substring(0, 200) + '...'
      });
      continue;
    }
    
    // Step 4: Validate structure
    if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
      console.error(`❌ Invalid structure for ${agentName}: missing generated_questions array`);
      agentErrors.push({
        agent: agentName,
        error: 'Missing or invalid generated_questions array',
        structure: Object.keys(parsedResponse)
      });
      continue;
    }
    
    // Step 5: Validate and clean questions
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
      
      // Validate question type matches agent specialization
      const expectedType = agentName.includes('MCQ') ? 'mcq' : 'text';
      const expectedCategory = agentName.includes('Technical') ? 'technical' : 'aptitude';
      
      if (question.question_type !== expectedType) {
        console.warn(`⚠️ Question type mismatch in ${agentName}: expected ${expectedType}, got ${question.question_type}`);
        // Fix the question type
        question.question_type = expectedType;
      }
      
      if (question.question_category !== expectedCategory) {
        console.warn(`⚠️ Question category mismatch in ${agentName}: expected ${expectedCategory}, got ${question.question_category}`);
        // Fix the question category
        question.question_category = expectedCategory;
      }
      
      return true;
    });
    
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
    total_agents: expectedAgents.length,
    successful_agents: expectedAgents.length - agentErrors.length,
    failed_agents: agentErrors.length,
    errors: agentErrors
  },
  generation_time: new Date().toISOString(),
  parser_version: '2.0.0'
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
  agentErrors: agentErrors.length
});

// Step 8: Return questions with metadata
const result = {
  generated_questions: allQuestions,
  generation_metadata: metadata
};

// Return as n8n expects - each question as separate item
return allQuestions.map(question => ({ 
  json: {
    ...question,
    _metadata: {
      agent_source: 'multi-agent-parser-v2',
      parsed_at: new Date().toISOString()
    }
  }
}));
