// API Configuration
// Automatically detects environment and uses appropriate API URL

const getApiUrl = (): string => {
  // Check if we're in production (hosted on taskflow.galaxyitt.com.ng)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain
    if (hostname === 'taskflow.galaxyitt.com.ng' || hostname === 'www.taskflow.galaxyitt.com.ng') {
      // Use direct IP - CORS is configured on server to allow this domain
      // Note: This will cause mixed content warning, but will work
      // For production, consider setting up API on subdomain or enabling HTTPS on backend
      return 'http://api.galaxyitt.com.ng:3000/api';
    }
    
    // Development/local
    return 'http://api.galaxyitt.com.ng:3000/api';
  }
  
  // Fallback for SSR
  return 'http://api.galaxyitt.com.ng:3000/api';
};

export const API_URL = getApiUrl();

// Export function to get base URL (without /api)
export const getBaseUrl = (): string => {
  return API_URL.replace('/api', '');
};

