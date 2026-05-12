const crypto = require('crypto');

// Generate a token that looks like a publishable API key
const token = 'pk_' + crypto.randomBytes(32).toString('hex');
console.log('Generated token:', token);

// Also test what Medusa expects
const testToken = 'pk_5865fd3aec135338e255c4536b601f6c26b28633830f4e64a5ac375aed7e11a8';

// Check if token has valid format
function isValidPublishableKey(key) {
  return key && key.startsWith('pk_') && key.length === 68;
}

console.log('Token valid:', isValidPublishableKey(testToken));