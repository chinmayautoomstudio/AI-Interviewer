// Utility functions to detect when an AI interview is ending

export interface InterviewEndDetectionResult {
  isEnding: boolean;
  confidence: number;
  detectedPhrase?: string;
}

// Common phrases that indicate the interview is ending
const ENDING_PHRASES = [
  // Thank you and goodbye phrases
  "thank you for your time today",
  "thank you for your time",
  "thank you for taking the time",
  "thank you for coming in today",
  "thank you for meeting with me today",
  "thank you for speaking with me today",
  "thank you for your responses",
  "thank you for sharing",
  
  // We'll be in touch phrases
  "we'll be in touch soon",
  "we will be in touch soon",
  "we'll be in touch",
  "we will be in touch",
  "we'll get back to you",
  "we will get back to you",
  "we'll contact you",
  "we will contact you",
  "we'll reach out to you",
  "we will reach out to you",
  
  // Next steps phrases
  "next steps",
  "we'll be in touch with next steps",
  "we will be in touch with next steps",
  "we'll contact you with next steps",
  "we will contact you with next steps",
  
  // Goodbye phrases
  "have a great day",
  "have a wonderful day",
  "have a good day",
  "have a nice day",
  "take care",
  "goodbye",
  "bye",
  
  // Interview conclusion phrases
  "that concludes our interview",
  "that wraps up our interview",
  "this concludes our interview",
  "this wraps up our interview",
  "interview is complete",
  "interview is finished",
  "interview is over",
  "that's all for today",
  "that's all for now",
  "that's everything",
  "that's all",
  
  // Decision timeline phrases
  "we'll let you know",
  "we will let you know",
  "we'll notify you",
  "we will notify you",
  "we'll inform you",
  "we will inform you",
  
  // Process completion phrases
  "i have all the information i need",
  "i have everything i need",
  "i have enough information",
  "i have sufficient information",
  "i've gathered all the information",
  "i have gathered all the information"
];

// Phrases that indicate the interview is definitely ending (high confidence)
const HIGH_CONFIDENCE_PHRASES = [
  "thank you for your time today",
  "we'll be in touch soon",
  "we will be in touch soon",
  "that concludes our interview",
  "interview is complete",
  "interview is finished",
  "interview is over",
  "i have all the information i need",
  "have a great day"
];

/**
 * Detects if the AI response indicates the interview is ending
 * @param aiResponse - The AI's response text
 * @returns Detection result with confidence level
 */
export function detectInterviewEnd(aiResponse: string): InterviewEndDetectionResult {
  if (!aiResponse || typeof aiResponse !== 'string') {
    return { isEnding: false, confidence: 0 };
  }

  const normalizedResponse = aiResponse.toLowerCase().trim();
  
  // Check for high confidence phrases first
  for (const phrase of HIGH_CONFIDENCE_PHRASES) {
    if (normalizedResponse.includes(phrase)) {
      return {
        isEnding: true,
        confidence: 0.9,
        detectedPhrase: phrase
      };
    }
  }
  
  // Check for any ending phrases
  for (const phrase of ENDING_PHRASES) {
    if (normalizedResponse.includes(phrase)) {
      return {
        isEnding: true,
        confidence: 0.7,
        detectedPhrase: phrase
      };
    }
  }
  
  // Check for multiple ending indicators (higher confidence)
  let matchCount = 0;
  let detectedPhrases: string[] = [];
  
  for (const phrase of ENDING_PHRASES) {
    if (normalizedResponse.includes(phrase)) {
      matchCount++;
      detectedPhrases.push(phrase);
    }
  }
  
  if (matchCount >= 2) {
    return {
      isEnding: true,
      confidence: 0.8,
      detectedPhrase: detectedPhrases.join(', ')
    };
  }
  
  // Check for specific patterns that indicate ending
  const endingPatterns = [
    /thank you.*time.*today/i,
    /we.*be in touch.*soon/i,
    /have a.*day/i,
    /that.*concludes.*interview/i,
    /interview.*complete|finished|over/i,
    /i have.*information.*need/i
  ];
  
  for (const pattern of endingPatterns) {
    if (pattern.test(normalizedResponse)) {
      return {
        isEnding: true,
        confidence: 0.6,
        detectedPhrase: 'pattern match'
      };
    }
  }
  
  return { isEnding: false, confidence: 0 };
}

/**
 * Checks if the confidence level is high enough to automatically end the interview
 * @param confidence - The confidence level from detection
 * @returns Whether to auto-end the interview
 */
export function shouldAutoEndInterview(confidence: number): boolean {
  return confidence >= 0.8;
}

/**
 * Checks if the confidence level is high enough to show the end interview popup
 * @param confidence - The confidence level from detection
 * @returns Whether to show the popup
 */
export function shouldShowEndInterviewPopup(confidence: number): boolean {
  return confidence >= 0.6;
}
