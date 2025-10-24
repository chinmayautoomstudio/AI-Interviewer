// Ultimate simple parser - just copy this into your n8n workflow
// This handles the escape sequence issue by using a different approach

try {
  const inputData = $input.first().json;
  let aiResponse = inputData.output;
  
  // Extract JSON from markdown
  if (aiResponse.includes('```json')) {
    const jsonStart = aiResponse.indexOf('```json') + 7;
    const jsonEnd = aiResponse.lastIndexOf('```');
    aiResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
  }
  
  // The key insight: instead of trying to fix the JSON, let's use eval() as a last resort
  // But first, let's try a safer approach using Function constructor
  let parsed;
  
  try {
    // Try normal JSON parsing first
    parsed = JSON.parse(aiResponse);
  } catch (jsonError) {
    // If that fails, try to fix the most common issues
    let fixedJson = aiResponse
      // Fix the main issue: replace literal \n with proper JSON newlines
      .replace(/([^\\])\\n/g, '$1\\\\n') // Escape literal \n that aren't already escaped
      .replace(/^\\n/g, '\\\\n') // Fix \n at start of string
      // Fix other common issues
      .replace(/([^\\])\\t/g, '$1\\\\t') // Escape literal \t
      .replace(/^\\t/g, '\\\\t') // Fix \t at start
      .replace(/([^\\])\\r/g, '$1\\\\r') // Escape literal \r
      .replace(/^\\r/g, '\\\\r'); // Fix \r at start
    
    try {
      parsed = JSON.parse(fixedJson);
    } catch (secondError) {
      // Last resort: use a more aggressive fix
      fixedJson = aiResponse
        .replace(/\\n/g, '\\\\n') // Replace all \n with \\n
        .replace(/\\t/g, '\\\\t') // Replace all \t with \\t
        .replace(/\\r/g, '\\\\r') // Replace all \r with \\r
        .replace(/\\\\/g, '\\'); // Fix double backslashes
      
      parsed = JSON.parse(fixedJson);
    }
  }
  
  // Validate and return
  if (parsed && parsed.generated_questions && Array.isArray(parsed.generated_questions)) {
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
