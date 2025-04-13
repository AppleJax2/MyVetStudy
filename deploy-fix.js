#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===== MyVetStudy Deployment Fix Script =====');
console.log('Current working directory:', process.cwd());

// Check if we're in the project root
const isProjectRoot = fs.existsSync('package.json') && 
                     fs.existsSync('server') && 
                     fs.existsSync('vite.config.ts');

if (!isProjectRoot) {
  console.error('Error: This script must be run from the project root directory.');
  process.exit(1);
}

// Create .env files if they don't exist
console.log('\n=== Checking environment files ===');
const envFiles = [
  { path: '.env', template: 'VITE_API_URL=http://localhost:3000/api' },
  { path: 'server/.env', template: 'DATABASE_URL="postgresql://postgres:password@localhost:5432/myvetstudydb"\nJWT_SECRET="dev-secret-key"\nJWT_EXPIRES_IN="1d"\nNODE_ENV="development"\nPORT=3000\nCLIENT_URL="http://localhost:5173"' }
];

envFiles.forEach(({ path: filePath, template }) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating ${filePath} with default template`);
    fs.writeFileSync(filePath, template);
  } else {
    console.log(`${filePath} already exists`);
  }
});

// Check build process
console.log('\n=== Checking frontend build ===');
try {
  console.log('Building frontend...');
  execSync('npm install && npm run build', { stdio: 'inherit' });
  
  if (fs.existsSync('dist')) {
    console.log('✅ Frontend build successful! dist directory created');
  } else {
    console.log('❌ Frontend build failed - dist directory not created');
  }
} catch (error) {
  console.error('❌ Frontend build failed with error:', error.message);
}

// Check server build
console.log('\n=== Checking server build ===');
try {
  console.log('Building server...');
  execSync('cd server && npm install && npm run build', { stdio: 'inherit' });
  
  if (fs.existsSync('server/dist')) {
    console.log('✅ Server build successful! server/dist directory created');
  } else {
    console.log('❌ Server build failed - server/dist directory not created');
  }
} catch (error) {
  console.error('❌ Server build failed with error:', error.message);
}

// Print deployment guidelines
console.log('\n===== Deployment Guidelines =====');
console.log('1. Backend (Render.com):');
console.log('   - Build Command: cd server && npm install && npm run build && npx prisma generate && npx prisma migrate deploy');
console.log('   - Start Command: node server/dist/index.js');
console.log('\n2. Frontend (Netlify):');
console.log('   - Base directory: Leave blank (root of repository)');
console.log('   - Build command: npm install && npm run build');
console.log('   - Publish directory: dist');
console.log('\nMake sure to set the correct environment variables in both platforms!'); 