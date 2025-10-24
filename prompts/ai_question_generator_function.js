// AI Question Generator Function for n8n Workflow
// This function handles the job description extraction and question generation

async function generateQuestionsWithJobDescription(inputData) {
  try {
    // Extract the request data
    const request = inputData.json;
    const { job_description_id, generation_config, input_method } = request;
    
    console.log('🔄 Starting question generation process...');
    console.log('📋 Job Description ID:', job_description_id);
    console.log('⚙️ Generation Config:', generation_config);
    
    // Step 1: Extract Job Description if using existing_jd method
    let jobDescription = null;
    if (input_method === 'existing_jd' && job_description_id) {
      console.log('🔍 Extracting job description from database...');
      
      // Use the "Get Job Description" tool to retrieve the JD
      const jdResponse = await $tools.getJobDescription(job_description_id);
      
      if (jdResponse && jdResponse.data) {
        jobDescription = jdResponse.data;
        console.log('✅ Job description extracted successfully');
        console.log('📋 Job Title:', jobDescription.title);
        console.log('🔧 Required Skills:', jobDescription.required_skills);
        console.log('💼 Key Responsibilities:', jobDescription.key_responsibilities);
      } else {
        throw new Error('Failed to retrieve job description from database');
      }
    }
    
    // Step 2: Prepare the enhanced prompt with job description context
    const enhancedPrompt = buildEnhancedPrompt(generation_config, jobDescription, job_description_id);
    
    // Step 3: Call the AI model to generate questions
    console.log('🤖 Calling AI model for question generation...');
    const aiResponse = await $tools.callAIModel({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: enhancedPrompt.systemMessage
        },
        {
          role: 'user',
          content: enhancedPrompt.userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    // Step 4: Parse and validate the AI response
    console.log('📝 Parsing AI response...');
    const parsedResponse = parseAIResponse(aiResponse);
    
    // Step 5: Add metadata and job description context
    const finalResponse = {
      ...parsedResponse,
      generation_metadata: {
        ...parsedResponse.generation_metadata,
        job_description_used: jobDescription ? {
          id: job_description_id,
          title: jobDescription.title,
          key_skills_tested: jobDescription.required_skills || [],
          experience_level: jobDescription.experience_level,
          department: jobDescription.department
        } : null,
        generation_time: new Date().toISOString(),
        ai_model_used: 'gpt-4',
        confidence_score: calculateConfidenceScore(parsedResponse, generation_config)
      }
    };
    
    console.log('✅ Question generation completed successfully');
    console.log('📊 Generated questions:', finalResponse.generated_questions.length);
    
    return {
      json: finalResponse
    };
    
  } catch (error) {
    console.error('❌ Error in question generation:', error);
    return {
      json: {
        error: error.message,
        generated_questions: [],
        generation_metadata: {
          error: true,
          error_message: error.message,
          generation_time: new Date().toISOString()
        }
      }
    };
  }
}

// Helper function to build enhanced prompt
function buildEnhancedPrompt(generationConfig, jobDescription, jobDescriptionId) {
  const systemMessage = `You are an expert technical interviewer and assessment designer. Generate high-quality, job-relevant exam questions with accurate answers and explanations.

IMPORTANT: You have been provided with a complete job description. Use this information to generate questions that are directly relevant to the specific role and requirements.

QUESTION FORMAT REQUIREMENTS:
1. Each question must be clear, unambiguous, and directly relevant to the job role
2. MCQ questions should have 4 options (A, B, C, D) with only one correct answer
3. Text questions should require detailed explanations or code examples
4. Include appropriate difficulty level based on experience level
5. Provide comprehensive answer explanations
6. Add relevant tags for categorization
7. Questions must be tailored to the specific job description provided

Return the response in the following JSON format:
{
  "generated_questions": [
    {
      "question_text": "Question text here",
      "question_type": "mcq" or "text",
      "question_category": "technical" or "aptitude",
      "difficulty_level": "easy", "medium", or "hard",
      "topic": "Topic name",
      "subtopic": "Subtopic (optional)",
      "points": 1-5,
      "time_limit_seconds": 30-180,
      "mcq_options": [
        {"option": "A", "text": "Option A text"},
        {"option": "B", "text": "Option B text"},
        {"option": "C", "text": "Option C text"},
        {"option": "D", "text": "Option D text"}
      ],
      "correct_answer": "A", "B", "C", "D" (for MCQ) or expected answer text (for text questions),
      "answer_explanation": "Detailed explanation of the correct answer",
      "tags": ["tag1", "tag2", "tag3"],
      "job_relevance": "Explanation of how this question relates to the specific job requirements"
    }
  ],
  "generation_metadata": {
    "total_generated": ${generationConfig.total_questions},
    "technical_count": number,
    "aptitude_count": number,
    "mcq_count": number,
    "text_count": number,
    "difficulty_breakdown": {
      "easy": number,
      "medium": number,
      "hard": number
    },
    "topic_distribution": {
      "topic_name": count
    },
    "generation_time": "ISO timestamp",
    "ai_model_used": "gpt-4",
    "confidence_score": 0.0-1.0
  }
}`;

  const userMessage = `Generate exactly ${generationConfig.total_questions} questions for the following job description:

JOB DESCRIPTION:
Title: ${jobDescription?.title || 'N/A'}
Description: ${jobDescription?.description || 'N/A'}
Required Skills: ${JSON.stringify(jobDescription?.required_skills || [])}
Preferred Skills: ${JSON.stringify(jobDescription?.preferred_skills || [])}
Technical Stack: ${JSON.stringify(jobDescription?.technical_stack || [])}
Key Responsibilities: ${JSON.stringify(jobDescription?.key_responsibilities || [])}
Experience Level: ${jobDescription?.experience_level || 'N/A'}
Education Requirements: ${jobDescription?.education_requirements || 'N/A'}

GENERATION REQUIREMENTS:
${JSON.stringify(generationConfig, null, 2)}

Please generate questions that are directly relevant to this specific job role and test the competencies mentioned in the job description.`;

  return { systemMessage, userMessage };
}

// Helper function to parse AI response
function parseAIResponse(aiResponse) {
  try {
    // Extract the content from the AI response
    const content = aiResponse.choices[0].message.content;
    
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    
    // Validate the structure
    if (!parsed.generated_questions || !Array.isArray(parsed.generated_questions)) {
      throw new Error('Invalid response structure: missing generated_questions array');
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// Helper function to calculate confidence score
function calculateConfidenceScore(parsedResponse, generationConfig) {
  try {
    const questions = parsedResponse.generated_questions;
    const totalQuestions = generationConfig.total_questions;
    
    // Check if we got the right number of questions
    const questionCountScore = questions.length === totalQuestions ? 1.0 : 0.5;
    
    // Check if questions have required fields
    const requiredFields = ['question_text', 'question_type', 'difficulty_level', 'correct_answer'];
    const fieldCompletenessScore = questions.reduce((score, q) => {
      const hasAllFields = requiredFields.every(field => q[field] !== undefined);
      return score + (hasAllFields ? 1 : 0);
    }, 0) / questions.length;
    
    // Calculate overall confidence
    const confidence = (questionCountScore + fieldCompletenessScore) / 2;
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('❌ Error calculating confidence score:', error);
    return 0.5; // Default confidence score
  }
}

// Export the main function
module.exports = generateQuestionsWithJobDescription;
