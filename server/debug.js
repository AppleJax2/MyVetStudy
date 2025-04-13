const fs = require('fs');
const path = require('path');

// Print current working directory
console.log('Current directory:', process.cwd());

// Check if dist directory exists
const distDir = path.join(process.cwd(), 'dist');
console.log('Looking for dist directory at:', distDir);
console.log('Dist directory exists:', fs.existsSync(distDir));

// Check if server/dist directory exists (one level up)
const serverDistDir = path.join(process.cwd(), '..', 'server', 'dist');
console.log('Looking for server/dist directory at:', serverDistDir);
console.log('server/dist directory exists:', fs.existsSync(serverDistDir));

// List directories at the current level
console.log('\nDirectories at current level:');
try {
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    const stats = fs.statSync(path.join(process.cwd(), file));
    console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
  });
} catch (err) {
  console.error('Error listing directories:', err);
}

// List parent directory
console.log('\nDirectories at parent level:');
try {
  const parentDir = path.join(process.cwd(), '..');
  const files = fs.readdirSync(parentDir);
  files.forEach(file => {
    const stats = fs.statSync(path.join(parentDir, file));
    console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
  });
} catch (err) {
  console.error('Error listing parent directories:', err);
} 