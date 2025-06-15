const fs = require('fs');
const path = require('path');

// Read the current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Error reading .env file:', error);
  process.exit(1);
}

// Update NEXTAUTH_URL to ensure it's set to the correct port
let newContent = envContent;

// Check if the server is running on a non-default port
if (envContent.includes('NEXTAUTH_URL="http://localhost:3001"')) {
  console.log('NEXTAUTH_URL already set to port 3001, no changes needed');
} else {
  // Replace any existing NEXTAUTH_URL with the correct port
  if (envContent.includes('NEXTAUTH_URL=')) {
    newContent = envContent.replace(/NEXTAUTH_URL=["']http:\/\/localhost:\d+["']/g, 'NEXTAUTH_URL="http://localhost:3000"');
    console.log('Updated NEXTAUTH_URL to port 3000');
  } else {
    newContent += '\nNEXTAUTH_URL="http://localhost:3000"';
    console.log('Added NEXTAUTH_URL with port 3000');
  }
}

// Only write if changes were made
if (newContent !== envContent) {
  try {
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log('.env file has been updated successfully');
  } catch (error) {
    console.error('Error writing to .env file:', error);
    process.exit(1);
  }
} else {
  console.log('No changes needed in .env file');
}

console.log('\nImportant instructions to fix authentication:');
console.log('1. Stop your Next.js server');
console.log('2. Clear your browser cookies and cache for localhost');
console.log('3. Start the server with: npm run dev');
console.log('4. Try signing in again at http://localhost:3000');
console.log('\nIf you still experience issues:');
console.log('- Check if anything is running on port 3000 and stop it');
console.log('- Run: lsof -i :3000 | grep LISTEN');
console.log('- Then kill the process: kill -9 [PID]'); 