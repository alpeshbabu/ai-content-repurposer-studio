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

// Check if NEXTAUTH_SECRET and NEXTAUTH_URL already exist
const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET=');
const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');

// Generate content to add
let newContent = envContent;

if (!hasNextAuthSecret) {
  // Use the same secret that's in auth.ts
  const secret = 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d';
  newContent += `\nNEXTAUTH_SECRET="${secret}"`;
  console.log('Added NEXTAUTH_SECRET to .env');
}

if (!hasNextAuthUrl) {
  // Use port 3001 as shown in the terminal output
  newContent += '\nNEXTAUTH_URL="http://localhost:3001"';
  console.log('Added NEXTAUTH_URL to .env');
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

console.log('\nTo apply these changes:');
console.log('1. Restart your Next.js server');
console.log('2. Clear your browser cookies for localhost');
console.log('3. Try signing in again'); 