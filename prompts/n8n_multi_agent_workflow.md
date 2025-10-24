# N8N Multi-Agent Workflow Implementation Guide

## 🎯 **Multi-Agent Workflow Architecture**

### **Workflow Structure:**
```
Input Node (Job Description + Requirements)
    ↓
Distribution Node (Calculate Questions per Agent)
    ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Agent 1       │   Agent 2       │   Agent 3       │   Agent 4       │
│ Technical MCQ   │ Technical Text  │ Aptitude MCQ    │ Aptitude Text   │
│ Questions       │ Questions       │ Questions       │ Questions       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
    ↓
Collection Node (Gather All Outputs)
    ↓
Validation Node (Quality Control)
    ↓
Aggregation Node (Combine & Format)
    ↓
Output Node (Final Question Bank)
```

## 🔧 **Step-by-Step Implementation**

### **Step 1: Create Input Node**
**Node Type**: Webhook or Manual Trigger
**Purpose**: Receive job description and generation requirements

**Input Structure:**
```json
{
  "generation_config": {
    "total_questions": 15,
    "technical_percentage": 70,
    "aptitude_percentage": 30,
    "difficulty_distribution": {
      "easy": 3,
      "medium": 8,
      "hard": 4
    },
    "question_types": {
      "mcq": 60,
      "text": 40
    }
  },
  "input_method": "existing_jd",
  "source_info": {
    "job_description_id": "97d508ce-f4f5-4693-b1b9-4b5dcad7475c"
  },
  "job_description_id": "97d508ce-f4f5-4693-b1b9-4b5dcad7475c"
}
```

### **Step 2: Create Distribution Node**
**Node Type**: JavaScript
**Purpose**: Calculate questions per agent and distribute requests

**JavaScript Code:**
```javascript
// Distribution Logic for Multi-Agent Question Generation
const inputData = $input.first().json;

// Extract configuration
const config = inputData.generation_config;
const totalQuestions = config.total_questions;
const technicalPercentage = config.technical_percentage;
const aptitudePercentage = config.aptitude_percentage;
const mcqPercentage = config.question_types.mcq;
const textPercentage = config.question_types.text;

// Calculate questions per agent
const technicalMCQ = Math.round(totalQuestions * technicalPercentage / 100 * mcqPercentage / 100);
const technicalText = Math.round(totalQuestions * technicalPercentage / 100 * textPercentage / 100);
const aptitudeMCQ = Math.round(totalQuestions * aptitudePercentage / 100 * mcqPercentage / 100);
const aptitudeText = Math.round(totalQuestions * aptitudePercentage / 100 * textPercentage / 100);

// Adjust for rounding errors
const totalCalculated = technicalMCQ + technicalText + aptitudeMCQ + aptitudeText;
const difference = totalQuestions - totalCalculated;

// Add difference to the largest category
if (difference > 0) {
  if (technicalMCQ >= technicalText && technicalMCQ >= aptitudeMCQ && technicalMCQ >= aptitudeText) {
    technicalMCQ += difference;
  } else if (technicalText >= aptitudeMCQ && technicalText >= aptitudeText) {
    technicalText += difference;
  } else if (aptitudeMCQ >= aptitudeText) {
    aptitudeMCQ += difference;
  } else {
    aptitudeText += difference;
  }
}

// Create distribution object
const distribution = {
  technical_mcq: technicalMCQ,
  technical_text: technicalText,
  aptitude_mcq: aptitudeMCQ,
  aptitude_text: aptitudeText,
  total: technicalMCQ + technicalText + aptitudeMCQ + aptitudeText
};

console.log('📊 Question Distribution:', distribution);

// Create requests for each agent
const requests = [];

// Agent 1: Technical MCQ
if (technicalMCQ > 0) {
  requests.push({
    agent: 'technical_mcq',
    questions: technicalMCQ,
    config: {
      ...config,
      total_questions: technicalMCQ,
      question_type: 'mcq',
      category: 'technical'
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

// Agent 2: Technical Text
if (technicalText > 0) {
  requests.push({
    agent: 'technical_text',
    questions: technicalText,
    config: {
      ...config,
      total_questions: technicalText,
      question_type: 'text',
      category: 'technical'
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

// Agent 3: Aptitude MCQ
if (aptitudeMCQ > 0) {
  requests.push({
    agent: 'aptitude_mcq',
    questions: aptitudeMCQ,
    config: {
      ...config,
      total_questions: aptitudeMCQ,
      question_type: 'mcq',
      category: 'aptitude'
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

// Agent 4: Aptitude Text
if (aptitudeText > 0) {
  requests.push({
    agent: 'aptitude_text',
    questions: aptitudeText,
    config: {
      ...config,
      total_questions: aptitudeText,
      question_type: 'text',
      category: 'aptitude'
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

console.log('📋 Agent Requests:', requests);

return requests.map(request => ({ json: request }));
```

### **Step 3: Create Specialized AI Agents**

#### **Agent 1: Technical MCQ Questions**
**Node Type**: AI Agent
**Configuration**:
- **System Message**: Use the Technical MCQ Agent prompt from `specialized_agent_prompts.md`
- **Temperature**: 0.2
- **Max Tokens**: 2000
- **Structured Output Parser**: Connect to MCQ-specific parser

#### **Agent 2: Technical Text Questions**
**Node Type**: AI Agent
**Configuration**:
- **System Message**: Use the Technical Text Agent prompt from `specialized_agent_prompts.md`
- **Temperature**: 0.3
- **Max Tokens**: 3000
- **Structured Output Parser**: Connect to Text-specific parser

#### **Agent 3: Aptitude MCQ Questions**
**Node Type**: AI Agent
**Configuration**:
- **System Message**: Use the Aptitude MCQ Agent prompt from `specialized_agent_prompts.md`
- **Temperature**: 0.2
- **Max Tokens**: 2000
- **Structured Output Parser**: Connect to MCQ-specific parser

#### **Agent 4: Aptitude Text Questions**
**Node Type**: AI Agent
**Configuration**:
- **System Message**: Use the Aptitude Text Agent prompt from `specialized_agent_prompts.md`
- **Temperature**: 0.3
- **Max Tokens**: 3000
- **Structured Output Parser**: Connect to Text-specific parser

### **Step 4: Create Collection Node**
**Node Type**: Merge
**Purpose**: Combine outputs from all agents

**Configuration**:
- **Mode**: Merge
- **Merge By**: Position
- **Output Data**: All Items

### **Step 5: Create Validation Node**
**Node Type**: JavaScript
**Purpose**: Validate and quality control all questions

**JavaScript Code:**
```javascript
// Multi-Agent Question Validation and Quality Control
const allOutputs = $input.all();

console.log('🔍 Validating outputs from', allOutputs.length, 'agents');

let allQuestions = [];
let totalTechnical = 0;
let totalAptitude = 0;
let totalMCQ = 0;
let totalText = 0;
let difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
let topicDistribution = {};
let keySkillsTested = new Set();

// Process each agent output
allOutputs.forEach((output, index) => {
  const data = output.json;
  
  if (data.success && data.generated_questions) {
    console.log(`✅ Agent ${index + 1}: ${data.generated_questions.length} questions`);
    
    // Add questions to collection
    allQuestions = allQuestions.concat(data.generated_questions);
    
    // Update counts
    if (data.generation_metadata) {
      totalTechnical += data.generation_metadata.technical_count || 0;
      totalAptitude += data.generation_metadata.aptitude_count || 0;
      totalMCQ += data.generation_metadata.mcq_count || 0;
      totalText += data.generation_metadata.text_count || 0;
      
      // Update difficulty breakdown
      if (data.generation_metadata.difficulty_breakdown) {
        difficultyBreakdown.easy += data.generation_metadata.difficulty_breakdown.easy || 0;
        difficultyBreakdown.medium += data.generation_metadata.difficulty_breakdown.medium || 0;
        difficultyBreakdown.hard += data.generation_metadata.difficulty_breakdown.hard || 0;
      }
      
      // Update topic distribution
      if (data.generation_metadata.topic_distribution) {
        Object.entries(data.generation_metadata.topic_distribution).forEach(([topic, count]) => {
          topicDistribution[topic] = (topicDistribution[topic] || 0) + count;
        });
      }
      
      // Update key skills
      if (data.generation_metadata.job_description_used?.key_skills_tested) {
        data.generation_metadata.job_description_used.key_skills_tested.forEach(skill => {
          keySkillsTested.add(skill);
        });
      }
    }
  } else {
    console.log(`❌ Agent ${index + 1}: Failed - ${data.error || 'Unknown error'}`);
  }
});

// Validate question quality
const validationErrors = [];
allQuestions.forEach((question, index) => {
  // Check required fields
  const requiredFields = ['question_text', 'question_type', 'question_category', 'difficulty_level', 'correct_answer', 'answer_explanation'];
  const missingFields = requiredFields.filter(field => !question[field]);
  
  if (missingFields.length > 0) {
    validationErrors.push(`Question ${index + 1}: Missing fields - ${missingFields.join(', ')}`);
  }
  
  // Validate MCQ options
  if (question.question_type === 'mcq') {
    if (!question.mcq_options || question.mcq_options.length !== 4) {
      validationErrors.push(`Question ${index + 1}: MCQ must have exactly 4 options`);
    }
  } else if (question.question_type === 'text') {
    if (!question.mcq_options || question.mcq_options.length !== 0) {
      validationErrors.push(`Question ${index + 1}: Text question must have empty mcq_options array`);
    }
  }
  
  // Validate difficulty level
  if (!['easy', 'medium', 'hard'].includes(question.difficulty_level)) {
    validationErrors.push(`Question ${index + 1}: Invalid difficulty level - ${question.difficulty_level}`);
  }
  
  // Validate category
  if (!['technical', 'aptitude'].includes(question.question_category)) {
    validationErrors.push(`Question ${index + 1}: Invalid category - ${question.question_category}`);
  }
});

if (validationErrors.length > 0) {
  console.log('❌ Validation Errors:', validationErrors);
  throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
}

console.log('✅ All questions validated successfully');

// Create final metadata
const finalMetadata = {
  total_generated: allQuestions.length,
  technical_count: totalTechnical,
  aptitude_count: totalAptitude,
  mcq_count: totalMCQ,
  text_count: totalText,
  difficulty_breakdown: difficultyBreakdown,
  topic_distribution: topicDistribution,
  job_description_used: {
    id: allOutputs[0]?.json?.generation_metadata?.job_description_used?.id || 'unknown',
    title: allOutputs[0]?.json?.generation_metadata?.job_description_used?.title || 'unknown',
    key_skills_tested: Array.from(keySkillsTested)
  },
  generation_time: new Date().toISOString(),
  ai_model_used: 'multi-agent-system',
  confidence_score: 0.95,
  validation_status: 'passed'
};

console.log('📊 Final Metadata:', finalMetadata);

return {
  generated_questions: allQuestions,
  generation_metadata: finalMetadata,
  success: true,
  validation_passed: true,
  agent_count: allOutputs.length,
  total_questions: allQuestions.length
};
```

### **Step 6: Create Aggregation Node**
**Node Type**: JavaScript
**Purpose**: Final formatting and output preparation

**JavaScript Code:**
```javascript
// Final Aggregation and Output Preparation
const inputData = $input.first().json;

// Ensure proper JSON formatting
const finalOutput = {
  generated_questions: inputData.generated_questions,
  generation_metadata: inputData.generation_metadata,
  success: inputData.success,
  validation_passed: inputData.validation_passed,
  multi_agent_info: {
    agent_count: inputData.agent_count,
    total_questions: inputData.total_questions,
    generation_method: 'multi-agent-specialized'
  }
};

console.log('🎉 Multi-Agent Generation Complete!');
console.log('📊 Final Statistics:', {
  total_questions: finalOutput.generated_questions.length,
  technical: finalOutput.generation_metadata.technical_count,
  aptitude: finalOutput.generation_metadata.aptitude_count,
  mcq: finalOutput.generation_metadata.mcq_count,
  text: finalOutput.generation_metadata.text_count
});

return finalOutput;
```

### **Step 7: Create Output Node**
**Node Type**: Webhook Response or HTTP Request
**Purpose**: Return final question bank

## 🔧 **Configuration Requirements**

### **Structured Output Parsers**
Create separate parsers for each agent type:

1. **MCQ Parser**: For Agents 1 and 3
2. **Text Parser**: For Agents 2 and 4

### **Error Handling**
- Set "On Error" to "Continue" for all nodes
- Add error handling for failed agents
- Implement retry logic for critical failures

### **Performance Optimization**
- Run agents in parallel where possible
- Set appropriate timeouts
- Monitor resource usage

## 🎯 **Expected Results**

### **Quality Improvements**
- **Specialized Expertise**: Each agent focuses on one question type
- **Consistent Quality**: Uniform standards within each type
- **Better Relevance**: Job-specific content per agent
- **Reduced Errors**: Focused prompts reduce formatting issues

### **Operational Benefits**
- **Modular Architecture**: Easy to update individual agents
- **Scalable Design**: Simple to add new question types
- **Independent Testing**: Test each agent separately
- **Targeted Improvements**: Optimize specific question types

This multi-agent architecture will provide much better question quality and consistency compared to a single agent! 🎉
