import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useScholarshipRecommendations, useRegenerateRecommendations, useMarkRecommendationViewed } from '@/hooks/useMLRecommendations'
import { useAddToFavorites } from '@/hooks/useDatabase'
import { useAddToFavorites } from '@/hooks/useDatabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { 
  Award, 
  Star, 
  Clock, 
  Heart, 
  ExternalLink,
  RefreshCw,
  Filter,
  Brain,
  TrendingUp,
  Globe,
  GraduationCap,
  User,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

    refetch 
    confidenceLevel: 'all',
    urgencyLevel: 'all',
    limit: 20
  })
  
  const regenerateRecommendations = useRegenerateRecommendations()
  const addToFavorites = useAddToFavorites()
  const markAsViewed = useMarkRecommendationViewed()

  // Filtrer les recommandations
  const filteredRecommendations = recommendations?.filter(rec => {
    if (rec.match_score < filters.minScore) return false
    if (filters.confidenceLevel !== 'all' && rec.confidence_level !== filters.confidenceLevel) return false
    if (filters.urgencyLevel !== 'all' && rec.urgency_level !== filters.urgencyLevel) return false
    return true
  }) || []

  const handleRefreshRecommendations = async () => {
    try {
      await regenerateRecommendations.mutateAsync({ 
        type: 'scholarship',
        options: { limit: filters.limit, minScore: filters.minScore }
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleSaveToFavorites = async (scholarshipId: string) => {
    if (!user) return
    
    try {
      await addToFavorites.mutateAsync({ 
  const [viewedRecommendations, setViewedRecommendations] = useState<Set<string>>(new Set())
        scholarshipId 
      try {
        await markAsViewed.mutateAsync({
          recommendationId,
          type: 'scholarship'
        })
      } catch (error) {
        console.error('Error marking as viewed:', error)
      }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'error'
      default: return 'default'
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'error'
      default: return 'default'
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
            <p className="text-gray-600">Analyse IA de votre profil en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Génération des recommandations personnalisées</p>
            <p className="text-sm text-gray-500 mt-2">Génération des recommandations personnalisées</p>
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
              <Brain className="w-8 h-8 text-blue-600" />
              Bourses recommandées pour vous
            </h1>
            <p className="text-lg text-gray-600">
              Recommandations IA basées sur l'analyse approfondie de votre profil académique
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {filteredRecommendations.length} recommandations
            </Badge>
            <Button
              onClick={handleRefreshRecommendations}
              disabled={regenerateRecommendations.isPending}
              icon={RefreshCw}
              variant="outline"
              className={regenerateRecommendations.isPending ? 'animate-spin' : ''}
            >
              {regenerateRecommendations.isPending ? 'Génération...' : 'Actualiser'}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtres avancés</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score minimum
              </label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: Number(e.target.value)})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50% - Toutes</option>
                <option value={70}>70% - Bonnes</option>
                <option value={80}>80% - Très bonnes</option>
                <option value={90}>90% - Excellentes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de confiance
              </label>
              <select
                value={filters.confidenceLevel}
                onChange={(e) => setFilters({...filters, confidenceLevel: e.target.value})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous niveaux</option>
                <option value="high">Confiance élevée</option>
                <option value="medium">Confiance moyenne</option>
                <option value="low">Confiance faible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgence
              </label>
              <select
                value={filters.urgencyLevel}
                onChange={(e) => setFilters({...filters, urgencyLevel: e.target.value})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes urgences</option>
                <option value="high">Urgent (< 2 semaines)</option>
                <option value="medium">Modéré (< 6 semaines)</option>
                <option value="low">Pas urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de résultats
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: Number(e.target.value)})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 bourses</option>
                <option value={20}>20 bourses</option>
                <option value={50}>50 bourses</option>
                <option value={100}>100 bourses</option>
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
                <p className="text-sm text-gray-600">Confiance élevée</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.confidence_level === 'high').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.urgency_level === 'high').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    recommendations.reduce((sum, r) => sum + (r.scholarship_data.amount || 0), 0)
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => {
            const daysLeft = getDaysUntilDeadline(recommendation.scholarship_data.application_deadline)
            const isViewed = viewedRecommendations.has(recommendation.scholarship_id)
            
            return (
              <Card 
                key={recommendation.scholarship_id} 
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
                      <Badge variant={getConfidenceColor(recommendation.confidence_level)} size="sm">
                        {recommendation.confidence_level === 'high' ? 'Haute confiance' :
                         recommendation.confidence_level === 'medium' ? 'Confiance moyenne' : 'Confiance faible'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getUrgencyColor(recommendation.urgency_level)} size="sm">
                        {recommendation.urgency_level === 'high' ? 'Urgent' :
                         recommendation.urgency_level === 'medium' ? 'Modéré' : 'Pas urgent'}
                      </Badge>
                      {isViewed && <Eye className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {recommendation.scholarship_data.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {recommendation.scholarship_data.amount && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(recommendation.scholarship_data.amount, recommendation.scholarship_data.currency)}
                          </span>
                        </div>
                      )}
                      {recommendation.scholarship_data.study_level && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{recommendation.scholarship_data.study_level}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {recommendation.scholarship_data.description}
                    </p>

                    {/* Study Fields */}
                    {recommendation.scholarship_data.study_fields && recommendation.scholarship_data.study_fields.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {recommendation.scholarship_data.study_fields.slice(0, 3).map((field, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {field}
                            </span>
                          ))}
                          {recommendation.scholarship_data.study_fields.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{recommendation.scholarship_data.study_fields.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deadline with urgency indicator */}
                    <div className="flex items-center gap-1 text-sm mb-4">
                      <Clock className={`w-4 h-4 ${
                        daysLeft <= 7 ? 'text-red-500' : 
                        daysLeft <= 30 ? 'text-orange-500' : 'text-gray-500'
                      }`} />
                      <span className={daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        Deadline: {formatDate(recommendation.scholarship_data.application_deadline)}
                        {daysLeft <= 30 && (
                          <span className="ml-1 font-medium">
                            ({daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* AI Reasons */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Analyse IA - Pourquoi c'est recommandé :
                      </p>
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
                      onClick={() => handleSaveToFavorites(recommendation.scholarship_id)}
                      variant="outline"
                      icon={Heart}
                      size="sm"
                      className="flex-1"
                      disabled={addToFavorites.isPending}
                    >
                      Sauvegarder
                    </Button>
                    <Link 
                      to={`/scholarship/${recommendation.scholarship_id}`} 
                      className="flex-1"
                      onClick={() => handleViewRecommendation(recommendation.scholarship_id)}
                    >
                      <Button
                        variant="primary"
                        icon={ExternalLink}
                        size="sm"
                        className="w-full"
                      >
                        Voir détails
                      </Button>
                    </Link>
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
                ? 'Aucune recommandation générée'
                : 'Aucune bourse ne correspond à vos critères'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {recommendations?.length === 0 
                ? 'Complétez votre profil pour obtenir des recommandations personnalisées.'
                : 'Essayez d\'ajuster vos filtres pour voir plus de recommandations.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/profile">
                <Button icon={User}>
                  Compléter mon profil
                </Button>
              </Link>
              {recommendations?.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleRefreshRecommendations}
                  disabled={regenerateRecommendations.isPending}
                >
                  Générer des recommandations
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ML Insights */}
      {recommendations && recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Insights IA sur vos recommandations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Domaines les plus recommandés</h4>
              <div className="space-y-1">
                {(() => {
                  const fieldCounts = recommendations.reduce((acc, r) => {
                    r.scholarship_data.study_fields?.forEach(field => {
                      acc[field] = (acc[field] || 0) + 1
                    })
                    return acc
                  }, {} as Record<string, number>)
                  
                  return Object.entries(fieldCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([field, count]) => (
                      <div key={field} className="text-sm text-blue-800">
                        {field} ({count} bourses)
                      </div>
                    ))
                })()}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Pays les plus adaptés</h4>
              <div className="space-y-1">
                {(() => {
                  const countryCounts = recommendations.reduce((acc, r) => {
                    r.scholarship_data.target_countries?.forEach(country => {
                      acc[country] = (acc[country] || 0) + 1
                    })
                    return acc
                  }, {} as Record<string, number>)
                  
                  return Object.entries(countryCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([country, count]) => (
                      <div key={country} className="text-sm text-green-800">
                        {country} ({count} bourses)
                      </div>
                    ))
                })()}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Recommandations urgentes</h4>
              <div className="space-y-1">
                <div className="text-sm text-purple-800">
                  {recommendations.filter(r => r.urgency_level === 'high').length} bourses urgentes
                </div>
                <div className="text-sm text-purple-800">
                  {recommendations.filter(r => r.urgency_level === 'medium').length} bourses modérées
                </div>
                <div className="text-xs text-purple-600 mt-2">
                  Priorisez les bourses urgentes
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

          <div className="flex items-center gap-2">
            <Badge variant="info" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {filteredRecommendations.length} recommandations
            </Badge>
            <Button
              onClick={handleRefreshRecommendations}
              disabled={regenerateRecommendations.isPending}
              icon={RefreshCw}
              variant="outline"
              className={regenerateRecommendations.isPending ? 'animate-spin' : ''}
            >
              {regenerateRecommendations.isPending ? 'Génération...' : 'Actualiser'}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtres avancés</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score minimum
              </label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: Number(e.target.value)})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50% - Toutes</option>
                <option value={70}>70% - Bonnes</option>
                <option value={80}>80% - Très bonnes</option>
                <option value={90}>90% - Excellentes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de confiance
              </label>
              <select
                value={filters.confidenceLevel}
                onChange={(e) => setFilters({...filters, confidenceLevel: e.target.value})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous niveaux</option>
                <option value="high">Confiance élevée</option>
                <option value="medium">Confiance moyenne</option>
                <option value="low">Confiance faible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgence
              </label>
              <select
                value={filters.urgencyLevel}
                onChange={(e) => setFilters({...filters, urgencyLevel: e.target.value})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes urgences</option>
                <option value="high">Urgent (< 2 semaines)</option>
                <option value="medium">Modéré (< 6 semaines)</option>
                <option value="low">Pas urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de résultats
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: Number(e.target.value)})}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 bourses</option>
                <option value={20}>20 bourses</option>
                <option value={50}>50 bourses</option>
                <option value={100}>100 bourses</option>
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
                <p className="text-sm text-gray-600">Confiance élevée</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.confidence_level === 'high').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.urgency_level === 'high').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    recommendations.reduce((sum, r) => sum + (r.scholarship_data.amount || 0), 0)
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => {
            const daysLeft = getDaysUntilDeadline(recommendation.scholarship_data.application_deadline)
            const isViewed = viewedRecommendations.has(recommendation.scholarship_id)
            
            return (
              <Card 
                key={recommendation.scholarship_id} 
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
                      <Badge variant={getConfidenceColor(recommendation.confidence_level)} size="sm">
                        {recommendation.confidence_level === 'high' ? 'Haute confiance' :
                         recommendation.confidence_level === 'medium' ? 'Confiance moyenne' : 'Confiance faible'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getUrgencyColor(recommendation.urgency_level)} size="sm">
                        {recommendation.urgency_level === 'high' ? 'Urgent' :
                         recommendation.urgency_level === 'medium' ? 'Modéré' : 'Pas urgent'}
                      </Badge>
                      {isViewed && <Eye className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {recommendation.scholarship_data.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {recommendation.scholarship_data.amount && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(recommendation.scholarship_data.amount, recommendation.scholarship_data.currency)}
                          </span>
                        </div>
                      )}
                      {recommendation.scholarship_data.study_level && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{recommendation.scholarship_data.study_level}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {recommendation.scholarship_data.description}
                    </p>

                    {/* Study Fields */}
                    {recommendation.scholarship_data.study_fields && recommendation.scholarship_data.study_fields.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {recommendation.scholarship_data.study_fields.slice(0, 3).map((field, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {field}
                            </span>
                          ))}
                          {recommendation.scholarship_data.study_fields.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{recommendation.scholarship_data.study_fields.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deadline with urgency indicator */}
                    <div className="flex items-center gap-1 text-sm mb-4">
                      <Clock className={`w-4 h-4 ${
                        daysLeft <= 7 ? 'text-red-500' : 
                        daysLeft <= 30 ? 'text-orange-500' : 'text-gray-500'
                      }`} />
                      <span className={daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        Deadline: {formatDate(recommendation.scholarship_data.application_deadline)}
                        {daysLeft <= 30 && (
                          <span className="ml-1 font-medium">
                            ({daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* AI Reasons */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Analyse IA - Pourquoi c'est recommandé :
                      </p>
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
                      onClick={() => handleSaveToFavorites(recommendation.scholarship_id)}
                      variant="outline"
                      icon={Heart}
                      size="sm"
                      className="flex-1"
                      disabled={addToFavorites.isPending}
                    >
                      Sauvegarder
                    </Button>
                    <Link 
                      to={`/scholarship/${recommendation.scholarship_id}`} 
                      className="flex-1"
                      onClick={() => handleViewRecommendation(recommendation.scholarship_id)}
                    >
                      <Button
                        variant="primary"
                        icon={ExternalLink}
                        size="sm"
                        className="w-full"
                      >
                        Voir détails
                      </Button>
                    </Link>
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
                ? 'Aucune recommandation générée'
                : 'Aucune bourse ne correspond à vos critères'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {recommendations?.length === 0 
                ? 'Complétez votre profil pour obtenir des recommandations personnalisées.'
                : 'Essayez d\'ajuster vos filtres pour voir plus de recommandations.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/profile">
                <Button icon={User}>
                  Compléter mon profil
                </Button>
              </Link>
              {recommendations?.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleRefreshRecommendations}
                  disabled={regenerateRecommendations.isPending}
                >
                  Générer des recommandations
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ML Insights */}
      {recommendations && recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Insights IA sur vos recommandations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Domaines les plus recommandés</h4>
              <div className="space-y-1">
                {(() => {
                  const fieldCounts = recommendations.reduce((acc, r) => {
                    r.scholarship_data.study_fields?.forEach(field => {
                      acc[field] = (acc[field] || 0) + 1
                    })
                    return acc
                  }, {} as Record<string, number>)
                  
  // Hooks pour les données
                  return Object.entries(fieldCounts)
  const { 
                        {daysLeft <= 30 && (
    data: recommendations, 
                          <span className="ml-1">({daysLeft} jours restants)</span>
    isLoading, 
                        )}
    error,
                      </span>
    refetch 
                    </div>
  } = useScholarshipRecommendations({

    limit: filters.limit,
                    {/* Reasons */}
    minScore: filters.minScore,
                    <div className="mb-4">
    autoRefresh: true
                      <p className="text-xs font-medium text-gray-500 mb-2">Pourquoi c'est recommandé :</p>
  })
                      <div className="flex flex-wrap gap-1">
  
                        {recommendation.reasons.map((reason, index) => (
  const regenerateRecommendations = useRegenerateRecommendations()
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
  const addToFavorites = useAddToFavorites()
                            {reason}
  const markAsViewed = useMarkRecommendationViewed()
                          </span>

                        ))}
  // Filtrer les recommandations
                      </div>
  const filteredRecommendations = recommendations?.filter(rec => {
                    </div>
    if (rec.match_score < filters.minScore) return false
                  </div>
    if (filters.confidenceLevel !== 'all' && rec.confidence_level !== filters.confidenceLevel) return false

    if (filters.urgencyLevel !== 'all' && rec.urgency_level !== filters.urgencyLevel) return false
                  {/* Actions */}
  }) || []
                  <div className="flex gap-2 pt-4 border-t">

                      onClick={() => saveToFavorites(recommendation.id)}
  const handleRefreshRecommendations = async () => {
                      variant="outline"
    try {
                      icon={Heart}
      await regenerateRecommendations.mutateAsync({ 
                      size="sm"
        type: 'scholarship',
                      className="flex-1"
        options: { limit: filters.limit, minScore: filters.minScore }
                    >
      })
                      Sauvegarder
    } catch (error) {
                    </Button>
      // Error handled by mutation
                    <Link to={`/scholarship/${recommendation.id}`} className="flex-1">
    }
                      <Button
  }
                        variant="primary"

                        icon={ExternalLink}
  const handleSaveToFavorites = async (scholarshipId: string) => {
                        size="sm"
    if (!user) return
                        className="w-full"
    
                      >
    try {
                        Voir détails
      await addToFavorites.mutateAsync({ 
                      </Button>
        userId: user.id, 
                    </Link>
        scholarshipId 
                  </div>
      })
                </div>
    } catch (error) {
              </Card>
      // Error handled by mutation
            )
    }
          })}
  }
        </div>

      ) : (
  const handleViewRecommendation = async (recommendationId: string) => {
        <Card>
    if (!viewedRecommendations.has(recommendationId)) {
          <div className="text-center py-12">
      setViewedRecommendations(prev => new Set([...prev, recommendationId]))
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
      try {
              Aucune bourse ne correspond à vos critères
        await markAsViewed.mutateAsync({
            </h3>
          recommendationId,
            <p className="text-gray-600 mb-4">
          type: 'scholarship'
              Essayez d'ajuster vos filtres ou complétez votre profil pour de meilleures recommandations.
        })
            </p>
      } catch (error) {
            <div className="flex gap-2 justify-center">
        console.error('Error marking as viewed:', error)
              <Link to="/profile">
      }
                <Button icon={User}>
    }
                  Compléter mon profil
  }
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setFilters({ minScore: 50, studyLevel: 'all', country: 'all' })}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
