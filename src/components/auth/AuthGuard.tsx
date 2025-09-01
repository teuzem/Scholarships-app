import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

/**
 * AuthGuard component that redirects authenticated users away from auth pages
 * and non-authenticated users to auth pages
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/dashboard',
  requireAuth = false 
}: AuthGuardProps) {
  const { user, loading } = useAuth()

  // Don't render anything while loading
  if (loading) {
    return null
  }

  // If user should be authenticated but isn't, redirect to auth
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (!requireAuth && user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
