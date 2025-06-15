const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to clear NextAuth cookies in Chrome cookie storage
// This is for development purposes to fix JWT decryption issues
function clearNextAuthCookies() {
  console.log('============================================================');
  console.log('       AUTHENTICATION ISSUE RESOLUTION INSTRUCTIONS');
  console.log('============================================================');
  
  console.log('\n1. CLEAR BROWSER COOKIES AND CACHE:');
  console.log('   a. Close all browser tabs accessing your app');
  console.log('   b. Open browser DevTools (F12 or Command+Option+I)');
  console.log('   c. Go to Application tab > Storage > Cookies');
  console.log('   d. Select your domain (localhost)');
  console.log('   e. Delete all cookies, especially "next-auth.session-token"');
  console.log('   f. Also clear site data: Application > Storage > Clear site data');
  
  console.log('\n2. CHECK PORT AND ENVIRONMENT SETUP:');
  console.log('   a. Ensure .env has correct NEXTAUTH_URL matching your port');
  console.log('   b. Current port in .env should be: http://localhost:3000');
  
  console.log('\n3. RESTART YOUR SERVER:');
  console.log('   a. Stop your Next.js server (Ctrl+C)');
  console.log('   b. Run: npm run dev');
  console.log('   c. The server should now run on port 3000');
  
  console.log('\n4. BROWSER IN PRIVATE/INCOGNITO MODE:');
  console.log('   a. Try accessing your app in a private browser window');
  console.log('   b. This eliminates cookie-related issues');
  
  console.log('\n5. CREDENTIAL PROVIDER LOGIN:');
  console.log('   a. Use the following credentials for dev login:');
  console.log('      - Name: Dev User');
  console.log('      - Email: dev@example.com');

  console.log('\n============================================================');
  console.log('If you still experience issues:');
  console.log('- Ensure nothing else is running on port 3000');
  console.log('- Run: lsof -i :3000 | grep LISTEN');
  console.log('- Kill any blocking process: kill -9 [PID]');
  console.log('- Check for CSRF/XSRF protection issues in NextAuth config');
  console.log('============================================================');
}

// Run the function
clearNextAuthCookies(); 