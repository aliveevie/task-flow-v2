// API Configuration
// Automatically detects environment and uses appropriate API URL

const getApiUrl = (): string => {
  // Check if we're in production (hosted on taskflow.galaxyitt.com.ng)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain
    if (hostname === 'taskflow.galaxyitt.com.ng' || hostname === 'www.taskflow.galaxyitt.com.ng') {
      // API is on separate server at 10.1.1.205:3000
      // CORS is configured on the server to allow this domain
      return 'http://10.1.1.205:3000/api';
      
      // Alternative options (uncomment if you move API):
      // Option 1: API on same domain, different port
      // return `${protocol}//${hostname}:3000/api`;
      
      // Option 2: API on subdomain
      // return `${protocol}//api.galaxyitt.com.ng/api`;
      
      // Option 3: API on same domain, proxy through /api (requires .htaccess proxy)
      // return `${protocol}//${hostname}/api`;
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

