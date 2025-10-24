// Simple fix parser - handles the specific escape sequence issue
// Copy this into your n8n workflow

try {
  const inputData = $input.first().json;
  let aiResponse = inputData.output;
  
  // Extract JSON from markdown
  if (aiResponse.includes('```json')) {
    const jsonStart = aiResponse.indexOf('```json') + 7;
    const jsonEnd = aiResponse.lastIndexOf('```');
    aiResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
  }
  
  // Fix the specific issue: the AI is generating literal \n instead of proper JSON newlines
  // We need to convert these to actual newlines first, then properly escape them for JSON
  aiResponse = aiResponse
    .replace(/\\n/g, '\n') // Convert literal \n to actual newlines
    .replace(/\n/g, '\\n') // Convert actual newlines to proper JSON escape sequences
    .replace(/\\t/g, '\t') // Convert literal \t to actual tabs
    .replace(/\t/g, '\\t') // Convert actual tabs to proper JSON escape sequences
    .replace(/\\r/g, '\r') // Convert literal \r to actual carriage returns
    .replace(/\r/g, '\\r') // Convert actual carriage returns to proper JSON escape sequences
    .replace(/\\\\/g, '\\'); // Fix double backslashes
  
  // Parse the cleaned JSON
  const parsed = JSON.parse(aiResponse);
  
  // Validate and return
  if (parsed.generated_questions && Array.isArray(parsed.generated_questions)) {
    return {
      generated_questions: parsed.generated_questions,
      generation_metadata: parsed.generation_metadata || {},
      success: true,
      validation_passed: true
    };
  } else {
    throw new Error('Invalid response structure: missing generated_questions array');
  }
  
} catch (error) {
  return {
    error: error.message,
    success: false,
    validation_passed: false,
    raw_response: $input.first().json.output,
    timestamp: new Date().toISOString()
  };
}
