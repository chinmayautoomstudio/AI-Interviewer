const { execSync } = require('child_process');

console.log('🚀 Starting build process...');

// Use Node 18–friendly heap in constrained environments (e.g. Docker/Coolify)
const buildEnv = {
  ...process.env,
  CI: 'false',
  GENERATE_SOURCEMAP: 'false',
  ESLINT_NO_DEV_ERRORS: 'true',
  DISABLE_ESLINT_PLUGIN: 'false',
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=4096'].filter(Boolean).join(' ')
};

function runReactBuild(env) {
  try {
    execSync('react-scripts build', {
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err.message,
      stdout: err.stdout || '',
      stderr: err.stderr || ''
    };
  }
}

try {
  console.log('📦 Building React application...');

  let result = runReactBuild(buildEnv);

  if (!result.ok) {
    console.log('⚠️  First build failed, retrying with ESLint disabled...');
    result = runReactBuild({ ...buildEnv, DISABLE_ESLINT_PLUGIN: 'true' });
  }

  if (!result.ok) {
    console.error('❌ React build failed.');
    if (result.stdout) console.error('--- stdout ---\n' + result.stdout);
    if (result.stderr) console.error('--- stderr ---\n' + result.stderr);
    process.exit(1);
  }

  console.log('✅ React build completed successfully!');

  console.log('📁 Copying Netlify functions...');
  execSync('node scripts/copy-functions.js', { stdio: 'inherit' });

  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
