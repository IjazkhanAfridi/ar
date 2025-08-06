import { QueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '@/utils/config.js';

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// API request helper function
export async function apiRequest(url, options = {}) {
  // Build the full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : buildApiUrl(url);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  // If body is provided and not FormData, stringify it
  if (config.body && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(fullUrl, config);

  // Handle different response types
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If parsing JSON fails, use the default error message
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like DELETE operations)
  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null;
  }

  // Try to parse JSON response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  // Return text for non-JSON responses
  return await response.text();
}

// Convenience methods for different HTTP verbs
export const api = {
  get: (url, options = {}) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: data,
    }),
  put: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: data,
    }),
  delete: (url, options = {}) =>
    apiRequest(url, { ...options, method: 'DELETE' }),
  patch: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: 'PATCH',
      body: data,
    }),
};

export default queryClient;
