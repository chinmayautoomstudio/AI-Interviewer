# Scripts Directory

This directory contains utility scripts for development, testing, and database management.

## Directory Structure

### `/setup/` - Setup & Installation Scripts (8 files)
Scripts for configuring the development environment and external services.

- `setup-env-file.js` - Environment file setup
- `setup-env-webhook.js` - Webhook environment configuration
- `setup-amazon-polly.js` - Amazon Polly TTS configuration
- `setup-amazon-transcribe.js` - Amazon Transcribe setup
- `setup-elevenlabs.js` - ElevenLabs API setup
- `install-aws-sdk.js` - AWS SDK installation helper
- `get-aws-credentials.js` - AWS credentials retrieval
- `get-aws-polly-credentials.js` - AWS Polly credentials helper

### `/testing/` - Testing & Debug Scripts (8 files)
Scripts for testing functionality and debugging issues.

- `test-n8n-webhook.js` - Test n8n webhook connectivity
- `test-text-evaluation.js` - Test text evaluation functionality
- `test-env-setup.js` - Verify environment setup
- `test-exam-response-saving.js` - Test exam response persistence
- `manual-text-evaluation-test.js` - Manual text evaluation testing
- `test-text-evaluation-db-update.js` - Test database updates for evaluations
- `debug-exam-interface.js` - Debug exam interface issues
- `browser-console-check.js` - Browser console verification

### `/database/` - Database Utility Scripts (8 files)
Scripts for database operations, seeding, and maintenance.

- `add-questions-to-db.js` - Add questions to database
- `add-web-dev-agent.js` - Add web development AI agent
- `add-web-dev-intern-questions.js` - Add intern questions (ES6 modules)
- `add-web-dev-intern-questions-cjs.js` - Add intern questions (CommonJS)
- `bulk-insert-candidates.js` - Bulk candidate insertion
- `check-database-schema.js` - Verify database schema
- `update-webhook-url.js` - Update webhook URLs in database
- `create-rohan-credentials.js` - Create specific user credentials

### `/data/` - Sample Data Generation (2 files)
Scripts for generating sample/test data.

- `generate-sample-questions.js` - Generate sample questions
- `sample-questions-data.js` - Sample questions data definitions

### Root Scripts (24 files)
General-purpose scripts and data importers.

**Build & Deployment:**
- `build.js` - Build script
- `copy-functions.js` - Copy Netlify functions

**Question Management:**
- `import-c-cpp-from-json.js` - Import C/C++ questions
- `import-html-css-from-json.js` - Import HTML/CSS questions
- `import-js-from-json.js` - Import JavaScript questions
- `import-php-from-json.js` - Import PHP questions
- `insert-50-c-cpp-questions.js` - Insert C/C++ questions
- `insert-50-web-dev-questions.js` - Insert web dev questions
- `insert-simple-questions.js` - Insert simple test questions
- `insert-web-dev-questions.js` - Insert web dev questions
- `insert-web-dev-questions-fixed.js` - Fixed web dev questions insert

**Question Tagging & Mapping:**
- `tag-c-cpp-subtopics.js` - Tag C/C++ subtopics
- `tag-html-css-subtopics.js` - Tag HTML/CSS subtopics
- `tag-js-subtopics.js` - Tag JavaScript subtopics
- `tag-php-subtopics.js` - Tag PHP subtopics
- `map-c-cpp-to-jd.js` - Map C/C++ questions to job descriptions

**Utilities:**
- `check-questions-difficulty.js` - Verify question difficulty levels
- `check-schema.js` - Database schema checker
- `create-email-logs-table.js` - Create email logs table
- `debug-exam-results.js` - Debug exam result issues
- `fix-notification-issues.js` - Fix notification problems
- `remove-duplicate-questions.js` - Remove duplicate questions
- `set-webdev-intern-distribution.js` - Set question distribution
- `load-env-quiet.js` - Load environment variables quietly

## Usage

### Running Setup Scripts
```bash
node scripts/setup/setup-env-file.js
node scripts/setup/setup-amazon-polly.js
```

### Running Tests
```bash
node scripts/testing/test-n8n-webhook.js
node scripts/testing/test-exam-response-saving.js
```

### Database Operations
```bash
node scripts/database/add-questions-to-db.js
node scripts/database/bulk-insert-candidates.js
```

### Data Generation
```bash
node scripts/data/generate-sample-questions.js
```

## Notes

- Most scripts require environment variables to be set in `.env` file
- Database scripts require Supabase connection details
- Test scripts may require active n8n workflows
- Some scripts use ES6 modules, others use CommonJS

## Related Directories

- `/prompts/` - Contains AI prompt definitions (10 JS files)
- `/netlify/functions/` - Serverless functions (2 JS files)
- Root directory - Contains only essential config files (.eslintrc.js, tailwind.config.js, postcss.config.js)
