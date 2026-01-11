// App configuration
// Update API_BASE_URL to match your NestJS backend
// For Android emulator: use 'http://10.0.2.2:3000/api'
// For iOS simulator: use 'http://localhost:3000/api'
// For physical device: use 'http://YOUR_COMPUTER_IP:3000/api'
// For web production: use 'https://your-api-domain.com/api'

// Function to get runtime config (lazy loaded to ensure it's available)
// Cache it to avoid multiple require calls, but allow it to be refreshed
let runtimeConfigCache = null;
let runtimeConfigLoadAttempted = false;

const getRuntimeConfig = () => {
  // Only try to load once per session to avoid repeated require calls
  if (!runtimeConfigLoadAttempted) {
    runtimeConfigLoadAttempted = true;
    try {
      // Use require instead of import for better compatibility with Metro bundler
      // In production builds, this file will exist with the injected env vars
      const runtimeConfigModule = require('./runtimeConfig');
      runtimeConfigCache = runtimeConfigModule?.runtimeConfig || null;
    } catch (e) {
      // Runtime config not available (development or first build)
      // This is expected in development - we'll fall back to process.env
      runtimeConfigCache = null;
    }
  }
  return runtimeConfigCache;
};

const getApiBaseUrl = () => {
  // Always try to get fresh runtime config
  const runtimeConfig = getRuntimeConfig();
  
  if (typeof window !== 'undefined') {
    // Web environment - try multiple sources in order of priority:
    // 1. Runtime config (injected at build time from Vercel env vars)
    // 2. process.env (works in development)
    // 3. window.__ENV__ (for runtime injection if needed)
    // 4. Default fallback
    
    const apiUrl = 
      (runtimeConfig && runtimeConfig.apiBaseUrl) ||
      window.__ENV__?.API_BASE_URL ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) || 
      (typeof process !== 'undefined' && process.env?.API_BASE_URL) || 
      'http://192.168.0.116:3000/api';
    
    return apiUrl;
  }
  // Native environment
  const nativeRuntimeConfig = getRuntimeConfig();
  return (nativeRuntimeConfig && nativeRuntimeConfig.apiBaseUrl) ||
         (typeof process !== 'undefined' && process.env?.API_BASE_URL) || 
         'http://192.168.0.116:3000/api';
};

// Use a getter so apiBaseUrl is evaluated each time it's accessed
// This ensures it always gets the latest value, especially important for web builds
export const config = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  appName: 'WellVantage Demo App',
  version: '1.0.0',
  googleClientId: '1081445397208-5sj3o06ct73i182g4dn05k2r8eont345.apps.googleusercontent.com',
};

