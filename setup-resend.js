#!/usr/bin/env node

/**
 * Quick Resend Setup for Team Invitations
 * 
 * Resend is the recommended native email agent for this application
 */

console.log('🚀 Quick Resend Setup for Native Email\n');

console.log('Resend is already installed! Now follow these steps:\n');

console.log('1️⃣ Create Resend Account:');
console.log('   📱 Go to: https://resend.com');
console.log('   ✅ Sign up for free account');
console.log('   🎁 Free tier: 3,000 emails/month\n');

console.log('2️⃣ Add Your Domain:');
console.log('   🌐 Add your domain in Resend dashboard');
console.log('   📧 Verify DNS records');
console.log('   ✨ Or use Resend\'s testing domain for development\n');

console.log('3️⃣ Create API Key:');
console.log('   🔑 Go to API Keys section');
console.log('   ➕ Create new API key');
console.log('   📋 Copy the key (starts with "re_")\n');

console.log('4️⃣ Update Your .env File:');
console.log('   Add these lines to your .env file:');
console.log('   ```');
console.log('   RESEND_API_KEY=re_your_api_key_here');
console.log('   EMAIL_FROM="AI Content Repurposer Studio <noreply@yourdomain.com>"');
console.log('   NEXTAUTH_URL=http://localhost:3000');
console.log('   ```\n');

console.log('5️⃣ For Development (Using Resend Test Domain):');
console.log('   If you don\'t have a domain yet, you can use:');
console.log('   EMAIL_FROM="AI Content Repurposer Studio <onboarding@resend.dev>"\n');

console.log('6️⃣ Test the Setup:');
console.log('   🔄 Restart your dev server: npm run dev');
console.log('   👥 Go to Team Settings');
console.log('   📤 Send a test invitation');
console.log('   📧 Check recipient inbox\n');

console.log('✨ Benefits of Resend:');
console.log('   ✅ 99.9% deliverability rate');
console.log('   ✅ Built-in analytics');
console.log('   ✅ Simple, clean API');
console.log('   ✅ React Email support');
console.log('   ✅ Webhook support');
console.log('   ✅ Great documentation\n');

console.log('🛟 Need Help?');
console.log('   📚 Resend Docs: https://resend.com/docs');
console.log('   💬 Support: https://resend.com/support');
console.log('   🔧 Check server logs for detailed error messages\n');

console.log('🎉 Once configured, your team invitations will be sent via Resend!'); 