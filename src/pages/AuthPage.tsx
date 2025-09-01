import React from 'react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Mail, Lock, User, ArrowRight, GraduationCap, Building2, Eye, EyeOff, Globe, Phone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const { signIn, signUp, resetPassword, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [userType, setUserType] = useState<'student' | 'institution'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    institutionName: '',
    institutionType: 'university',
    country: '',
    phone: '',
    website: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<any>({})

  const validateForm = () => {
    const newErrors: any = {}
    
    if (!formData.email) {
      newErrors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    
    if (tab === 'signup') {
      if (!formData.fullName) {
        newErrors.fullName = 'Nom complet requis'
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }
      
      if (userType === 'institution') {
        if (!formData.institutionName) {
          newErrors.institutionName = 'Nom de l\'institution requis'
        }
        if (!formData.country) {
          newErrors.country = 'Pays requis'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      if (tab === 'login') {
        await signIn(formData.email, formData.password)
        navigate('/dashboard')
      } else if (tab === 'signup') {
        const additionalData: any = {
          phone: formData.phone,
          website: formData.website
        }
        
        if (userType === 'institution') {
          additionalData.institution_name = formData.institutionName
          additionalData.institution_type = formData.institutionType
          additionalData.country = formData.country
        }
        
        await signUp(formData.email, formData.password, formData.fullName, userType, additionalData)
        setMessage('Compte créé! Vérifiez votre email pour confirmer votre compte.')
      } else if (tab === 'reset') {
        await resetPassword(formData.email)
        setMessage('Email de réinitialisation envoyé!')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isLoading = loading || authLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ScholarConnect
          </h1>
          <p className="text-blue-100 text-lg">
            Votre plateforme de bourses d'études
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-0">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setTab('login')
                setMessage('')
                setErrors({})
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setTab('signup')
                setMessage('')
                setErrors({})
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === 'signup'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inscription
            </button>
            <button
              onClick={() => {
                setTab('reset')
                setMessage('')
                setErrors({})
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === 'reset'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Réinitialiser
            </button>
          </div>

          {/* User Type Selection for Signup */}
          {tab === 'signup' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de compte
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === 'student'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Étudiant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('institution')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === 'institution'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Institution</div>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Full Name Field (for signup) */}
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {userType === 'institution' ? 'Nom du contact' : 'Nom complet'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={userType === 'institution' ? 'Nom du responsable' : 'Votre nom complet'}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>
            )}

            {/* Institution-specific fields */}
            {tab === 'signup' && userType === 'institution' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'institution
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Université de..."
                      value={formData.institutionName}
                      onChange={(e) => handleInputChange('institutionName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.institutionName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  {errors.institutionName && (
                    <p className="text-red-500 text-xs mt-1">{errors.institutionName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'institution
                    </label>
                    <select
                      value={formData.institutionType}
                      onChange={(e) => handleInputChange('institutionType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="university">Université</option>
                      <option value="government">Gouvernement</option>
                      <option value="ngo">ONG</option>
                      <option value="foundation">Fondation</option>
                      <option value="corporation">Entreprise</option>
                      <option value="international_org">Org. internationale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pays
                    </label>
                    <input
                      type="text"
                      placeholder="France"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.country && (
                      <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Optional fields for signup */}
            {tab === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone (optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      placeholder="+33 6..."
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site web (optionnel)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            {tab !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm Password Field (for signup) */}
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Success/Error Messages */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('Erreur') || message.includes('erreur')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {tab === 'login' && 'Se connecter'}
                  {tab === 'signup' && 'Créer mon compte'}
                  {tab === 'reset' && 'Envoyer le lien'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {tab === 'login' && (
              <p>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setTab('signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  S'inscrire
                </button>
              </p>
            )}
            {tab === 'signup' && (
              <p>
                Déjà un compte ?{' '}
                <button
                  onClick={() => setTab('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Se connecter
                </button>
              </p>
            )}
            {tab === 'reset' && (
              <p>
                Retour à la{' '}
                <button
                  onClick={() => setTab('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  connexion
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
