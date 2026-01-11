// Script to inject environment variables into the build
// This is needed because Expo Metro bundler doesn't automatically inject env vars at build time

const fs = require('fs');
const path = require('path');

// Read environment variables with better logging
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || 'http://192.168.0.116:3000/api';
const oauthRedirectUri = process.env.REACT_APP_OAUTH_REDIRECT_URI;

console.log('Injecting environment variables...');
console.log('Checking environment variables:');
console.log('  - REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL || 'NOT SET');
console.log('  - API_BASE_URL:', process.env.API_BASE_URL || 'NOT SET');
console.log('  - REACT_APP_OAUTH_REDIRECT_URI:', process.env.REACT_APP_OAUTH_REDIRECT_URI || 'NOT SET');
console.log('Resolved API Base URL:', apiBaseUrl);
console.log('Resolved OAuth Redirect URI:', oauthRedirectUri || 'NOT SET');

// Validate API URL
if (!apiBaseUrl || apiBaseUrl === 'http://192.168.0.116:3000/api') {
  console.warn('WARNING: Using default/local API URL. Make sure REACT_APP_API_BASE_URL is set in Vercel!');
}

// Create a runtime config file that will be used by the app
const configContent = `// Auto-generated config file - DO NOT EDIT
// This file is generated at build time with environment variables
// Generated at: ${new Date().toISOString()}
export const runtimeConfig = {
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
  oauthRedirectUri: ${oauthRedirectUri ? JSON.stringify(oauthRedirectUri) : 'null'},
};
`;

// Ensure the directory exists
const configDir = path.join(__dirname, '../src/config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Write the config file
const configPath = path.join(configDir, 'runtimeConfig.js');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('Environment variables injected to:', configPath);

