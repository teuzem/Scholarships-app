import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCandidateRecommendations, useRegenerateRecommendations, useMarkRecommendationViewed } from '@/hooks/useMLRecommendations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  User, 
  Star, 
  Mail, 
  Phone,
  Heart, 
  ExternalLink,
  RefreshCw,
  Filter,
  Brain,
  TrendingUp,
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  Building2,
  Target,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Eye,
  Zap,
  Users,
  TrendingDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AICandidateRecommendationsPage() {
  const { user, profile } = useAuth()
  const [filters, setFilters] = useState({
    minScore: 70,
    minGPA: 0,
    confidenceLevel: 'all',
    riskLevel: 'all',
    limit: 50
  })
  const [viewedCandidates, setViewedCandidates] = useState<Set<string>>(new Set())
  const [selectedScholarship, setSelectedScholarship] = useState<string>('')

  // Hooks pour les données
  const { 
    data: recommendations, 
    isLoading, 
    error,
    refetch 
  } = useCandidateRecommendations({
    scholarshipId: selectedScholarship || undefined,
    limit: filters.limit,
    minScore: filters.minScore,
    autoRefresh: true
  })
  
  const regenerateRecommendations = useRegenerateRecommendations()
  const markAsViewed = useMarkRecommendationViewed()

  // Filtrer les recommandations
  const filteredRecommendations = recommendations?.filter(rec => {
    if (rec.match_score < filters.minScore) return false
    if (filters.minGPA > 0 && (!rec.candidate_data.gpa || rec.candidate_data.gpa < filters.minGPA)) return false
    if (filters.riskLevel !== 'all' && rec.risk_assessment !== filters.riskLevel) return false
    return true
  }) || []

  const handleRefreshRecommendations = async () => {
    try {
      await regenerateRecommendations.mutateAsync({ 
        type: 'candidate',
        options: { 
          scholarshipId: selectedScholarship || undefined,
          limit: filters.limit, 
          minScore: filters.minScore 
        }
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleContactCandidate = async (candidateEmail: string, candidateName: string) => {
    // Créer un lien mailto avec un template
    const subject = encodeURIComponent(`Opportunité de bourse d'études - ${profile?.full_name || 'Notre institution'}`)
    const body = encodeURIComponent(`Bonjour ${candidateName},

Nous avons examiné votre profil académique et pensons que vous pourriez être un excellent candidat pour nos programmes de bourses d'études.

Nous aimerions discuter des opportunités disponibles qui correspondent à votre profil.

Cordialement,
${profile?.full_name}
${profile?.email}`)
    
    window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`)
    toast.success('Email de contact ouvert')
  }

  const handleSaveToShortlist = async (candidateId: string) => {
    try {
      toast.success('Candidat ajouté à votre liste de suivi')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleViewCandidate = async (candidateId: string) => {
    if (!viewedCandidates.has(candidateId)) {
      setViewedCandidates(prev => new Set([...prev, candidateId]))
      
      try {
        await markAsViewed.mutateAsync({
          recommendationId: candidateId,
          type: 'candidate'
        })
      } catch (error) {
        console.error('Error marking as viewed:', error)
      }
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
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
          <Button onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Analyse IA des profils candidats...</p>
            <p className="text-sm text-gray-500 mt-2">Évaluation des correspondances et potentiels</p>
          </div>
        </div>
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
              <Brain className="w-8 h-8 text-green-600" />
              Candidats recommandés
            </h1>
            <p className="text-lg text-gray-600">
              IA avancée pour identifier les meilleurs candidats pour vos programmes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {filteredRecommendations.length} candidats
            </Badge>
            <Button
              onClick={handleRefreshRecommendations}
              disabled={regenerateRecommendations.isPending}
              icon={RefreshCw}
              variant="outline"
              className={regenerateRecommendations.isPending ? 'animate-spin' : ''}
            >
              {regenerateRecommendations.isPending ? 'Analyse...' : 'Actualiser'}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtres avancés</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score minimum
              </label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: Number(e.target.value)})}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50% - Tous candidats</option>
                <option value={70}>70% - Bons candidats</option>
                <option value={80}>80% - Très bons candidats</option>
                <option value={90}>90% - Candidats exceptionnels</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPA minimum
              </label>
              <select
                value={filters.minGPA}
                onChange={(e) => setFilters({...filters, minGPA: Number(e.target.value)})}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Tous GPA</option>
                <option value={3.0}>3.0+ (Bon)</option>
                <option value={3.5}>3.5+ (Très bon)</option>
                <option value={3.8}>3.8+ (Excellent)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de risque
              </label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous niveaux</option>
                <option value="low">Risque faible</option>
                <option value="medium">Risque modéré</option>
                <option value="high">Risque élevé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bourse spécifique
              </label>
              <select
                value={selectedScholarship}
                onChange={(e) => setSelectedScholarship(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes mes bourses</option>
                {/* TODO: Load user's scholarships */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de résultats
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: Number(e.target.value)})}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25 candidats</option>
                <option value={50}>50 candidats</option>
                <option value={100}>100 candidats</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations Summary */}
      {recommendations && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(recommendations.reduce((sum, r) => sum + r.match_score, 0) / recommendations.length)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Candidats excellents</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.match_score >= 90).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risque faible</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.risk_assessment === 'low').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">GPA moyen</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(recommendations.reduce((sum, r) => sum + (r.candidate_data.gpa || 0), 0) / 
                    recommendations.filter(r => r.candidate_data.gpa).length || 0).toFixed(2)}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => {
            const isViewed = viewedCandidates.has(recommendation.candidate_id)
            
            return (
              <Card 
                key={recommendation.candidate_id} 
                className={`h-full transition-all duration-200 ${
                  isViewed ? 'opacity-90' : 'shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col h-full">
                  {/* Header with advanced indicators */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(recommendation.match_score)}`}>
                        {Math.round(recommendation.match_score)}%
                      </div>
                      <Badge variant={getRiskColor(recommendation.risk_assessment)} size="sm">
                        {recommendation.risk_assessment === 'low' ? 'Risque faible' :
                         recommendation.risk_assessment === 'medium' ? 'Risque modéré' : 'Risque élevé'}
                      </Badge>
                    </div>
                    {isViewed && <Eye className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {recommendation.candidate_data.full_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{recommendation.candidate_data.full_name}</h3>
                      <p className="text-sm text-gray-600">{recommendation.candidate_data.field_of_study}</p>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="flex-grow">
                    <div className="space-y-3 mb-4">
                      {recommendation.candidate_data.current_education_level && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{recommendation.candidate_data.current_education_level}</span>
                          {recommendation.candidate_data.gpa && (
                            <Badge variant="info" size="sm">
                              GPA: {recommendation.candidate_data.gpa}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {recommendation.candidate_data.nationality && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{recommendation.candidate_data.nationality}</span>
                        </div>
                      )}
                    </div>
                    
                    {recommendation.candidate_data.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {recommendation.candidate_data.bio}
                      </p>
                    )}

                    {/* Languages */}
                    {recommendation.candidate_data.languages_spoken && recommendation.candidate_data.languages_spoken.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Langues :</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.candidate_data.languages_spoken.slice(0, 3).map((language, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {language}
                            </span>
                          ))}
                          {recommendation.candidate_data.languages_spoken.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{recommendation.candidate_data.languages_spoken.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Analyse IA - Points forts :
                      </p>
                      <div className="space-y-1">
                        {recommendation.reasons.slice(0, 3).map((reason, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-xs text-gray-700">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fit Analysis */}
                    {recommendation.fit_analysis && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Analyse de compatibilité :</p>
                        <p className="text-xs text-blue-700">{recommendation.fit_analysis}</p>
                      </div>
                    )}

                    {/* Potential Contribution */}
                    {recommendation.potential_contribution && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-xs font-medium text-green-800 mb-1">Contribution potentielle :</p>
                        <p className="text-xs text-green-700">{recommendation.potential_contribution}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleSaveToShortlist(recommendation.candidate_id)}
                      variant="outline"
                      icon={Heart}
                      size="sm"
                      className="flex-1"
                    >
                      Sauvegarder
                    </Button>
                    <Button
                      onClick={() => {
                        handleContactCandidate(
                          recommendation.candidate_data.email, 
                          recommendation.candidate_data.full_name
                        )
                        handleViewCandidate(recommendation.candidate_id)
                      }}
                      variant="primary"
                      icon={Mail}
                      size="sm"
                      className="flex-1"
                    >
                      Contacter
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {recommendations?.length === 0 
                ? 'Aucun candidat analysé'
                : 'Aucun candidat ne correspond à vos critères'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {recommendations?.length === 0 
                ? 'Complétez votre profil institution pour obtenir des recommandations de candidats.'
                : 'Essayez d\'ajuster vos filtres pour voir plus de candidats.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/profile">
                <Button icon={Building2}>
                  Compléter mon profil
                </Button>
              </Link>
              {recommendations?.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleRefreshRecommendations}
                  disabled={regenerateRecommendations.isPending}
                >
                  Analyser les candidats
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ML Insights for Institutions */}
      {recommendations && recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            Insights IA sur vos candidats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Domaines les plus représentés</h4>
              <div className="space-y-1">
                {(() => {
                  const fieldCounts = recommendations.reduce((acc, r) => {
                    const field = r.candidate_data.field_of_study
                    if (field) acc[field] = (acc[field] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  return Object.entries(fieldCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([field, count]) => (
                      <div key={field} className="text-sm text-green-800">
                        {field} ({count} candidats)
                      </div>
                    ))
                })()}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Niveaux d'étude</h4>
              <div className="space-y-1">
                {(() => {
                  const levelCounts = recommendations.reduce((acc, r) => {
                    const level = r.candidate_data.current_education_level
                    if (level) acc[level] = (acc[level] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  return Object.entries(levelCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([level, count]) => (
                      <div key={level} className="text-sm text-blue-800">
                        {level} ({count} candidats)
                      </div>
                    ))
                })()}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Distribution des risques</h4>
              <div className="space-y-1">
                <div className="text-sm text-purple-800">
                  Faible: {recommendations.filter(r => r.risk_assessment === 'low').length}
                </div>
                <div className="text-sm text-purple-800">
                  Modéré: {recommendations.filter(r => r.risk_assessment === 'medium').length}
                </div>
                <div className="text-sm text-purple-800">
                  Élevé: {recommendations.filter(r => r.risk_assessment === 'high').length}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}