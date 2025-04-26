const { execSync } = require('child_process');

// Run the React build process
console.log('Building React application...');
try {
  // Create a production build
  execSync('npx react-scripts build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}