
const { execSync } = require('child_process');

// Install serve if not already installed
try {
  console.log('Installing serve package...');
  execSync('npm install -g serve', { stdio: 'inherit' });
  
  // Serve the built application with SPA configuration
  console.log('Starting server on port 5000...');
  execSync('serve -s build -l 5000 --single', { stdio: 'inherit' });
} catch (error) {
  console.error('Server error:', error);
  process.exit(1);
}
