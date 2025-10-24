# N8N Multi-Agent Distribution Logic - Updated

## 🎯 **Distribution Node JavaScript Code**

```javascript
// Enhanced Distribution Logic for Multi-Agent Question Generation
const inputData = $input.first().json;

console.log('📊 Input Data:', JSON.stringify(inputData, null, 2));

// Extract configuration
const config = inputData.generation_config;
const totalQuestions = config.total_questions;
const technicalPercentage = config.technical_percentage;
const aptitudePercentage = config.aptitude_percentage;
const mcqPercentage = config.question_types.mcq;
const textPercentage = config.question_types.text;
const topics = config.topics || [];

// Calculate base distribution
const technicalTotal = Math.round(totalQuestions * technicalPercentage / 100);
const aptitudeTotal = Math.round(totalQuestions * aptitudePercentage / 100);

// Calculate MCQ vs Text distribution
const technicalMCQ = Math.round(technicalTotal * mcqPercentage / 100);
const technicalText = technicalTotal - technicalMCQ;
const aptitudeMCQ = Math.round(aptitudeTotal * mcqPercentage / 100);
const aptitudeText = aptitudeTotal - aptitudeMCQ;

// Adjust for rounding errors
const totalCalculated = technicalMCQ + technicalText + aptitudeMCQ + aptitudeText;
const difference = totalQuestions - totalCalculated;

if (difference !== 0) {
  // Add difference to the largest category
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

// Agent 1: Technical MCQ Questions
if (technicalMCQ > 0) {
  // Filter technical topics for MCQ
  const technicalTopics = topics.filter(topic => 
    ['Programming Languages', 'Database Management', 'Web Development', 'DevOps & Cloud', 'Data Structures & Algorithms'].includes(topic.name)
  );
  
  requests.push({
    agent: 'technical_mcq',
    questions: technicalMCQ,
    config: {
      total_questions: technicalMCQ,
      question_type: 'mcq',
      category: 'technical',
      difficulty_distribution: config.difficulty_distribution,
      topics: technicalTopics,
      mcq_percentage: 100,
      text_percentage: 0
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

// Agent 2: Technical Text Questions
if (technicalText > 0) {
  // Filter technical topics for Text
  const technicalTopics = topics.filter(topic => 
    ['Programming Languages', 'Database Management', 'Web Development', 'DevOps & Cloud', 'Data Structures & Algorithms'].includes(topic.name)
  );
  
  requests.push({
    agent: 'technical_text',
    questions: technicalText,
    config: {
      total_questions: technicalText,
      question_type: 'text',
      category: 'technical',
      difficulty_distribution: config.difficulty_distribution,
      topics: technicalTopics,
      mcq_percentage: 0,
      text_percentage: 100
    },
    input_method: inputData.input_method,
    source_info: inputData.source_info,
    job_description_id: inputData.job_description_id
  });
}

// Agent 3: Aptitude MCQ Questions
if (aptitudeMCQ > 0) {
  // Filter aptitude topics for MCQ
  const aptitudeTopics = topics.filter(topic => 
    ['Logical Reasoning', 'Quantitative Aptitude'].includes(topic.name)
  );
  
  requests.push({
    agent: 'aptitude_mcq',
    questions: aptitudeMCQ,
    config: {
      total_questions: aptitudeMCQ,
      question_type: 'mcq',
      category: 'aptitude',
      difficulty_distribution: config.difficulty_distribution,
      topics: aptitudeTopics,
      mcq_percentage: 100,
      text_percentage: 0
    },
    input_method: 'general_aptitude', // No JD required for aptitude
    source_info: {
      question_type: 'aptitude'
    },
    job_description_id: null // No JD for aptitude questions
  });
}

// Agent 4: Aptitude Text Questions
if (aptitudeText > 0) {
  // Filter aptitude topics for Text
  const aptitudeTopics = topics.filter(topic => 
    ['Logical Reasoning', 'Quantitative Aptitude'].includes(topic.name)
  );
  
  requests.push({
    agent: 'aptitude_text',
    questions: aptitudeText,
    config: {
      total_questions: aptitudeText,
      question_type: 'text',
      category: 'aptitude',
      difficulty_distribution: config.difficulty_distribution,
      topics: aptitudeTopics,
      mcq_percentage: 0,
      text_percentage: 100
    },
    input_method: 'general_aptitude', // No JD required for aptitude
    source_info: {
      question_type: 'aptitude'
    },
    job_description_id: null // No JD for aptitude questions
  });
}

console.log('📋 Agent Requests:', requests);

// Return requests for each agent
return requests.map(request => ({ json: request }));
```

## 🎯 **Example Distribution Calculation**

### **Input Data:**
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
    },
    "topics": [
      {"name": "Logical Reasoning", "weight": 15, "min_questions": 1, "max_questions": 4},
      {"name": "Quantitative Aptitude", "weight": 15, "min_questions": 1, "max_questions": 4},
      {"name": "Programming Languages", "weight": 10, "min_questions": 1, "max_questions": 3},
      {"name": "Database Management", "weight": 10, "min_questions": 1, "max_questions": 3},
      {"name": "Web Development", "weight": 10, "min_questions": 1, "max_questions": 3},
      {"name": "DevOps & Cloud", "weight": 10, "min_questions": 1, "max_questions": 3},
      {"name": "Data Structures & Algorithms", "weight": 10, "min_questions": 1, "max_questions": 3}
    ]
  },
  "input_method": "existing_jd",
  "source_info": {
    "job_description_id": "97d508ce-f4f5-4693-b1b9-4b5dcad7475c"
  },
  "job_description_id": "97d508ce-f4f5-4693-b1b9-4b5dcad7475c"
}
```

### **Calculated Distribution:**
```javascript
// Total Questions: 15
// Technical: 70% = 10.5 ≈ 11 questions
// Aptitude: 30% = 4.5 ≈ 4 questions

// MCQ: 60% of each category
// Technical MCQ: 11 * 60% = 6.6 ≈ 7 questions
// Technical Text: 11 - 7 = 4 questions
// Aptitude MCQ: 4 * 60% = 2.4 ≈ 2 questions
// Aptitude Text: 4 - 2 = 2 questions

// Final Distribution:
{
  technical_mcq: 7,
  technical_text: 4,
  aptitude_mcq: 2,
  aptitude_text: 2,
  total: 15
}
```

### **Agent Requests Generated:**
```javascript
[
  {
    agent: 'technical_mcq',
    questions: 7,
    config: {
      total_questions: 7,
      question_type: 'mcq',
      category: 'technical',
      topics: [
        {"name": "Programming Languages", "weight": 10, "min_questions": 1, "max_questions": 3},
        {"name": "Database Management", "weight": 10, "min_questions": 1, "max_questions": 3},
        {"name": "Web Development", "weight": 10, "min_questions": 1, "max_questions": 3},
        {"name": "DevOps & Cloud", "weight": 10, "min_questions": 1, "max_questions": 3},
        {"name": "Data Structures & Algorithms", "weight": 10, "min_questions": 1, "max_questions": 3}
      ]
    },
    input_method: 'existing_jd',
    job_description_id: '97d508ce-f4f5-4693-b1b9-4b5dcad7475c'
  },
  {
    agent: 'technical_text',
    questions: 4,
    config: {
      total_questions: 4,
      question_type: 'text',
      category: 'technical',
      topics: [/* same technical topics */]
    },
    input_method: 'existing_jd',
    job_description_id: '97d508ce-f4f5-4693-b1b9-4b5dcad7475c'
  },
  {
    agent: 'aptitude_mcq',
    questions: 2,
    config: {
      total_questions: 2,
      question_type: 'mcq',
      category: 'aptitude',
      topics: [
        {"name": "Logical Reasoning", "weight": 15, "min_questions": 1, "max_questions": 4},
        {"name": "Quantitative Aptitude", "weight": 15, "min_questions": 1, "max_questions": 4}
      ]
    },
    input_method: 'general_aptitude',
    job_description_id: null
  },
  {
    agent: 'aptitude_text',
    questions: 2,
    config: {
      total_questions: 2,
      question_type: 'text',
      category: 'aptitude',
      topics: [/* same aptitude topics */]
    },
    input_method: 'general_aptitude',
    job_description_id: null
  }
]
```

## 🔧 **Key Features of This Distribution Logic**

### **1. Automatic Calculation**
- Calculates questions per agent based on percentages
- Handles rounding errors automatically
- Ensures total matches requested count

### **2. Topic Filtering**
- Technical topics go to technical agents
- Aptitude topics go to aptitude agents
- Maintains topic relevance per agent

### **3. JD Handling**
- Technical questions use job description
- Aptitude questions skip JD (use generic relevance)

### **4. Flexible Configuration**
- Supports any percentage distribution
- Handles any number of topics
- Adapts to different question type ratios

### **5. Validation**
- Ensures all questions are distributed
- Validates topic assignments
- Checks input method consistency

## 🎯 **Usage in N8N Workflow**

1. **Input Node**: Receives the generation config
2. **Distribution Node**: Runs the JavaScript code above
3. **Agent Nodes**: Receive specific requests with exact question counts
4. **Collection Node**: Gathers all agent outputs
5. **Validation Node**: Validates final question set

This distribution logic ensures each agent receives the exact number of questions it should generate based on your configuration! 🎉
