import { buildApiUrl } from './config.js';

export const authUtils = {
  async checkAuth() {
    try {
      const response = await fetch(buildApiUrl('/api/auth/verify'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Handle the nested response structure: data.data.user
        const user = data.data?.user || data.user;
        return { user, isAuthenticated: true };
      }
      return { user: null, isAuthenticated: false };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { user: null, isAuthenticated: false };
    }
  },

  async login(email, password) {
    const response = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    // Handle the nested response structure: data.data.user or data.user
    return data.data?.user || data.user;
  },

  async logout() {
    try {
      await fetch(buildApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async register(email, password, name) {
    const response = await fetch(buildApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    // Handle the nested response structure: data.data.user or data.user
    return data.data?.user || data.user;
  },
};
