// Clear Admin Tokens Utility
// Run this in browser console if experiencing JWT malformed errors

console.log('Clearing all admin tokens...');

// Clear all possible admin token keys
const tokenKeys = [
  'admin_token',
  'adminToken', 
  'admin-token',
  'ADMIN_TOKEN'
];

tokenKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`Removing ${key} from localStorage`);
    localStorage.removeItem(key);
  }
});

// Clear any admin-related session storage
tokenKeys.forEach(key => {
  if (sessionStorage.getItem(key)) {
    console.log(`Removing ${key} from sessionStorage`);
    sessionStorage.removeItem(key);
  }
});

console.log('All admin tokens cleared. Please log in again.');
console.log('If the issue persists, check that ADMIN_JWT_SECRET is properly set in your environment.'); 