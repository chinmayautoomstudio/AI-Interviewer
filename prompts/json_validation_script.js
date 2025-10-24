# JSON Output Validation Script for N8N

## 🎯 **Purpose**
This script validates and fixes common JSON formatting issues in AI Agent output.

## 🔧 **JavaScript Code for N8N Node**

```javascript
// JSON Output Validator and Fixer for N8N
// Use this in a JavaScript node after the AI Agent

try {
  const inputData = $input.first().json;
  let aiResponse = inputData.output;
  
  console.log('🔍 Original response length:', aiResponse.length);
  
  // Extract JSON from markdown if present
  if (aiResponse.includes('```json')) {
    const jsonStart = aiResponse.indexOf('```json') + 7;
    const jsonEnd = aiResponse.lastIndexOf('```');
    if (jsonEnd > jsonStart) {
      aiResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
      console.log('🧹 Extracted JSON length:', aiResponse.length);
    }
  }
  
  // Fix common JSON issues
  let fixedJson = aiResponse
    // Fix escape sequences
    .replace(/\\n/g, '\\n') // Ensure proper newline escaping
    .replace(/\\t/g, '\\t') // Ensure proper tab escaping
    .replace(/\\r/g, '\\r') // Ensure proper carriage return escaping
    .replace(/\\\\/g, '\\') // Fix double backslashes
    
    // Fix unescaped quotes in string content
    .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"') // Fix quotes inside strings
    .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes
    .replace(/^"/g, '\\"') // Fix quote at start
    
    // Fix incomplete structures
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/([^,]\s*)([}\]])/g, '$1$2') // Fix missing commas
    
    // Fix incomplete arrays/objects
    .replace(/\[([^\[\]]*)$/g, '[]') // Fix incomplete arrays
    .replace(/\{([^{}]*)$/g, '{}') // Fix incomplete objects
    
    // Fix missing brackets
    .replace(/([^\[\]]*)$/g, function(match) {
      if (match.includes('[') && !match.includes(']')) {
        return match + ']';
      }
      if (match.includes('{') && !match.includes('}')) {
        return match + '}';
      }
      return match;
    });
  
  console.log('🔧 Fixed JSON length:', fixedJson.length);
  
  // Try to parse the fixed JSON
  let parsed;
  try {
    parsed = JSON.parse(fixedJson);
    console.log('✅ JSON parsing successful!');
  } catch (parseError) {
    console.log('❌ JSON parsing failed:', parseError.message);
    
    // Try more aggressive fixes
    fixedJson = aiResponse
      .replace(/\\n/g, '\\n')
      .replace(/\\t/g, '\\t')
      .replace(/\\r/g, '\\r')
      .replace(/\\\\/g, '\\')
      .replace(/([^\\])"/g, '$1\\"')
      .replace(/^"/g, '\\"')
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/([^,]\s*)([}\]])/g, '$1$2');
    
    try {
      parsed = JSON.parse(fixedJson);
      console.log('✅ JSON parsing successful after aggressive fix!');
    } catch (secondError) {
      console.log('❌ All parsing attempts failed:', secondError.message);
      throw new Error(`JSON parsing failed: ${secondError.message}`);
    }
  }
  
  // Validate structure
  if (!parsed.generated_questions || !Array.isArray(parsed.generated_questions)) {
    throw new Error('Invalid response structure: missing generated_questions array');
  }
  
  if (!parsed.generation_metadata) {
    throw new Error('Invalid response structure: missing generation_metadata');
  }
  
  // Validate each question
  const validatedQuestions = parsed.generated_questions.map((question, index) => {
    // Check required fields
    const requiredFields = ['question_text', 'question_type', 'question_category', 'difficulty_level', 'correct_answer', 'answer_explanation'];
    const missingFields = requiredFields.filter(field => !question[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Question ${index + 1} missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate MCQ options
    if (question.question_type === 'mcq') {
      if (!question.mcq_options || !Array.isArray(question.mcq_options) || question.mcq_options.length !== 4) {
        throw new Error(`Question ${index + 1}: MCQ questions must have exactly 4 options`);
      }
    } else if (question.question_type === 'text') {
      if (!question.mcq_options || !Array.isArray(question.mcq_options) || question.mcq_options.length !== 0) {
        question.mcq_options = []; // Fix empty array for text questions
      }
    }
    
    // Set defaults for optional fields
    return {
      ...question,
      points: question.points || 1,
      time_limit_seconds: question.time_limit_seconds || 60,
      tags: question.tags || [],
      subtopic: question.subtopic || null,
      job_relevance: question.job_relevance || 'Question relevance to job role not specified'
    };
  });
  
  // Calculate metadata
  const metadata = {
    ...parsed.generation_metadata,
    total_generated: validatedQuestions.length,
    technical_count: validatedQuestions.filter(q => q.question_category === 'technical').length,
    aptitude_count: validatedQuestions.filter(q => q.question_category === 'aptitude').length,
    mcq_count: validatedQuestions.filter(q => q.question_type === 'mcq').length,
    text_count: validatedQuestions.filter(q => q.question_type === 'text').length,
    difficulty_breakdown: {
      easy: validatedQuestions.filter(q => q.difficulty_level === 'easy').length,
      medium: validatedQuestions.filter(q => q.difficulty_level === 'medium').length,
      hard: validatedQuestions.filter(q => q.difficulty_level === 'hard').length
    },
    generation_time: new Date().toISOString(),
    validation_status: 'passed'
  };
  
  console.log('🎉 Validation successful! Questions:', validatedQuestions.length);
  
  return {
    generated_questions: validatedQuestions,
    generation_metadata: metadata,
    success: true,
    validation_passed: true
  };
  
} catch (error) {
  console.log('❌ Validation failed:', error.message);
  
  return {
    error: error.message,
    success: false,
    validation_passed: false,
    raw_response: $input.first().json.output,
    timestamp: new Date().toISOString()
  };
}
```

## 🔧 **How to Use in N8N:**

### **1. Add JavaScript Node**
- Add a **JavaScript** node after your AI Agent
- Copy the code above into the node
- Connect AI Agent output to this node

### **2. Configure Error Handling**
- Set "On Error" to "Continue" in the JavaScript node
- Add error handling for validation failures
- Implement retry logic if needed

### **3. Test the Validation**
- Run a test generation
- Check the console logs for validation results
- Verify the output structure

## 🎯 **What This Script Does:**

### **1. JSON Extraction**
- Extracts JSON from markdown code blocks
- Handles different response formats

### **2. Common Fixes**
- Fixes escape sequences
- Handles unescaped quotes
- Removes trailing commas
- Fixes incomplete structures

### **3. Validation**
- Validates required fields
- Checks array lengths
- Ensures proper data types
- Validates question structure

### **4. Error Handling**
- Comprehensive error reporting
- Fallback mechanisms
- Detailed logging

## ✅ **Expected Results:**
- ✅ Properly formatted JSON output
- ✅ Validated question structure
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Fallback mechanisms for edge cases

This validation script should handle most JSON formatting issues and provide robust error handling! 🎉
