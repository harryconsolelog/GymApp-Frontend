// App configuration
// Update API_BASE_URL to match your NestJS backend
// For Android emulator: use 'http://10.0.2.2:3000/api'
// For iOS simulator: use 'http://localhost:3000/api'
// For physical device: use 'http://YOUR_COMPUTER_IP:3000/api'
// For web production: use 'https://your-api-domain.com/api'
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Web environment - use environment variable or default
    return process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || 'http://192.168.0.116:3000/api';
  }
  // Native environment
  return process.env.API_BASE_URL || 'http://192.168.0.116:3000/api';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  appName: 'WellVantage Demo App',
  version: '1.0.0',
  googleClientId: '1081445397208-5sj3o06ct73i182g4dn05k2r8eont345.apps.googleusercontent.com',
};

