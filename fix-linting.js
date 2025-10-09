const fs = require('fs');
const path = require('path');

// Files and their fixes
const fixes = [
  {
    file: 'src/components/interview/VoiceRecorder.tsx',
    fixes: [
      { line: 453, replace: 'const recordAudioForWhisper = async', with: '// const recordAudioForWhisper = async' },
      { line: 794, replace: 'const stopVoiceRecording = () => {', with: '// const stopVoiceRecording = () => {' }
    ]
  },
  {
    file: 'src/components/layout/Header.tsx',
    fixes: [
      { line: 18, replace: 'const isMobile =', with: '// const isMobile =' }
    ]
  },
  {
    file: 'src/components/modals/AdvancedAddJobDescriptionModal.tsx',
    fixes: [
      { line: 3, replace: "import { Input,", with: "import { // Input," },
      { line: 6, replace: "Plus,", with: "// Plus," },
      { line: 112, replace: 'const customId =', with: '// const customId =' },
      { line: 541, replace: 'const data =', with: '// const data =' }
    ]
  },
  {
    file: 'src/components/modals/ResumeViewerModal.tsx',
    fixes: [
      { line: 5, replace: "X,", with: "// X," },
      { line: 23, replace: 'const [loading, setLoading] =', with: 'const [loading] =' }
    ]
  },
  {
    file: 'src/components/modals/ScheduleInterviewModal.tsx',
    fixes: [
      { line: 2, replace: "X,", with: "// X," }
    ]
  },
  {
    file: 'src/pages/AIAgentsPage.tsx',
    fixes: [
      { line: 12, replace: "Eye,", with: "// Eye," },
      { line: 14, replace: "Settings,", with: "// Settings," },
      { line: 15, replace: "Zap,", with: "// Zap," },
      { line: 28, replace: 'const navigate =', with: '// const navigate =' }
    ]
  }
];

// Apply fixes
fixes.forEach(({ file, fixes: fileFixes }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    fileFixes.forEach(({ line, replace, with: replacement }) => {
      const lines = content.split('\n');
      if (lines[line - 1] && lines[line - 1].includes(replace)) {
        lines[line - 1] = lines[line - 1].replace(replace, replacement);
        content = lines.join('\n');
      }
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});

console.log('Linting fixes applied!');
