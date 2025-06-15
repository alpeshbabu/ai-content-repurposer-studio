#!/usr/bin/env node

/**
 * Email Configuration Setup for Team Invitations
 * 
 * This script helps you set up email configuration so that team invitations
 * can be sent automatically. You can use Gmail, Outlook, or any SMTP server.
 */

console.log('📧 Email Configuration Setup for Team Invitations\n');

console.log('To enable team invitation emails, you need to set up the following environment variables:');
console.log('Add these to your .env file:\n');

console.log('# Email Configuration for Team Invitations');
console.log('EMAIL_SERVER_HOST=smtp.gmail.com');
console.log('EMAIL_SERVER_PORT=587');
console.log('EMAIL_SERVER_USER=your-email@gmail.com');
console.log('EMAIL_SERVER_PASSWORD=your-app-password');
console.log('EMAIL_FROM=your-email@gmail.com');
console.log('NEXTAUTH_URL=http://localhost:3000  # or your domain in production\n');

console.log('📋 Common SMTP Settings:\n');

console.log('🟢 Gmail:');
console.log('  HOST: smtp.gmail.com');
console.log('  PORT: 587');
console.log('  Note: Use App Passwords, not your regular password');
console.log('  Setup: https://support.google.com/accounts/answer/185833\n');

console.log('🔵 Outlook/Hotmail:');
console.log('  HOST: smtp-mail.outlook.com');
console.log('  PORT: 587\n');

console.log('🟡 Yahoo:');
console.log('  HOST: smtp.mail.yahoo.com');
console.log('  PORT: 587\n');

console.log('🟠 Custom SMTP:');
console.log('  Use your hosting provider\'s SMTP settings\n');

console.log('⚡ Quick Setup for Gmail:');
console.log('1. Go to your Google Account settings');
console.log('2. Security → 2-Step Verification (enable if not already)');
console.log('3. Security → App passwords');
console.log('4. Generate an app password for "Mail"');
console.log('5. Use that app password (not your regular password)\n');

console.log('🧪 Testing:');
console.log('After setting up, test by inviting a team member.');
console.log('Check the server logs to see if emails are being sent successfully.\n');

console.log('🔧 Example .env file:');
console.log('```');
console.log('EMAIL_SERVER_HOST=smtp.gmail.com');
console.log('EMAIL_SERVER_PORT=587');
console.log('EMAIL_SERVER_USER=yourapp@gmail.com');
console.log('EMAIL_SERVER_PASSWORD=abcd-efgh-ijkl-mnop');
console.log('EMAIL_FROM="AI Content Repurposer Studio <yourapp@gmail.com>"');
console.log('NEXTAUTH_URL=http://localhost:3000');
console.log('```\n');

console.log('💡 Tips:');
console.log('- The EMAIL_FROM can include a display name');
console.log('- Keep your app password secure and never commit it to git');
console.log('- In production, use your actual domain for NEXTAUTH_URL');
console.log('- Test with a real email address first\n');

console.log('✨ Once configured, team invitations will automatically send emails with:');
console.log('- Beautiful HTML templates');
console.log('- Direct invitation links');
console.log('- Expiration warnings');
console.log('- Mobile-friendly design\n');

console.log('Need help? Check the documentation or contact support.'); 