import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Check for error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          setStatus('error')
          setMessage(errorDescription || error)
          return
        }

        // Get the hash fragment from the URL
        const hashFragment = window.location.hash
        
        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Error getting session:', sessionError)
            setStatus('error')
            setMessage(sessionError.message)
            return
          }
          
          if (data.session) {
            setStatus('success')
            setMessage('Connexion réussie ! Redirection en cours...')
            
            // Wait a moment then redirect
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
            return
          }
        }
        
        // Check if it's an email confirmation
        const type = searchParams.get('type')
        if (type === 'signup') {
          const { data, error: confirmError } = await supabase.auth.getSession()
          
          if (confirmError) {
            setStatus('error')
            setMessage('Erreur lors de la confirmation de l\'email')
            return
          }
          
          if (data.session) {
            setStatus('success')
            setMessage('Email confirmé avec succès ! Redirection vers votre tableau de bord...')
            
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
            return
          } else {
            setStatus('success')
            setMessage('Email confirmé ! Vous pouvez maintenant vous connecter.')
            
            setTimeout(() => {
              navigate('/auth?tab=login')
            }, 3000)
            return
          }
        }
        
        // If we get here, something went wrong
        setStatus('error')
        setMessage('Aucune session valide trouvée')
        
      } catch (error: any) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Une erreur inattendue s\'est produite')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ScholarConnect
          </h1>
          <p className="text-blue-100">
            Traitement de votre authentification...
          </p>
        </div>

        <Card className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Vérification en cours...
              </h2>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous traitons votre demande.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Succès !
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Erreur
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Retour à la connexion
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
