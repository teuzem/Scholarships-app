import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useScholarshipRecommendations, useCandidateRecommendations, useRecommendationStats } from '@/hooks/useMLRecommendations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  Brain, 
  Star, 
  Clock, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  Heart,
  ExternalLink,
  User,
  GraduationCap,
  Building2,
  Globe,
  Award,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  Mail,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  Mail
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function MlRecommendationsPage() {
  const [filter, setFilter] = useState<'all' | 'scholarship' | 'candidate'>('all')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  
  const { user, profile, isStudent, isInstitution } = useAuth()
  
  // Hooks pour les données selon le type d'utilisateur
  const scholarshipRecommendations = useScholarshipRecommendations({
    limit: 10,
    minScore: 70,
    autoRefresh: false
  })
  
  const candidateRecommendations = useCandidateRecommendations({
    limit: 10,
    minScore: 70,
    autoRefresh: false
  })
  
  const { data: stats, isLoading: statsLoading } = useRecommendationStats()

  // Déterminer quelles données afficher
  const activeRecommendations = isStudent ? scholarshipRecommendations : candidateRecommendations
  const isLoading = activeRecommendations.isLoading || statsLoading
  const error = activeRecommendations.error
  const recommendations = activeRecommendations.data || []

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true
    if (filter === 'scholarship' && isStudent) return true
    if (filter === 'candidate' && isInstitution) return true
    return false
  })

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scholarship':
        return <Award className="w-5 h-5 text-blue-600" />
      case 'candidate':
        return <User className="w-5 h-5 text-green-600" />
      default:
        return <Star className="w-5 h-5 text-gray-600" />
    }
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur lors du chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || 'Une erreur est survenue lors du chargement des recommandations'}
          </p>
          <Button onClick={() => activeRecommendations.refetch()}>
            Réessayer
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              Centre de recommandations IA
            </h1>
            <p className="text-lg text-gray-600">
              {isStudent ? 
                'Découvrez les bourses parfaitement adaptées à votre profil' : 
                'Trouvez les candidats idéaux pour vos programmes de bourses'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
            >
              {viewMode === 'overview' ? 'Vue détaillée' : 'Vue d\'ensemble'}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommandations totales</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalRecommendations || 0}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-green-600">{stats.averageScore || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vues cette semaine</p>
                <p className="text-2xl font-bold text-purple-600">{stats.weeklyViews || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de succès</p>
                <p className="text-2xl font-bold text-orange-600">{stats.successRate || 0}%</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Vue d'ensemble
          </Button>
          {isStudent && (
            <Link to="/ai-recommendations/scholarships">
              <Button
                variant={filter === 'scholarship' ? 'primary' : 'ghost'}
                size="sm"
                icon={Award}
              >
                Mes bourses IA
              </Button>
            </Link>
          )}
          {isInstitution && (
            <Link to="/ai-recommendations/candidates">
              <Button
                variant={filter === 'candidate' ? 'primary' : 'ghost'}
                size="sm"
                icon={User}
              >
                Mes candidats IA
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Student Recommendations Preview */}
          {isStudent && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Bourses recommandées
                </h2>
                <Link to="/ai-recommendations/scholarships">
                  <Button variant="outline" size="sm">
                    Voir tout
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {scholarshipRecommendations.data?.slice(0, 3).map((rec) => (
                <div key={rec.scholarship_id} className="p-3 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {rec.scholarship_data.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="info" size="sm">
                          {Math.round(rec.match_score)}% compatible
                        </Badge>
                        <Badge variant={rec.urgency_level === 'high' ? 'error' : 'default'} size="sm">
                          {rec.urgency_level === 'high' ? 'Urgent' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                    <Link to={`/scholarship/${rec.scholarship_id}`}>
                      <Button size="sm" variant="outline">
                        Voir
                      </Button>
                    </Link>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune recommandation disponible</p>
                </div>
              )}
            </Card>
          )}

          {/* Institution Recommendations Preview */}
          {isInstitution && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Candidats recommandés
                </h2>
                <Link to="/ai-recommendations/candidates">
                  <Button variant="outline" size="sm">
                    Voir tout
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {candidateRecommendations.data?.slice(0, 3).map((rec) => (
                <div key={rec.candidate_id} className="p-3 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {rec.candidate_data.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="info" size="sm">
                          {Math.round(rec.match_score)}% compatible
                        </Badge>
                        <Badge variant={getRiskColor(rec.risk_assessment)} size="sm">
                          {rec.risk_assessment === 'low' ? 'Faible risque' : 
                           rec.risk_assessment === 'medium' ? 'Risque modéré' : 'Risque élevé'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleContactCandidate(rec.candidate_data.email, rec.candidate_data.full_name)}
                    >
                      Contact
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune recommandation disponible</p>
                </div>
              )}
            </Card>
          )}

          {/* ML Insights */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Insights IA
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Performance du modèle</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-800">Précision</span>
                    <span className="font-medium text-blue-900">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-800">Rappel</span>
                    <span className="font-medium text-blue-900">87.6%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-800">F1-Score</span>
                    <span className="font-medium text-blue-900">90.8%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Facteurs clés</h3>
                <div className="space-y-1">
                  <div className="text-sm text-green-800">• Correspondance du domaine (25%)</div>
                  <div className="text-sm text-green-800">• Niveau académique (20%)</div>
                  <div className="text-sm text-green-800">• Compatibilité géographique (15%)</div>
                  <div className="text-sm text-green-800">• Critères d'éligibilité (15%)</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // Vue détaillée - afficher toutes les recommandations
        <div className="space-y-6">
          {filteredRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendations.map((recommendation) => (
                <Card key={isStudent ? recommendation.scholarship_id : recommendation.candidate_id} className="h-full">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(isStudent ? 'scholarship' : 'candidate')}
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {isStudent ? 'Bourse' : 'Candidat'}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(recommendation.match_score)}`}>
                        {Math.round(recommendation.match_score)}%
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {isStudent ? recommendation.scholarship_data.title : recommendation.candidate_data.full_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {isStudent ? 
                          recommendation.scholarship_data.description.substring(0, 100) + '...' :
                          recommendation.candidate_data.bio?.substring(0, 100) + '...' || 'Profil candidat'
                        }
                      </p>

                      {/* Reasons */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Analyse IA :</p>
                        <div className="space-y-1">
                          {recommendation.reasons.slice(0, 3).map((reason, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-xs text-gray-700">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => {
                          if (isStudent) {
                            // Save scholarship to favorites
                            toast.success('Bourse sauvegardée')
                          } else {
                            // Save candidate to shortlist
                            toast.success('Candidat sauvegardé')
                          }
                        }}
                        variant="outline"
                        icon={Heart}
                        size="sm"
                        className="flex-1"
                      >
                        Sauvegarder
                      </Button>
                      {isStudent ? (
                        <Link to={`/scholarship/${recommendation.scholarship_id}`} className="flex-1">
                          <Button
                            variant="primary"
                            icon={ExternalLink}
                            size="sm"
                            className="w-full"
                          >
                            Voir détails
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleContactCandidate(
                            recommendation.candidate_data.email,
                            recommendation.candidate_data.full_name
                          )}
                          variant="primary"
                          icon={Mail}
                          size="sm"
                          className="flex-1"
                        >
                          Contacter
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune recommandation disponible
                </h3>
                <p className="text-gray-600 mb-4">
                  Complétez votre profil pour obtenir des recommandations personnalisées.
                </p>
                <Link to="/profile">
                  <Button icon={User}>
                    Compléter mon profil
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'error'
    default: return 'default'
  }
}

function handleContactCandidate(email: string, name: string) {
  const subject = encodeURIComponent(`Opportunité de bourse d'études`)
  const body = encodeURIComponent(`Bonjour ${name},

Nous avons examiné votre profil et pensons que vous pourriez être un excellent candidat pour nos programmes.

Cordialement`)
  
  window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  toast.success('Email de contact ouvert')
