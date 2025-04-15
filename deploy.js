/**
 * Simple deployment helper script
 * 
 * Usage:
 * node deploy.js "Your commit message"
 */

import { execSync } from 'child_process';
import path from 'path';

// Get commit message from command line argument
const commitMessage = process.argv[2] || 'Update application files';

try {
  // Functions to execute shell commands
  function runCommand(command) {
    console.log(`\n> ${command}`);
    return execSync(command, { stdio: 'inherit' });
  }

  // Git operations
  console.log('🚀 Starting deployment process...');
  
  console.log('\n📦 Checking Git status...');
  runCommand('git status');
  
  console.log('\n📦 Adding all changes...');
  runCommand('git add .');
  
  console.log('\n📦 Committing changes...');
  runCommand(`git commit -m "${commitMessage}"`);
  
  console.log('\n📦 Pushing to remote repository...');
  runCommand('git push');
  
  console.log('\n✅ Git operations completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Deploy the backend: Go to your Render.com dashboard');
  console.log('2. Deploy the frontend: Run "npm run deploy:client"');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
} 