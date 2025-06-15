const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

console.log('=====================================================');
console.log('     COMPLETE NEXTAUTH FIX - PORT 3000 EDITION      ');
console.log('=====================================================');

// 1. Kill all Node.js processes (to free up port 3000)
try {
  console.log('1. Stopping all Node.js processes to free port 3000...');
  if (process.platform === 'win32') {
    // Windows
    execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
  } else {
    // macOS/Linux
    execSync('pkill -f node || true', { stdio: 'pipe' });
  }
  console.log('   ✓ Stopped Node.js processes');
} catch (error) {
  console.log('   ✓ No Node.js processes were running');
}

// 2. Fix the .env file
const envPath = path.join(__dirname, '.env');

try {
  console.log('\n2. Updating .env file...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Ensure NEXTAUTH_SECRET is set
  if (!envContent.includes('NEXTAUTH_SECRET=')) {
    const secret = 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d';
    envContent += `\nNEXTAUTH_SECRET="${secret}"`;
    console.log('   - Added NEXTAUTH_SECRET');
  }
  
  // Force NEXTAUTH_URL to be correct
  if (envContent.includes('NEXTAUTH_URL=')) {
    envContent = envContent.replace(
      /NEXTAUTH_URL=["'].*["']/g, 
      'NEXTAUTH_URL="http://localhost:3000"'
    );
    console.log('   - Updated NEXTAUTH_URL to http://localhost:3000');
  } else {
    envContent += '\nNEXTAUTH_URL="http://localhost:3000"';
    console.log('   - Added NEXTAUTH_URL');
  }
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('   ✓ .env file updated successfully');
} catch (error) {
  console.error('   ✗ Error updating .env file:', error.message);
}

// 3. Clear browser cookies script
console.log('\n3. Final steps to resolve authentication issues:');
console.log('   a. Clear ALL browser cookies and cache for localhost:');
console.log('      - Open DevTools (F12 or Command+Option+I)');
console.log('      - Go to Application tab > Storage > Cookies');
console.log('      - Select localhost and delete all cookies');
console.log('      - Also clear site data: Application > Storage > Clear site data');
console.log('   b. Use incognito/private window to access your app');
console.log('   c. Run the app in a new terminal with: npm run dev');
console.log('   d. Access the app at http://localhost:3000');
console.log('   e. When the login page appears, use:');
console.log('      - Name: Dev User');
console.log('      - Email: dev@example.com');

console.log('\n=====================================================');
console.log('PRO TIP: If your app still opens at port 3001:');
console.log('1. Check what\'s running on port 3000:');
console.log('   lsof -i :3000 | grep LISTEN');
console.log('2. Kill that process:');
console.log('   kill -9 <PID>');
console.log('3. Try again with:');
console.log('   npm run dev');
console.log('====================================================='); 