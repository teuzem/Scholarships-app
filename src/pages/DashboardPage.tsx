import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Loader2, GraduationCap, Building2 } from 'lucide-react'

/**
 * Page Dashboard principale qui redirige intelligemment vers le bon tableau de bord
 * selon le type d'utilisateur (étudiant ou institution)
 */
export default function DashboardPage() {
  const { user, profile, loading } = useAuth()

  // Afficher un loading pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Chargement de votre tableau de bord...
          </h2>
          <p className="text-gray-600">
            Préparation de votre espace personnalisé
          </p>
        </Card>
      </div>
    )
  }

  // Rediriger vers la page d'authentification si non connecté
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Afficher un loading si le profil n'est pas encore chargé
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Chargement de votre profil...
          </h2>
          <p className="text-gray-600">
            Identification de votre type de compte
          </p>
        </Card>
      </div>
    )
  }

  // Redirection intelligente selon le type d'utilisateur
  if (profile.user_type === 'student') {
    return <Navigate to="/dashboard/student" replace />
  } else if (profile.user_type === 'institution') {
    return <Navigate to="/dashboard/institution" replace />
  }

  // Fallback: profil avec type d'utilisateur non reconnu
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-yellow-600 text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Type de compte non reconnu
        </h2>
        <p className="text-gray-600 mb-6">
          Votre profil ne semble pas avoir un type d'utilisateur valide. Veuillez contacter le support.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Étudiant</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Institution</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/profile'}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifier mon profil
            </button>
            <button
              onClick={() => window.location.href = '/auth'}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Se reconnecter
            </button>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Support: support@scholarconnect.com
          </p>
        </div>
      </Card>
    </div>
  )
}
