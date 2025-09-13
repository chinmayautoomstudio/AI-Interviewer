-- Add Voice Support to Interview Messages Table
-- This script adds voice-related columns to the existing interview_messages table

-- ==============================================
-- ADD VOICE SUPPORT COLUMNS
-- ==============================================

-- Add voice-related columns to interview_messages table
ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  voice_mode BOOLEAN DEFAULT FALSE;

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  audio_url TEXT;

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  audio_duration INTEGER; -- duration in seconds

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  original_audio_transcript TEXT; -- raw transcribed text from audio

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  transcription_confidence DECIMAL(3,2); -- STT confidence score (0.00-1.00)

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  transcription_language VARCHAR(10) DEFAULT 'en-US';

ALTER TABLE interview_messages ADD COLUMN IF NOT EXISTS 
  voice_metadata JSONB; -- voice-specific data (STT/TTS settings, etc.)

-- ==============================================
-- UPDATE MESSAGE TYPE ENUM
-- ==============================================

-- Update message_type to include voice-specific types
ALTER TABLE interview_messages DROP CONSTRAINT IF EXISTS interview_messages_message_type_check;
ALTER TABLE interview_messages ADD CONSTRAINT interview_messages_message_type_check 
  CHECK (message_type IN ('question', 'answer', 'system', 'error', 'instruction', 'voice_input', 'voice_response'));

-- ==============================================
-- CREATE INDEXES FOR VOICE QUERIES
-- ==============================================

-- Index for voice mode queries
CREATE INDEX IF NOT EXISTS idx_interview_messages_voice_mode ON interview_messages(voice_mode);

-- Index for audio URL queries
CREATE INDEX IF NOT EXISTS idx_interview_messages_audio_url ON interview_messages(audio_url) WHERE audio_url IS NOT NULL;

-- Index for transcription confidence
CREATE INDEX IF NOT EXISTS idx_interview_messages_transcription_confidence ON interview_messages(transcription_confidence) WHERE transcription_confidence IS NOT NULL;

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Verify columns were added
SELECT 
    'Voice Support Columns Added' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'interview_messages' 
    AND table_schema = 'public'
    AND column_name IN ('voice_mode', 'audio_url', 'audio_duration', 'original_audio_transcript', 'transcription_confidence', 'transcription_language', 'voice_metadata')
ORDER BY column_name;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Voice Support Added to Interview Messages!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'New columns added:';
    RAISE NOTICE '- voice_mode (BOOLEAN) ✓';
    RAISE NOTICE '- audio_url (TEXT) ✓';
    RAISE NOTICE '- audio_duration (INTEGER) ✓';
    RAISE NOTICE '- original_audio_transcript (TEXT) ✓';
    RAISE NOTICE '- transcription_confidence (DECIMAL) ✓';
    RAISE NOTICE '- transcription_language (VARCHAR) ✓';
    RAISE NOTICE '- voice_metadata (JSONB) ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Message types updated:';
    RAISE NOTICE '- Added voice_input and voice_response ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created for voice queries ✓';
    RAISE NOTICE '==============================================';
END $$;

