const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy netlify functions to build directory (skip if netlify folder missing, e.g. Coolify)
try {
  if (!fs.existsSync('netlify')) {
    console.log('No netlify folder found, skipping functions copy.');
    process.exit(0);
  }
  console.log('Copying netlify functions to build directory...');
  copyDir('netlify', 'build/netlify');
  console.log('✅ Functions copied successfully!');
} catch (error) {
  console.error('❌ Error copying functions:', error.message);
  process.exit(1);
}
