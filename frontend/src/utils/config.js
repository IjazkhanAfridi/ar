// API configuration
const getApiBaseUrl = () => {
  // In production, always use same origin (backend serves frontend)
  if (import.meta.env.PROD) {
    return '';  // Empty string means same origin
  }
  
  // In development, use localhost backend
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
