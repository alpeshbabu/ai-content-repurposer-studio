const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=====================================================');
console.log('      NEXTAUTH AUTHENTICATION ISSUE FIXER');
console.log('=====================================================');

// 1. Fix the .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  console.log('1. Checking .env file...');
  envContent = fs.readFileSync(envPath, 'utf8');
  
  // Ensure NEXTAUTH_SECRET is present
  if (!envContent.includes('NEXTAUTH_SECRET=')) {
    const secret = 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d';
    envContent += `\nNEXTAUTH_SECRET="${secret}"`;
    console.log('   - Added NEXTAUTH_SECRET');
  } else {
    console.log('   - NEXTAUTH_SECRET already exists');
  }
  
  // Fix NEXTAUTH_URL to ensure it's set to port 3000
  if (envContent.includes('NEXTAUTH_URL=')) {
    envContent = envContent.replace(
      /NEXTAUTH_URL=["']http:\/\/localhost:\d+["']/g, 
      'NEXTAUTH_URL="http://localhost:3000"'
    );
    console.log('   - Updated NEXTAUTH_URL to port 3000');
  } else {
    envContent += '\nNEXTAUTH_URL="http://localhost:3000"';
    console.log('   - Added NEXTAUTH_URL with port 3000');
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('   ✓ .env file updated successfully');
} catch (error) {
  console.error('   ✗ Error with .env file:', error.message);
}

// 2. Check if port 3000 is available
try {
  console.log('\n2. Checking port 3000 availability...');
  
  let isPortInUse = false;
  try {
    // This will throw an error if no process is using port 3000
    execSync('lsof -i :3000 | grep LISTEN', { stdio: 'pipe' });
    isPortInUse = true;
  } catch (e) {
    // If we get here, nothing is using port 3000, which is good
  }
  
  if (isPortInUse) {
    console.log('   ⚠ Port 3000 is in use. You should:');
    console.log('     - Find the process: lsof -i :3000 | grep LISTEN');
    console.log('     - Kill it: kill -9 [PID]');
  } else {
    console.log('   ✓ Port 3000 is available');
  }
} catch (error) {
  console.error('   ✗ Error checking port:', error.message);
}

// 3. Display final instructions
console.log('\n3. Final steps to resolve authentication issues:');
console.log('   a. Stop your Next.js server if it\'s running (Ctrl+C)');
console.log('   b. Clear browser cookies and cache for localhost:');
console.log('      - Open DevTools (F12 or Command+Option+I)');
console.log('      - Go to Application tab > Storage > Cookies');
console.log('      - Delete all cookies for localhost');
console.log('      - Also clear site data: Application > Storage > Clear site data');
console.log('   c. Restart your server: npm run dev');
console.log('   d. Try accessing your app at http://localhost:3000');
console.log('   e. For development login, use:');
console.log('      - Name: Dev User');
console.log('      - Email: dev@example.com');

console.log('\n=====================================================');
console.log('For persistent issues:');
console.log('1. Try using an incognito/private browser window');
console.log('2. Check for NextAuth configuration issues');
console.log('3. Look for CSRF token mismatches');
console.log('4. Ensure the database is properly set up');
console.log('====================================================='); 