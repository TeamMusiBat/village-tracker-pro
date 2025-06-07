import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Check role-based access if roles are specified
  if (roles && !roles.includes(user.role)) {
    // For restricted routes, redirect to dashboard if user doesn't have permission
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
