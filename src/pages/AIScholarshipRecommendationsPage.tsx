import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  User
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface ScholarshipRecommendation {
  id: string
  title: string
  description: string
  amount: number
  currency: string
  application_deadline: string
  score: number
  reasons: string[]
  institution_name?: string
  country?: string
  study_level?: string
  field_of_study?: string
}

export default function AIScholarshipRecommendationsPage() {
  const { user, profile, studentProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<ScholarshipRecommendation[]>([])
  const [filters, setFilters] = useState({
    minScore: 70,
    studyLevel: 'all',
    country: 'all'
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && profile) {
      loadRecommendations()
    }
  }, [user, profile])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Récupérer les bourses actives
      const { data: scholarships, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }

      // Générer des recommandations basées sur le profil étudiant
      const recommendationsWithScores = scholarships?.map(scholarship => {
        const score = calculateRecommendationScore(scholarship)
        const reasons = generateReasons(scholarship, score)
        
        return {
          ...scholarship,
          score,
          reasons
        }
      }) || []

      // Trier par score décroissant
      recommendationsWithScores.sort((a, b) => b.score - a.score)
      
      setRecommendations(recommendationsWithScores)
    } catch (error) {
      console.error('Erreur chargement recommandations:', error)
      toast.error('Erreur lors du chargement des recommandations')
    } finally {
      setLoading(false)
    }
  }

  const calculateRecommendationScore = (scholarship: any): number => {
    let score = 50 // Score de base
    
    // Facteurs basés sur le profil étudiant
    if (studentProfile) {
      // Domaine d'étude correspondant
      if (scholarship.field_of_study && studentProfile.field_of_study) {
        if (scholarship.field_of_study.toLowerCase().includes(studentProfile.field_of_study.toLowerCase()) ||
            studentProfile.field_of_study.toLowerCase().includes(scholarship.field_of_study.toLowerCase())) {
          score += 25
        }
      }
      
      // Niveau d'étude correspondant
      if (scholarship.study_level && studentProfile.current_education_level) {
        if (scholarship.study_level === studentProfile.current_education_level) {
          score += 20
        }
      }
      
      // Pays préférés
      if (scholarship.country && studentProfile.preferred_study_countries) {
        if (studentProfile.preferred_study_countries.includes(scholarship.country)) {
          score += 15
        }
      }
      
      // GPA minimum
      if (scholarship.min_gpa && studentProfile.gpa) {
        if (studentProfile.gpa >= scholarship.min_gpa) {
          score += 10
        } else {
          score -= 20
        }
      }
    }
    
    // Facteurs temporels
    const deadline = new Date(scholarship.application_deadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (daysUntilDeadline > 30) {
      score += 5 // Plus de temps pour postuler
    } else if (daysUntilDeadline < 7) {
      score -= 10 // Deadline approche
    }
    
    // Montant de la bourse
    if (scholarship.amount) {
      if (scholarship.amount >= 10000) score += 10
      if (scholarship.amount >= 20000) score += 5
    }
    
    return Math.min(Math.max(score, 0), 100) // Entre 0 et 100
  }

  const generateReasons = (scholarship: any, score: number): string[] => {
    const reasons: string[] = []
    
    if (score >= 90) {
      reasons.push('Correspondance parfaite avec votre profil')
    }
    
    if (studentProfile?.field_of_study && scholarship.field_of_study) {
      if (scholarship.field_of_study.toLowerCase().includes(studentProfile.field_of_study.toLowerCase())) {
        reasons.push('Domaine d\'étude correspondant')
      }
    }
    
    if (studentProfile?.current_education_level === scholarship.study_level) {
      reasons.push('Niveau d\'étude compatible')
    }
    
    if (studentProfile?.preferred_study_countries?.includes(scholarship.country)) {
      reasons.push('Pays de destination préféré')
    }
    
    if (scholarship.amount >= 15000) {
      reasons.push('Financement substantiel')
    }
    
    const deadline = new Date(scholarship.application_deadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (daysUntilDeadline > 30) {
      reasons.push('Délai confortable pour postuler')
    }
    
    if (reasons.length === 0) {
      reasons.push('Critères d\'éligibilité correspondants')
    }
    
    return reasons.slice(0, 4) // Limiter à 4 raisons
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
    toast.success('Recommandations mises à jour')
  }

  const saveToFavorites = async (scholarshipId: string) => {
    try {
      await supabase
        .from('favorites')
        .insert({
          student_id: user?.id,
          scholarship_id: scholarshipId
        })
      
      toast.success('Bourse sauvegardée en favoris')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.score < filters.minScore) return false
    if (filters.studyLevel !== 'all' && rec.study_level !== filters.studyLevel) return false
    if (filters.country !== 'all' && rec.country !== filters.country) return false
    return true
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Génération des recommandations de bourses...</p>
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
              <Award className="w-8 h-8 text-blue-600" />
              Bourses recommandées pour vous
            </h1>
            <p className="text-lg text-gray-600">
              Découvrez les bourses qui correspondent parfaitement à votre profil académique
            </p>
          </div>
          <Button
            onClick={refreshRecommendations}
            disabled={refreshing}
            icon={RefreshCw}
            variant="outline"
            className={refreshing ? 'animate-spin' : ''}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score minimum
              </label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: Number(e.target.value)})}
                className="border rounded-md px-3 py-1 text-sm"
              >
                <option value={50}>50%</option>
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau d'étude
              </label>
              <select
                value={filters.studyLevel}
                onChange={(e) => setFilters({...filters, studyLevel: e.target.value})}
                className="border rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Tous niveaux</option>
                <option value="Bachelor">Licence</option>
                <option value="Master">Master</option>
                <option value="PhD">Doctorat</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => {
            const daysLeft = getDaysUntilDeadline(recommendation.application_deadline)
            
            return (
              <Card key={recommendation.id} className="h-full">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(recommendation.score)}`}>
                      {Math.round(recommendation.score)}% compatible
                    </div>
                    <div className="text-right">
                      {recommendation.amount && (
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(recommendation.amount, recommendation.currency)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {recommendation.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {recommendation.institution_name && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{recommendation.institution_name}</span>
                        </div>
                      )}
                      {recommendation.country && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <span>{recommendation.country}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      {recommendation.description.substring(0, 150)}...
                    </p>

                    {/* Deadline */}
                    <div className="flex items-center gap-1 text-sm mb-4">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        Deadline: {formatDate(recommendation.application_deadline)}
                        {daysLeft <= 30 && (
                          <span className="ml-1">({daysLeft} jours restants)</span>
                        )}
                      </span>
                    </div>

                    {/* Reasons */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Pourquoi c'est recommandé :</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.reasons.map((reason, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => saveToFavorites(recommendation.id)}
                      variant="outline"
                      icon={Heart}
                      size="sm"
                      className="flex-1"
                    >
                      Sauvegarder
                    </Button>
                    <Link to={`/scholarship/${recommendation.id}`} className="flex-1">
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
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune bourse ne correspond à vos critères
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez d'ajuster vos filtres ou complétez votre profil pour de meilleures recommandations.
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/profile">
                <Button icon={User}>
                  Compléter mon profil
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
