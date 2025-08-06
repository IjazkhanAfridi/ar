import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { User } from '@/lib/schema';
import { Layout } from '../layout/Layout';

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  restrictAdmin = false 
}) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { user, isAuthenticated } = await authUtils.checkAuth();
      setUser(user);
      setIsAuthenticated(isAuthenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user is admin and this route restricts admin access, redirect to admin dashboard
  if (restrictAdmin && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Wrap children with Layout and pass user data
  return (
    <Layout user={user} onUserUpdate={setUser}>
      {children}
    </Layout>
  );
}