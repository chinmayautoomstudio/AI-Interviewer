// Quiet dotenv loader to suppress informational messages
const fs = require('fs');
const path = require('path');

function loadEnvQuiet() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    // Parse key=value pairs
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      return;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    // Remove quotes if present
    const cleanValue = value.replace(/^["']|["']$/g, '');

    // Only set if not already set
    if (!process.env[key]) {
      process.env[key] = cleanValue;
    }
  });
}

module.exports = { loadEnvQuiet };
