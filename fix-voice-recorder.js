const fs = require('fs');

// Read the file
const filePath = 'src/components/interview/VoiceRecorder.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the syntax error by adding the missing closing brace
// The return statement is outside of the component function
// We need to add a closing brace before the return statement

const lines = content.split('\n');
const returnLineIndex = lines.findIndex(line => line.trim() === 'return (') - 1;

if (returnLineIndex > 0) {
  // Add the missing closing brace before the return statement
  lines.splice(returnLineIndex, 0, '');
  lines.splice(returnLineIndex + 1, 0, '  return (');
  
  // Remove the original return line
  const originalReturnIndex = lines.findIndex(line => line.trim() === 'return (');
  if (originalReturnIndex > returnLineIndex + 1) {
    lines.splice(originalReturnIndex, 1);
  }
}

// Write the fixed content back
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed VoiceRecorder.tsx syntax error');
