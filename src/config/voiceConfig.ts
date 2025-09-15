// Voice Configuration for AI Interviewer
// This file contains voice settings and presets for different interview scenarios

export interface VoiceConfig {
  voiceId: string;
  name: string;
  description: string;
  accent: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle' | 'mature';
  useCase: string;
  settings: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

// Available voice presets based on your API test results
export const VOICE_PRESETS: Record<string, VoiceConfig> = {
  // Professional Interview Voices
  professional_female: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    name: 'Rachel',
    description: 'Professional, clear, and engaging female voice',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: 'Professional interviews, technical discussions',
    settings: {
      stability: 0.7,
      similarityBoost: 0.8,
      useSpeakerBoost: true,
    },
  },
  
  professional_male: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (default)
    name: 'Adam',
    description: 'Professional, authoritative male voice',
    accent: 'American',
    gender: 'male',
    age: 'middle',
    useCase: 'Professional interviews, leadership roles',
    settings: {
      stability: 0.8,
      similarityBoost: 0.7,
      useSpeakerBoost: true,
    },
  },

  // Friendly Interview Voices
  friendly_female: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (can be used for friendly tone)
    name: 'Rachel (Friendly)',
    description: 'Warm and approachable female voice',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: 'Casual interviews, creative roles',
    settings: {
      stability: 0.5,
      similarityBoost: 0.6,
      useSpeakerBoost: true,
    },
  },

  // Technical Interview Voices
  technical_male: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (technical variant)
    name: 'Adam (Technical)',
    description: 'Clear and precise for technical discussions',
    accent: 'American',
    gender: 'male',
    age: 'middle',
    useCase: 'Technical interviews, engineering roles',
    settings: {
      stability: 0.9,
      similarityBoost: 0.8,
      useSpeakerBoost: true,
    },
  },

  // Indian Accent Friendly Voices (using existing voices with adjusted settings)
  indian_friendly_female: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel with Indian-friendly settings
    name: 'Rachel (Indian-Friendly)',
    description: 'Professional female voice optimized for Indian English pronunciation',
    accent: 'American (Indian-optimized)',
    gender: 'female',
    age: 'young',
    useCase: 'Indian English interviews, technical discussions',
    settings: {
      stability: 0.6, // Lower stability for more natural pronunciation
      similarityBoost: 0.7, // Adjusted for better Indian English clarity
      useSpeakerBoost: true,
    },
  },

  indian_friendly_male: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam with Indian-friendly settings
    name: 'Adam (Indian-Friendly)',
    description: 'Professional male voice optimized for Indian English pronunciation',
    accent: 'American (Indian-optimized)',
    gender: 'male',
    age: 'middle',
    useCase: 'Indian English interviews, leadership roles',
    settings: {
      stability: 0.7, // Balanced stability for clear Indian English
      similarityBoost: 0.6, // Lower similarity boost for natural pronunciation
      useSpeakerBoost: true,
    },
  },

  indian_technical_male: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam for technical Indian English
    name: 'Adam (Indian Technical)',
    description: 'Technical voice optimized for Indian English technical terms',
    accent: 'American (Indian Technical)',
    gender: 'male',
    age: 'middle',
    useCase: 'Technical interviews, engineering roles (Indian English)',
    settings: {
      stability: 0.8, // Higher stability for technical clarity
      similarityBoost: 0.5, // Lower similarity for natural technical pronunciation
      useSpeakerBoost: true,
    },
  },

  // Sia - Friendly Customer Care Agent
  sia_friendly: {
    voiceId: 'ryIIztHPLYSJ74ueXxnO', // Sia - Friendly Conversational Voice
    name: 'Sia - Friendly Customer Care',
    description: 'Friendly and conversational voice perfect for customer care and supportive interviews',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: 'Customer care interviews, supportive conversations, friendly interactions',
    settings: {
      stability: 0.6, // Lower stability for more natural, conversational tone
      similarityBoost: 0.7, // Good similarity for friendly voice
      useSpeakerBoost: true,
    },
  },
};

// Default voice configuration
export const DEFAULT_VOICE_CONFIG: VoiceConfig = VOICE_PRESETS.professional_female;

// Voice selection based on job type
export const getVoiceForJobType = (jobType: string, preferIndianAccent: boolean = false): VoiceConfig => {
  const jobTypeLower = jobType.toLowerCase();
  
  // If Indian accent is preferred, use Indian-friendly voices
  if (preferIndianAccent) {
    if (jobTypeLower.includes('technical') || jobTypeLower.includes('engineer') || jobTypeLower.includes('developer')) {
      return VOICE_PRESETS.indian_technical_male;
    } else if (jobTypeLower.includes('creative') || jobTypeLower.includes('design') || jobTypeLower.includes('marketing')) {
      return VOICE_PRESETS.indian_friendly_female;
    } else if (jobTypeLower.includes('manager') || jobTypeLower.includes('lead') || jobTypeLower.includes('director')) {
      return VOICE_PRESETS.indian_friendly_male;
    } else {
      return VOICE_PRESETS.indian_friendly_female; // Default to female Indian-friendly voice
    }
  }
  
  // Standard voice selection
  if (jobTypeLower.includes('web developer trainee') || jobTypeLower.includes('developer trainee')) {
    // Specific voice for Web Developer Trainee role
    return VOICE_PRESETS.professional_female;
  } else if (jobTypeLower.includes('technical') || jobTypeLower.includes('engineer') || jobTypeLower.includes('developer')) {
    // Use female voice for other developer roles
    return VOICE_PRESETS.professional_female;
  } else if (jobTypeLower.includes('creative') || jobTypeLower.includes('design') || jobTypeLower.includes('marketing')) {
    return VOICE_PRESETS.friendly_female;
  } else if (jobTypeLower.includes('manager') || jobTypeLower.includes('lead') || jobTypeLower.includes('director')) {
    return VOICE_PRESETS.professional_male;
  } else if (jobTypeLower.includes('customer') || jobTypeLower.includes('care') || jobTypeLower.includes('support') || jobTypeLower.includes('service')) {
    return VOICE_PRESETS.sia_friendly; // Use Sia for customer care roles
  } else {
    return DEFAULT_VOICE_CONFIG;
  }
};

// Voice selection based on department
export const getVoiceForDepartment = (department: string, preferIndianAccent: boolean = false): VoiceConfig => {
  const deptLower = department.toLowerCase();
  
  // If Indian accent is preferred, use Indian-friendly voices
  if (preferIndianAccent) {
    switch (deptLower) {
      case 'engineering':
      case 'technology':
      case 'it':
        return VOICE_PRESETS.indian_technical_male;
      case 'hr':
      case 'human resources':
        return VOICE_PRESETS.indian_friendly_female;
      case 'management':
      case 'executive':
        return VOICE_PRESETS.indian_friendly_male;
      case 'marketing':
      case 'creative':
      case 'design':
        return VOICE_PRESETS.indian_friendly_female;
      default:
        return VOICE_PRESETS.indian_friendly_female;
    }
  }
  
  // Standard voice selection
  switch (deptLower) {
    case 'engineering':
    case 'technology':
    case 'it':
    case 'development':
      return VOICE_PRESETS.professional_female; // Use female voice for development departments
    case 'hr':
    case 'human resources':
      return VOICE_PRESETS.friendly_female;
    case 'management':
    case 'executive':
      return VOICE_PRESETS.professional_male;
    case 'marketing':
    case 'creative':
    case 'design':
      return VOICE_PRESETS.friendly_female;
    case 'customer service':
    case 'customer care':
    case 'support':
    case 'service':
      return VOICE_PRESETS.sia_friendly; // Use Sia for customer service departments
    default:
      return DEFAULT_VOICE_CONFIG;
  }
};

// Get all available voice presets
export const getAllVoicePresets = (): VoiceConfig[] => {
  return Object.values(VOICE_PRESETS);
};

// Get voice by ID
export const getVoiceById = (voiceId: string): VoiceConfig | null => {
  return Object.values(VOICE_PRESETS).find(voice => voice.voiceId === voiceId) || null;
};

// Get all Indian accent friendly voices
export const getIndianAccentVoices = (): VoiceConfig[] => {
  return Object.values(VOICE_PRESETS).filter(voice => 
    voice.accent.includes('Indian') || voice.name.includes('Indian')
  );
};

// Get best voice for Indian English interviews
export const getBestIndianVoice = (jobType?: string, department?: string): VoiceConfig => {
  if (jobType) {
    return getVoiceForJobType(jobType, true);
  }
  if (department) {
    return getVoiceForDepartment(department, true);
  }
  return VOICE_PRESETS.indian_friendly_female; // Default Indian-friendly voice
};
