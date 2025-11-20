// API Configuration
// Automatically detects environment and uses appropriate API URL

const getApiUrl = (): string => {
  // Check if we're in production (hosted on taskflow.galaxyitt.com.ng)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain
    if (hostname === 'taskflow.galaxyitt.com.ng' || hostname === 'www.taskflow.galaxyitt.com.ng') {
      // Use same domain with proxy (avoids mixed content and CORS issues)
      // .htaccess will proxy /api/* requests to http://10.1.1.205:3000/api/*
      return `${protocol}//${hostname}/api`;
    }
    
    // Development/local
    return 'http://10.1.1.205:3000/api';
  }
  
  // Fallback for SSR
  return 'http://10.1.1.205:3000/api';
};

export const API_URL = getApiUrl();

// Export function to get base URL (without /api)
export const getBaseUrl = (): string => {
  return API_URL.replace('/api', '');
};

