// AI Agent Interview Report Generation Function
// This function formats the prompt for the AI agent in n8n workflow

function generateInterviewReportPrompt(conversationHistory, jobDescription, candidateResume) {
  const prompt = `
# AI Agent Interview Report Generation

## Role
You are an expert HR interviewer analyzing interview conversations to generate comprehensive candidate performance reports.

## Input Data
- **Interview Conversation**: ${conversationHistory}
- **Job Description**: ${jobDescription}
- **Candidate Resume**: ${candidateResume}

## Analysis Framework

### Scoring (1-10 scale)
- **Technical Competency (40%)**: Skills alignment, problem-solving, industry knowledge
- **Communication Skills (25%)**: Clarity, listening, professionalism, confidence
- **Cultural Fit (20%)**: Values alignment, work style, motivation, adaptability
- **Overall Potential (15%)**: Growth capacity, team integration, long-term value

### Recommendation Categories
- **HIRE**: Strong candidate, meets/exceeds requirements
- **CONDITIONAL HIRE**: Good candidate with specific conditions to meet
- **DO NOT HIRE**: Significant gaps or misalignment

## Output Format
Return a JSON object with the following structure:

\`\`\`json
{
  "overall_score": 7.5,
  "suitability_recommendation": "CONDITIONAL HIRE",
  "risk_level": "MEDIUM",
  "scores": {
    "technical_competency": 8.0,
    "communication_skills": 7.0,
    "cultural_fit": 7.5,
    "overall_potential": 7.0
  },
  "key_strengths": [
    "Strong technical background in relevant technologies",
    "Clear communication and problem-solving approach",
    "Demonstrates learning mindset and adaptability"
  ],
  "main_concerns": [
    "Limited experience with specific framework mentioned in JD",
    "Some uncertainty about long-term career goals",
    "May need additional support in team collaboration"
  ],
  "detailed_analysis": {
    "technical_competency": {
      "score": 8.0,
      "strengths": "Demonstrated solid understanding of core concepts...",
      "gaps": "Limited exposure to advanced features...",
      "recommendations": "Provide training on specific technologies..."
    },
    "communication_skills": {
      "score": 7.0,
      "strengths": "Clear articulation of technical concepts...",
      "areas_for_improvement": "Could be more concise in responses...",
      "team_dynamics": "Likely to contribute well to team discussions..."
    },
    "cultural_fit": {
      "score": 7.5,
      "alignment": "Values align well with company culture...",
      "work_style": "Prefers collaborative approach...",
      "integration": "Should integrate well with existing team..."
    },
    "job_suitability": {
      "score": 7.0,
      "role_match": "Meets 80% of position requirements...",
      "growth_potential": "Strong potential for advancement...",
      "long_term_value": "Expected to contribute significantly..."
    }
  },
  "specific_examples": {
    "best_responses": [
      {
        "question": "How would you approach debugging a complex issue?",
        "response": "I would start by reproducing the issue...",
        "analysis": "Shows systematic thinking and good problem-solving approach"
      }
    ],
    "concerning_responses": [
      {
        "question": "What are your long-term career goals?",
        "response": "I'm not entirely sure...",
        "analysis": "Lacks clarity and direction for career planning"
      }
    ]
  },
  "recommendations": {
    "onboarding_focus": "Emphasize company culture and team dynamics",
    "mentorship_needs": "Assign senior developer as mentor",
    "quick_wins": "Start with well-defined, achievable projects",
    "development_plan": {
      "30_days": "Complete onboarding and first project",
      "60_days": "Take on more complex tasks",
      "90_days": "Begin contributing to team decisions"
    }
  }
}
\`\`\`

## Guidelines
- Be objective and base assessments on actual interview content
- Provide specific examples and quotes from the conversation
- Balance strengths with areas for improvement
- Give actionable recommendations for next steps
- Consider the candidate's experience level and role requirements
- Focus on job-relevant competencies and cultural fit

## Instructions
Analyze the provided interview conversation, job description, and candidate resume. Generate a comprehensive report following the JSON format above. Ensure all scores are justified by specific examples from the interview.
`;

  return prompt;
}

// Example usage in n8n workflow
function formatInterviewDataForReport(interviewData) {
  const {
    conversationHistory,
    jobDescription,
    candidateResume,
    sessionId,
    candidateName,
    jobTitle
  } = interviewData;

  // Format conversation history
  const formattedConversation = conversationHistory
    .map(msg => `${msg.sender}: ${msg.content}`)
    .join('\n');

  // Format job description
  const formattedJD = `
Title: ${jobTitle}
Requirements: ${jobDescription.requirements || 'Not specified'}
Responsibilities: ${jobDescription.responsibilities || 'Not specified'}
Qualifications: ${jobDescription.qualifications || 'Not specified'}
`;

  // Format candidate resume
  const formattedResume = `
Name: ${candidateName}
Experience: ${candidateResume.experience || 'Not specified'}
Education: ${candidateResume.education || 'Not specified'}
Skills: ${candidateResume.skills || 'Not specified'}
`;

  return {
    prompt: generateInterviewReportPrompt(formattedConversation, formattedJD, formattedResume),
    metadata: {
      sessionId,
      candidateName,
      jobTitle,
      timestamp: new Date().toISOString()
    }
  };
}

// Export for use in n8n
module.exports = {
  generateInterviewReportPrompt,
  formatInterviewDataForReport
};
