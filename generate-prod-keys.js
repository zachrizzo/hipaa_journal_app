const crypto = require('crypto');

// Generate secure random strings
console.log('=== Production Environment Variables ===\n');

// Generate NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);

// Generate ENCRYPTION_KEY (must be exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log(`ENCRYPTION_KEY="${encryptionKey}"`);

// Generate DATA_ENCRYPTION_KEY (must be exactly 32 characters)
const dataEncryptionKey = crypto.randomBytes(16).toString('hex');
console.log(`DATA_ENCRYPTION_KEY="${dataEncryptionKey}"`);

console.log('\n=== Additional Required Variables ===\n');
console.log('NEXTAUTH_URL="https://hipaa-journal-app-14ea.vercel.app"');
console.log('\n=== Important ===');
console.log('1. Replace your OPENAI_API_KEY with a new one after it was exposed');
console.log('2. Add all these variables to Vercel');
console.log('3. Never commit these production keys to git');