# Exam System - AI Integration & n8n Workflows

## 🤖 AI Integration Overview

The exam system leverages AI through n8n workflows for intelligent question generation and text answer evaluation. This integration ensures high-quality, relevant questions and fair, consistent scoring of candidate responses.

## 🔄 n8n Workflow Architecture

### Workflow Structure
```
n8n Workflows/
├── exam_question_generator_workflow.json    # AI question generation
├── exam_text_evaluation_workflow.json       # Text answer scoring
└── exam_adaptive_analysis_workflow.json     # Performance analysis
```

## 📝 1. Question Generation Workflow

**File**: `n8n/exam_question_generator_workflow.json`

### Workflow Purpose
- Generate 30 questions per job description (21 technical + 9 aptitude)
- Create diverse difficulty levels (easy, medium, hard)
- Include detailed explanations for correct answers
- Support both MCQ and text question types

### Workflow Steps

```json
{
  "name": "Exam Question Generator",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "exam-question-generator",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Extract Job Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const jobData = $input.first().json;
          
          return [{
            json: {
              jobTitle: jobData.jobTitle,
              description: jobData.jobDescription,
              skills: jobData.skills || [],
              requirements: jobData.requirements || [],
              technicalCount: jobData.technicalCount || 21,
              aptitudeCount: jobData.aptitudeCount || 9,
              difficultyDistribution: jobData.difficultyDistribution || {
                easy: 9,
                medium: 15,
                hard: 6
              }
            }
          }];
        `
      }
    },
    {
      "name": "Generate Technical Questions",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert technical interviewer and assessment designer. Generate high-quality technical questions for job interviews."
            },
            {
              "role": "user",
              "content": `
                Generate {{ $json.technicalCount }} technical questions for the position: {{ $json.jobTitle }}
                
                Job Description: {{ $json.description }}
                Required Skills: {{ $json.skills.join(', ') }}
                Requirements: {{ $json.requirements.join(', ') }}
                
                Difficulty Distribution:
                - Easy: {{ $json.difficultyDistribution.easy }} questions
                - Medium: {{ $json.difficultyDistribution.medium }} questions  
                - Hard: {{ $json.difficultyDistribution.hard }} questions
                
                Requirements:
                1. Mix of MCQ (70%) and Text questions (30%)
                2. Cover core technical skills from the job description
                3. Include practical, real-world scenarios
                4. Provide detailed explanations for correct answers
                5. Ensure questions test both knowledge and application
                
                Output Format (JSON):
                {
                  "questions": [
                    {
                      "question_text": "Question text here",
                      "question_type": "mcq" or "text",
                      "question_category": "technical",
                      "difficulty_level": "easy" or "medium" or "hard",
                      "mcq_options": [
                        {"option": "A", "text": "Option A"},
                        {"option": "B", "text": "Option B"},
                        {"option": "C", "text": "Option C"},
                        {"option": "D", "text": "Option D"}
                      ],
                      "correct_answer": "A",
                      "answer_explanation": "Detailed explanation of why this is correct",
                      "points": 1 or 2,
                      "time_limit_seconds": 60 or 90 or 120,
                      "tags": ["skill1", "skill2", "concept"]
                    }
                  ]
                }
              `
            }
          ]
        },
        "temperature": 0.7,
        "maxTokens": 4000
      }
    },
    {
      "name": "Generate Aptitude Questions",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert in aptitude testing and logical reasoning. Generate high-quality aptitude questions for job assessments."
            },
            {
              "role": "user",
              "content": `
                Generate {{ $json.aptitudeCount }} aptitude questions for general job assessment.
                
                Question Types to Include:
                1. Logical Reasoning (30%)
                2. Numerical Ability (30%)
                3. Verbal Reasoning (20%)
                4. Problem Solving (20%)
                
                Difficulty Distribution:
                - Easy: {{ Math.floor($json.difficultyDistribution.easy * 0.3) }} questions
                - Medium: {{ Math.floor($json.difficultyDistribution.medium * 0.3) }} questions
                - Hard: {{ Math.floor($json.difficultyDistribution.hard * 0.3) }} questions
                
                Requirements:
                1. All questions should be MCQ format
                2. Include practical, work-related scenarios where possible
                3. Provide clear explanations for correct answers
                4. Ensure questions are culturally neutral and fair
                
                Output Format (JSON):
                {
                  "questions": [
                    {
                      "question_text": "Question text here",
                      "question_type": "mcq",
                      "question_category": "aptitude",
                      "difficulty_level": "easy" or "medium" or "hard",
                      "mcq_options": [
                        {"option": "A", "text": "Option A"},
                        {"option": "B", "text": "Option B"},
                        {"option": "C", "text": "Option C"},
                        {"option": "D", "text": "Option D"}
                      ],
                      "correct_answer": "A",
                      "answer_explanation": "Detailed explanation of the reasoning",
                      "points": 1,
                      "time_limit_seconds": 60,
                      "tags": ["logical_reasoning", "numerical", "verbal"]
                    }
                  ]
                }
              `
            }
          ]
        },
        "temperature": 0.6,
        "maxTokens": 3000
      }
    },
    {
      "name": "Combine and Validate Questions",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const technicalQuestions = JSON.parse($('Generate Technical Questions').first().json.choices[0].message.content).questions;
          const aptitudeQuestions = JSON.parse($('Generate Aptitude Questions').first().json.choices[0].message.content).questions;
          
          const allQuestions = [...technicalQuestions, ...aptitudeQuestions];
          
          // Validate questions
          const validatedQuestions = allQuestions.filter(q => {
            return q.question_text && 
                   q.question_type && 
                   q.correct_answer && 
                   q.answer_explanation &&
                   (q.question_type === 'text' || q.mcq_options?.length === 4);
          });
          
          // Add metadata
          const questionsWithMetadata = validatedQuestions.map((q, index) => ({
            ...q,
            id: \`generated_\${Date.now()}_\${index}\`,
            created_by: 'ai',
            status: 'draft',
            created_at: new Date().toISOString()
          }));
          
          return [{
            json: {
              questions: questionsWithMetadata,
              totalGenerated: questionsWithMetadata.length,
              technicalCount: technicalQuestions.length,
              aptitudeCount: aptitudeQuestions.length,
              jobDescriptionId: $input.first().json.jobDescriptionId
            }
          }];
        `
      }
    },
    {
      "name": "Store Questions in Database",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "exam_questions",
        "columns": "question_text,question_type,question_category,difficulty_level,mcq_options,correct_answer,answer_explanation,points,time_limit_seconds,tags,job_description_id,created_by,status",
        "values": "={{ $json.questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          question_category: q.question_category,
          difficulty_level: q.difficulty_level,
          mcq_options: q.mcq_options,
          correct_answer: q.correct_answer,
          answer_explanation: q.answer_explanation,
          points: q.points,
          time_limit_seconds: q.time_limit_seconds,
          tags: q.tags,
          job_description_id: $json.jobDescriptionId,
          created_by: 'ai',
          status: 'draft'
        })) }}"
      }
    },
    {
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { success: true, questionsGenerated: $json.totalGenerated, message: 'Questions generated successfully' } }}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [["Extract Job Data"]]
    },
    "Extract Job Data": {
      "main": [["Generate Technical Questions", "Generate Aptitude Questions"]]
    },
    "Generate Technical Questions": {
      "main": [["Combine and Validate Questions"]]
    },
    "Generate Aptitude Questions": {
      "main": [["Combine and Validate Questions"]]
    },
    "Combine and Validate Questions": {
      "main": [["Store Questions in Database"]]
    },
    "Store Questions in Database": {
      "main": [["Success Response"]]
    }
  }
}
```

### AI Prompts Engineering

#### Technical Questions Prompt Template

```typescript
const technicalQuestionsPrompt = `
You are an expert technical interviewer with 10+ years of experience in {{ jobTitle }} roles.

Generate {{ technicalCount }} high-quality technical questions based on:

JOB CONTEXT:
- Position: {{ jobTitle }}
- Description: {{ jobDescription }}
- Required Skills: {{ skills.join(', ') }}
- Key Requirements: {{ requirements.join(', ') }}

QUESTION REQUIREMENTS:
1. **Question Types**: 70% MCQ, 30% Text-based
2. **Difficulty Levels**: 
   - Easy ({{ easyCount }}): Basic concepts, definitions
   - Medium ({{ mediumCount }}): Application, problem-solving
   - Hard ({{ hardCount }}): Complex scenarios, optimization
3. **Content Focus**:
   - Core technical skills from job description
   - Real-world problem scenarios
   - Best practices and methodologies
   - Common challenges in the role

QUALITY STANDARDS:
- Questions should be clear and unambiguous
- Avoid trick questions or overly complex wording
- Include practical, work-relevant scenarios
- Ensure cultural and gender neutrality
- Test both knowledge and practical application

OUTPUT FORMAT:
Return valid JSON with this exact structure:
{
  "questions": [
    {
      "question_text": "Clear, specific question text",
      "question_type": "mcq" or "text",
      "question_category": "technical",
      "difficulty_level": "easy" or "medium" or "hard",
      "mcq_options": [
        {"option": "A", "text": "Option A text"},
        {"option": "B", "text": "Option B text"},
        {"option": "C", "text": "Option C text"},
        {"option": "D", "text": "Option D text"}
      ],
      "correct_answer": "A",
      "answer_explanation": "Detailed explanation of why this answer is correct, including key concepts and reasoning",
      "points": 1 or 2,
      "time_limit_seconds": 60 or 90 or 120,
      "tags": ["skill1", "skill2", "concept"]
    }
  ]
}

EXAMPLES:

MCQ Example:
{
  "question_text": "In a microservices architecture, which pattern is most effective for handling service-to-service communication failures?",
  "question_type": "mcq",
  "question_category": "technical",
  "difficulty_level": "medium",
  "mcq_options": [
    {"option": "A", "text": "Synchronous HTTP calls with timeouts"},
    {"option": "B", "text": "Circuit breaker pattern with fallback mechanisms"},
    {"option": "C", "text": "Direct database connections between services"},
    {"option": "D", "text": "Shared message queues for all communications"}
  ],
  "correct_answer": "B",
  "answer_explanation": "The circuit breaker pattern is specifically designed to handle service failures gracefully. It prevents cascading failures by opening the circuit when a service is down, providing fallback responses, and allowing the service to recover. This is more effective than simple timeouts (A) or direct connections (C), and more efficient than shared queues (D) for all communications.",
  "points": 2,
  "time_limit_seconds": 90,
  "tags": ["microservices", "architecture", "resilience"]
}

Text Example:
{
  "question_text": "Explain how you would optimize a slow-running database query that joins 5 tables and returns 10,000+ records. Include specific techniques and considerations.",
  "question_type": "text",
  "question_category": "technical",
  "difficulty_level": "hard",
  "correct_answer": "Expected keywords: indexing, query optimization, execution plan, normalization, caching",
  "answer_explanation": "A good answer should cover: 1) Analyzing the execution plan to identify bottlenecks, 2) Adding appropriate indexes on join columns and WHERE clauses, 3) Optimizing the query structure and join order, 4) Considering denormalization if appropriate, 5) Implementing query result caching, 6) Database-specific optimizations like partitioning or materialized views.",
  "points": 2,
  "time_limit_seconds": 120,
  "tags": ["database", "optimization", "performance", "sql"]
}
`;
```

#### Aptitude Questions Prompt Template

```typescript
const aptitudeQuestionsPrompt = `
You are an expert in aptitude testing and psychometric assessment design.

Generate {{ aptitudeCount }} high-quality aptitude questions covering:

QUESTION TYPES (30 questions total):
- Logical Reasoning (9 questions): Pattern recognition, sequence completion, logical deduction
- Numerical Ability (9 questions): Basic math, data interpretation, problem-solving
- Verbal Reasoning (6 questions): Reading comprehension, vocabulary, analogies
- Problem Solving (6 questions): Critical thinking, decision making, analysis

DIFFICULTY DISTRIBUTION:
- Easy ({{ easyCount }}): Straightforward, single-step problems
- Medium ({{ mediumCount }}): Multi-step problems requiring analysis
- Hard ({{ hardCount }}): Complex scenarios requiring synthesis

QUALITY REQUIREMENTS:
- Questions should be culturally neutral and fair
- Avoid domain-specific knowledge
- Use clear, unambiguous language
- Include work-relevant scenarios where possible
- Ensure all options are plausible for MCQs

OUTPUT FORMAT:
Return valid JSON with this exact structure:
{
  "questions": [
    {
      "question_text": "Clear question text",
      "question_type": "mcq",
      "question_category": "aptitude",
      "difficulty_level": "easy" or "medium" or "hard",
      "mcq_options": [
        {"option": "A", "text": "Option A"},
        {"option": "B", "text": "Option B"},
        {"option": "C", "text": "Option C"},
        {"option": "D", "text": "Option D"}
      ],
      "correct_answer": "A",
      "answer_explanation": "Clear explanation of the reasoning and solution method",
      "points": 1,
      "time_limit_seconds": 60,
      "tags": ["logical_reasoning", "numerical", "verbal", "problem_solving"]
    }
  ]
}

EXAMPLES:

Logical Reasoning:
{
  "question_text": "If all roses are flowers and some flowers are red, which of the following must be true?",
  "question_type": "mcq",
  "question_category": "aptitude",
  "difficulty_level": "medium",
  "mcq_options": [
    {"option": "A", "text": "Some roses are red"},
    {"option": "B", "text": "All roses are red"},
    {"option": "C", "text": "Some red things are roses"},
    {"option": "D", "text": "All flowers are roses"}
  ],
  "correct_answer": "A",
  "answer_explanation": "Since all roses are flowers and some flowers are red, it's possible that some of those red flowers are roses. We cannot conclude that all roses are red (B) or that all flowers are roses (D). Option C is not necessarily true either.",
  "points": 1,
  "time_limit_seconds": 60,
  "tags": ["logical_reasoning", "syllogism"]
}

Numerical Ability:
{
  "question_text": "A company's revenue increased by 25% in Q1, then decreased by 10% in Q2. If the original revenue was $100,000, what is the revenue after Q2?",
  "question_type": "mcq",
  "question_category": "aptitude",
  "difficulty_level": "easy",
  "mcq_options": [
    {"option": "A", "text": "$112,500"},
    {"option": "B", "text": "$115,000"},
    {"option": "C", "text": "$125,000"},
    {"option": "D", "text": "$135,000"}
  ],
  "correct_answer": "A",
  "answer_explanation": "Q1: $100,000 × 1.25 = $125,000. Q2: $125,000 × 0.90 = $112,500. The key is to apply the percentage changes sequentially, not add them together.",
  "points": 1,
  "time_limit_seconds": 60,
  "tags": ["numerical", "percentage", "calculation"]
}
`;
```

## 📊 2. Text Answer Evaluation Workflow

**File**: `n8n/exam_text_evaluation_workflow.json`

### Workflow Purpose
- Evaluate text-based answers using AI
- Provide consistent scoring across all candidates
- Generate detailed feedback for improvement
- Handle various answer lengths and formats

### Workflow Implementation

```json
{
  "name": "Text Answer Evaluation",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "evaluate-text-answer",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Extract Answer Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const data = $input.first().json;
          
          return [{
            json: {
              questionId: data.questionId,
              questionText: data.questionText,
              correctAnswer: data.correctAnswer,
              candidateAnswer: data.candidateAnswer,
              maxPoints: data.maxPoints || 2,
              difficultyLevel: data.difficultyLevel || 'medium',
              questionCategory: data.questionCategory || 'technical'
            }
          }];
        `
      }
    },
    {
      "name": "Evaluate Answer",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert evaluator for technical and aptitude assessments. Provide fair, consistent, and constructive evaluation of candidate answers."
            },
            {
              "role": "user",
              "content": `
                Evaluate this candidate's answer for the following question:
                
                QUESTION: {{ $json.questionText }}
                CORRECT ANSWER KEYWORDS: {{ $json.correctAnswer }}
                CANDIDATE'S ANSWER: {{ $json.candidateAnswer }}
                MAX POINTS: {{ $json.maxPoints }}
                DIFFICULTY: {{ $json.difficultyLevel }}
                CATEGORY: {{ $json.questionCategory }}
                
                EVALUATION CRITERIA:
                1. **Accuracy** (40%): How correct is the answer?
                2. **Completeness** (30%): Does it cover the main points?
                3. **Clarity** (20%): Is it well-structured and clear?
                4. **Depth** (10%): Does it show understanding beyond basics?
                
                SCORING GUIDELINES:
                - {{ $json.maxPoints }} points: Excellent, comprehensive answer
                - {{ Math.floor($json.maxPoints * 0.75) }} points: Good answer with minor gaps
                - {{ Math.floor($json.maxPoints * 0.5) }} points: Adequate answer, some errors
                - {{ Math.floor($json.maxPoints * 0.25) }} points: Poor answer, major issues
                - 0 points: Incorrect or irrelevant answer
                
                OUTPUT FORMAT (JSON):
                {
                  "score": 0 to {{ $json.maxPoints }},
                  "evaluation": {
                    "accuracy": "Excellent/Good/Adequate/Poor",
                    "completeness": "Complete/Partial/Minimal",
                    "clarity": "Clear/Moderate/Unclear",
                    "depth": "Deep/Moderate/Shallow"
                  },
                  "feedback": "Constructive feedback for the candidate",
                  "strengths": ["List of what the candidate did well"],
                  "improvements": ["List of areas for improvement"],
                  "reasoning": "Detailed explanation of the scoring decision"
                }
              `
            }
          ]
        },
        "temperature": 0.3,
        "maxTokens": 1000
      }
    },
    {
      "name": "Process Evaluation",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const evaluation = JSON.parse($('Evaluate Answer').first().json.choices[0].message.content);
          const inputData = $input.first().json;
          
          return [{
            json: {
              questionId: inputData.questionId,
              score: evaluation.score,
              maxScore: inputData.maxPoints,
              evaluation: evaluation.evaluation,
              feedback: evaluation.feedback,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
              reasoning: evaluation.reasoning,
              evaluatedAt: new Date().toISOString()
            }
          }];
        `
      }
    },
    {
      "name": "Update Response Score",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "exam_responses",
        "updateKey": "question_id",
        "updateValue": "={{ $json.questionId }}",
        "columns": "points_earned,is_correct",
        "values": "={{ $json.score }},={{ $json.score > 0 }}"
      }
    },
    {
      "name": "Store AI Evaluation",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "exam_results",
        "columns": "exam_session_id,ai_evaluation",
        "values": "={{ $json.examSessionId }},={{ JSON.stringify($json) }}"
      }
    },
    {
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { success: true, score: $json.score, maxScore: $json.maxScore, feedback: $json.feedback } }}"
      }
    }
  ]
}
```

### Text Evaluation Prompt Engineering

```typescript
const textEvaluationPrompt = `
You are an expert assessment evaluator with experience in technical and aptitude testing.

EVALUATION TASK:
Question: {{ questionText }}
Expected Answer Keywords: {{ correctAnswer }}
Candidate Answer: {{ candidateAnswer }}
Maximum Points: {{ maxPoints }}
Difficulty Level: {{ difficultyLevel }}
Question Category: {{ questionCategory }}

EVALUATION FRAMEWORK:

1. **ACCURACY (40% weight)**
   - Excellent: Answer is factually correct and demonstrates strong understanding
   - Good: Answer is mostly correct with minor inaccuracies
   - Adequate: Answer has some correct elements but contains errors
   - Poor: Answer is largely incorrect or shows misunderstanding

2. **COMPLETENESS (30% weight)**
   - Complete: Covers all major aspects of the question
   - Partial: Addresses most key points but misses some elements
   - Minimal: Only touches on basic aspects, missing important details

3. **CLARITY (20% weight)**
   - Clear: Well-structured, easy to follow, logical flow
   - Moderate: Generally understandable but could be clearer
   - Unclear: Difficult to follow, poorly organized, confusing

4. **DEPTH (10% weight)**
   - Deep: Shows advanced understanding, provides insights beyond basics
   - Moderate: Demonstrates solid understanding of core concepts
   - Shallow: Shows only surface-level understanding

SCORING SCALE:
- {{ maxPoints }} points: Exceptional answer across all criteria
- {{ Math.floor(maxPoints * 0.875) }} points: Very good answer
- {{ Math.floor(maxPoints * 0.75) }} points: Good answer with minor gaps
- {{ Math.floor(maxPoints * 0.625) }} points: Adequate answer
- {{ Math.floor(maxPoints * 0.5) }} points: Below average answer
- {{ Math.floor(maxPoints * 0.375) }} points: Poor answer
- {{ Math.floor(maxPoints * 0.25) }} points: Very poor answer
- 0 points: Incorrect, irrelevant, or no meaningful content

EVALUATION GUIDELINES:
- Be fair and consistent in scoring
- Consider the difficulty level when evaluating depth
- Reward practical application over theoretical knowledge
- Penalize factual errors but reward good reasoning
- Consider partial credit for partially correct answers
- Be constructive in feedback

OUTPUT FORMAT:
{
  "score": {{ number between 0 and maxPoints }},
  "evaluation": {
    "accuracy": "Excellent/Good/Adequate/Poor",
    "completeness": "Complete/Partial/Minimal", 
    "clarity": "Clear/Moderate/Unclear",
    "depth": "Deep/Moderate/Shallow"
  },
  "feedback": "Constructive feedback explaining the score and areas for improvement",
  "strengths": ["List specific things the candidate did well"],
  "improvements": ["List specific areas where the candidate could improve"],
  "reasoning": "Detailed explanation of how the score was determined"
}

EXAMPLE EVALUATION:

Question: "Explain the difference between SQL INNER JOIN and LEFT JOIN with examples."

Candidate Answer: "INNER JOIN returns only matching records from both tables. LEFT JOIN returns all records from left table and matching records from right table. Example: SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id;"

Evaluation:
{
  "score": 1.5,
  "evaluation": {
    "accuracy": "Good",
    "completeness": "Partial",
    "clarity": "Clear",
    "depth": "Moderate"
  },
  "feedback": "Good understanding of the basic concepts with a clear example. However, the answer could benefit from explaining what happens with non-matching records and providing a LEFT JOIN example for comparison.",
  "strengths": [
    "Correctly explained the core difference between INNER and LEFT JOIN",
    "Provided a practical SQL example",
    "Clear and concise explanation"
  ],
  "improvements": [
    "Include a LEFT JOIN example to show the difference",
    "Explain what happens with non-matching records",
    "Mention use cases for each type of join"
  ],
  "reasoning": "The answer demonstrates solid understanding of the core concepts and provides a good example. It's clear and accurate but lacks completeness by not showing both join types in action or explaining the practical implications of non-matching records."
}
`;
```

## 🔄 3. Adaptive Analysis Workflow

**File**: `n8n/exam_adaptive_analysis_workflow.json`

### Workflow Purpose
- Analyze candidate performance in real-time
- Determine if adaptive questions should be added
- Calculate difficulty progression recommendations
- Provide insights for exam optimization

### Implementation

```json
{
  "name": "Adaptive Analysis",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "adaptive-analysis",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Analyze Performance",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert in adaptive testing and psychometric analysis. Analyze candidate performance to determine optimal question progression."
            },
            {
              "role": "user",
              "content": `
                Analyze this candidate's performance data:
                
                PERFORMANCE METRICS:
                - Questions Answered: {{ $json.questionsAnswered }}
                - Correct Answers: {{ $json.correctAnswers }}
                - Accuracy Rate: {{ $json.accuracyRate }}%
                - Average Time per Question: {{ $json.avgTimePerQuestion }} seconds
                - Time Elapsed: {{ $json.timeElapsed }} minutes
                - Total Exam Time: {{ $json.totalExamTime }} minutes
                - Current Difficulty: {{ $json.currentDifficulty }}
                - Questions Added So Far: {{ $json.questionsAdded }}
                - Max Questions Allowed: {{ $json.maxQuestions }}
                
                ADAPTIVE DECISION CRITERIA:
                1. **High Performance**: Accuracy ≥ 80% AND Time Efficiency ≥ 2.0x
                2. **Time Efficiency**: (Expected time per question) / (Actual time per question)
                3. **Difficulty Progression**: Easy → Medium → Hard
                4. **Question Limit**: Don't exceed max adaptive questions
                
                DECISION MATRIX:
                - Add 5 Medium questions if: Accuracy ≥ 80% AND Time Efficiency ≥ 2.0x AND Current Difficulty = Easy
                - Add 5 Hard questions if: Accuracy ≥ 90% AND Time Efficiency ≥ 2.5x AND Current Difficulty = Medium
                - Add 3 Hard questions if: Accuracy ≥ 85% AND Time Efficiency ≥ 2.0x AND Current Difficulty = Hard
                - Don't add questions if: Accuracy < 80% OR Time Efficiency < 2.0x OR Max questions reached
                
                OUTPUT FORMAT (JSON):
                {
                  "shouldAddQuestions": true/false,
                  "questionsToAdd": 0-5,
                  "difficulty": "medium" or "hard",
                  "reasoning": "Explanation of the decision",
                  "performanceLevel": "High/Medium/Low",
                  "recommendations": ["List of recommendations for exam optimization"]
                }
              `
            }
          ]
        },
        "temperature": 0.2,
        "maxTokens": 500
      }
    },
    {
      "name": "Process Analysis",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const analysis = JSON.parse($('Analyze Performance').first().json.choices[0].message.content);
          const inputData = $input.first().json;
          
          return [{
            json: {
              sessionId: inputData.sessionId,
              shouldAddQuestions: analysis.shouldAddQuestions,
              questionsToAdd: analysis.questionsToAdd,
              difficulty: analysis.difficulty,
              reasoning: analysis.reasoning,
              performanceLevel: analysis.performanceLevel,
              recommendations: analysis.recommendations,
              analyzedAt: new Date().toISOString()
            }
          }];
        `
      }
    },
    {
      "name": "Update Session Metadata",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "exam_sessions",
        "updateKey": "id",
        "updateValue": "={{ $json.sessionId }}",
        "columns": "performance_metadata",
        "values": "={{ JSON.stringify($json) }}"
      }
    },
    {
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { success: true, analysis: $json } }}"
      }
    }
  ]
}
```

## 🔧 4. Integration with Backend Services

### Service Integration Code

```typescript
// examQuestionGenerator.ts
export class ExamQuestionGenerator {
  static async triggerAIGeneration(jobDescriptionId: string, questionCount: number = 30) {
    try {
      // Get job description
      const { data: jobDescription } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', jobDescriptionId)
        .single();

      // Prepare n8n webhook payload
      const payload = {
        jobDescriptionId,
        jobTitle: jobDescription.title,
        jobDescription: jobDescription.description,
        skills: jobDescription.skills || [],
        requirements: jobDescription.requirements || [],
        technicalCount: Math.floor(questionCount * 0.70),
        aptitudeCount: Math.floor(questionCount * 0.30),
        difficultyDistribution: {
          easy: Math.floor(questionCount * 0.3),
          medium: Math.floor(questionCount * 0.5),
          hard: Math.floor(questionCount * 0.2)
        }
      };

      // Call n8n webhook
      const response = await fetch(process.env.REACT_APP_N8N_EXAM_GENERATION_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, workflowId: result.executionId };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate questions' 
      };
    }
  }
}

// examService.ts
export class ExamService {
  static async evaluateTextAnswer(sessionId: string, questionId: string, answer: string) {
    try {
      // Get question details
      const { data: question } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      // Prepare evaluation payload
      const payload = {
        questionId,
        questionText: question.question_text,
        correctAnswer: question.correct_answer,
        candidateAnswer: answer,
        maxPoints: question.points,
        difficultyLevel: question.difficulty_level,
        questionCategory: question.question_category,
        examSessionId: sessionId
      };

      // Call n8n evaluation webhook
      const response = await fetch(process.env.REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Evaluation webhook failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, evaluation: result };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to evaluate answer' 
      };
    }
  }

  static async analyzeAdaptivePerformance(sessionId: string) {
    try {
      // Get session and performance data
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: responses } = await supabase
        .from('exam_responses')
        .select('*')
        .eq('exam_session_id', sessionId);

      // Calculate performance metrics
      const questionsAnswered = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const accuracyRate = (correctAnswers / questionsAnswered) * 100;
      const avgTimePerQuestion = responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) / questionsAnswered;
      const timeElapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000 / 60;

      // Prepare analysis payload
      const payload = {
        sessionId,
        questionsAnswered,
        correctAnswers,
        accuracyRate,
        avgTimePerQuestion,
        timeElapsed,
        totalExamTime: session.duration_minutes,
        currentDifficulty: 'medium', // Determine from recent questions
        questionsAdded: session.adaptive_questions_added,
        maxQuestions: session.max_adaptive_questions
      };

      // Call n8n analysis webhook
      const response = await fetch(process.env.REACT_APP_N8N_ADAPTIVE_ANALYSIS_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Analysis webhook failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, analysis: result.analysis };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze performance' 
      };
    }
  }
}
```

## 🔧 5. Environment Configuration

### Environment Variables

```env
# n8n Workflow URLs
REACT_APP_N8N_EXAM_GENERATION_WEBHOOK=https://your-n8n-instance.com/webhook/exam-question-generator
REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK=https://your-n8n-instance.com/webhook/evaluate-text-answer
REACT_APP_N8N_ADAPTIVE_ANALYSIS_WEBHOOK=https://your-n8n-instance.com/webhook/adaptive-analysis

# AI Model Configuration
REACT_APP_OPENAI_MODEL=gpt-4
REACT_APP_OPENAI_TEMPERATURE_QUESTIONS=0.7
REACT_APP_OPENAI_TEMPERATURE_EVALUATION=0.3
REACT_APP_OPENAI_MAX_TOKENS_QUESTIONS=4000
REACT_APP_OPENAI_MAX_TOKENS_EVALUATION=1000

# Question Generation Settings
REACT_APP_DEFAULT_QUESTIONS_PER_JOB=30
REACT_APP_TECHNICAL_QUESTIONS_RATIO=0.70
REACT_APP_APTITUDE_QUESTIONS_RATIO=0.30
REACT_APP_DIFFICULTY_DISTRIBUTION_EASY=0.30
REACT_APP_DIFFICULTY_DISTRIBUTION_MEDIUM=0.50
REACT_APP_DIFFICULTY_DISTRIBUTION_HARD=0.20
```

## 📊 6. Quality Assurance & Monitoring

### AI Output Validation

```typescript
// Validation functions for AI-generated content
export class AIValidationService {
  static validateGeneratedQuestions(questions: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    questions.forEach((q, index) => {
      // Required fields validation
      if (!q.question_text || q.question_text.length < 10) {
        errors.push(`Question ${index + 1}: Question text too short`);
      }
      
      if (!q.question_type || !['mcq', 'text'].includes(q.question_type)) {
        errors.push(`Question ${index + 1}: Invalid question type`);
      }
      
      if (!q.correct_answer) {
        errors.push(`Question ${index + 1}: Missing correct answer`);
      }
      
      if (!q.answer_explanation || q.answer_explanation.length < 20) {
        errors.push(`Question ${index + 1}: Answer explanation too short`);
      }

      // MCQ validation
      if (q.question_type === 'mcq') {
        if (!q.mcq_options || q.mcq_options.length !== 4) {
          errors.push(`Question ${index + 1}: MCQ must have exactly 4 options`);
        }
        
        if (!q.mcq_options.every((opt: any) => opt.option && opt.text)) {
          errors.push(`Question ${index + 1}: MCQ options missing option or text`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  static validateEvaluationResult(evaluation: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof evaluation.score !== 'number' || evaluation.score < 0) {
      errors.push('Invalid score value');
    }
    
    if (!evaluation.feedback || evaluation.feedback.length < 10) {
      errors.push('Feedback too short');
    }
    
    if (!evaluation.reasoning || evaluation.reasoning.length < 20) {
      errors.push('Reasoning too short');
    }

    return { valid: errors.length === 0, errors };
  }
}
```

### Performance Monitoring

```typescript
// Monitor AI workflow performance
export class AIMonitoringService {
  static async trackQuestionGeneration(jobDescriptionId: string, startTime: number, endTime: number, questionsGenerated: number) {
    const duration = endTime - startTime;
    
    // Log to monitoring system
    console.log('AI Question Generation Metrics:', {
      jobDescriptionId,
      duration: `${duration}ms`,
      questionsGenerated,
      avgTimePerQuestion: `${duration / questionsGenerated}ms`,
      timestamp: new Date().toISOString()
    });

    // Store in database for analytics
    await supabase
      .from('ai_workflow_metrics')
      .insert({
        workflow_type: 'question_generation',
        job_description_id: jobDescriptionId,
        duration_ms: duration,
        questions_generated: questionsGenerated,
        success: true,
        created_at: new Date().toISOString()
      });
  }

  static async trackEvaluationPerformance(questionId: string, startTime: number, endTime: number, score: number) {
    const duration = endTime - startTime;
    
    await supabase
      .from('ai_workflow_metrics')
      .insert({
        workflow_type: 'text_evaluation',
        question_id: questionId,
        duration_ms: duration,
        score_given: score,
        success: true,
        created_at: new Date().toISOString()
      });
  }
}
```

---

**Next Steps**: Review the security and performance implementation in `EXAM_SECURITY_PERFORMANCE.md`
