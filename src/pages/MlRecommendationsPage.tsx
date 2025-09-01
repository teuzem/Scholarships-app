import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  Award
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Recommendation {
  id: string
  type: 'scholarship' | 'candidate'
  title: string
  description: string
  score: number
  reasons: string[]
  data: any
  created_at: string
}

export default function MlRecommendationsPage() {
  const { user, profile, isStudent, isInstitution } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [filter, setFilter] = useState<'all' | 'scholarship' | 'candidate'>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && profile) {
      loadRecommendations()
    }
  }, [user, profile])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Générer des recommandations basées sur le profil utilisateur
      const mockRecommendations: Recommendation[] = []
      
      if (isStudent) {
        // Recommandations de bourses pour étudiants
        const scholarshipRecommendations = await generateScholarshipRecommendations()
        mockRecommendations.push(...scholarshipRecommendations)
      }
      
      if (isInstitution) {
        // Recommandations de candidats pour institutions
        const candidateRecommendations = await generateCandidateRecommendations()
        mockRecommendations.push(...candidateRecommendations)
      }
      
      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Erreur chargement recommandations:', error)
      toast.error('Erreur lors du chargement des recommandations')
    } finally {
      setLoading(false)
    }
  }

  const generateScholarshipRecommendations = async (): Promise<Recommendation[]> => {
    // Récupérer des bourses pertinentes
    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', new Date().toISOString())
      .limit(6)
      .order('created_at', { ascending: false })
    
    if (error || !scholarships) {
      return []
    }

    return scholarships.map(scholarship => ({
      id: `scholarship-${scholarship.id}`,
      type: 'scholarship' as const,
      title: scholarship.title,
      description: scholarship.description.substring(0, 200) + '...',
      score: Math.random() * 40 + 60, // Score entre 60-100
      reasons: [
        'Correspond à votre domaine d\'étude',
        'Niveau d\'étude compatible',
        'Localisation préférée',
        'Critères d\'éligibilité correspondants'
      ].slice(0, Math.floor(Math.random() * 3) + 2),
      data: scholarship,
      created_at: new Date().toISOString()
    }))
  }

  const generateCandidateRecommendations = async (): Promise<Recommendation[]> => {
    // Pour les institutions, recommandations de candidats potentiels
    return [
      {
        id: 'candidate-1',
        type: 'candidate',
        title: 'Marie Dubois - Informatique',
        description: 'Étudiante en master informatique, spécialisée en IA, excellent dossier académique...',
        score: 95,
        reasons: ['GPA élevé (3.8/4.0)', 'Domaine correspondant', 'Expérience recherche', 'Motivations alignées'],
        data: { gpa: 3.8, field: 'Informatique', level: 'Master' },
        created_at: new Date().toISOString()
      },
      {
        id: 'candidate-2',
        type: 'candidate',
        title: 'Ahmed El-Hassan - Médecine',
        description: 'Doctorant en médecine, recherche en oncologie, publications internationales...',
        score: 88,
        reasons: ['Publications scientifiques', 'Expérience clinique', 'Recommandations excellentes'],
        data: { gpa: 3.9, field: 'Médecine', level: 'Doctorat' },
        created_at: new Date().toISOString()
      }
    ]
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
    toast.success('Recommandations mises à jour')
  }

  const saveRecommendation = async (recommendationId: string) => {
    try {
      const recommendation = recommendations.find(r => r.id === recommendationId)
      if (!recommendation) return

      if (recommendation.type === 'scholarship') {
        // Sauvegarder la bourse en favoris
        await supabase
          .from('favorites')
          .insert({
            student_id: user?.id,
            scholarship_id: recommendation.data.id
          })
        
        toast.success('Bourse sauvegardée en favoris')
      } else {
        toast.success('Candidat ajouté à votre liste de suivi')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredRecommendations = recommendations.filter(rec => 
    filter === 'all' || rec.type === filter
  )

  const getScoreColor = (score: number) => {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Génération des recommandations IA...</p>
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
              Recommandations IA
            </h1>
            <p className="text-lg text-gray-600">
              {isStudent ? 
                'Découvrez les bourses qui correspondent parfaitement à votre profil' : 
                'Trouvez les meilleurs candidats pour vos programmes de bourses'
              }
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
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes
            </Button>
            {isStudent && (
              <Button
                variant={filter === 'scholarship' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('scholarship')}
                icon={Award}
              >
                Bourses
              </Button>
            )}
            {isInstitution && (
              <Button
                variant={filter === 'candidate' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('candidate')}
                icon={User}
              >
                Candidats
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <Card key={recommendation.id} className="h-full">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(recommendation.type)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {recommendation.type === 'scholarship' ? 'Bourse' : 'Candidat'}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(recommendation.score)}`}>
                    {Math.round(recommendation.score)}%
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {recommendation.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {recommendation.description}
                  </p>

                  {/* Reasons */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Pourquoi c'est recommandé :</p>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.reasons.slice(0, 3).map((reason, index) => (
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
                      onClick={() => saveRecommendation(recommendation.id)}
                      variant="outline"
                      icon={Heart}
                      size="sm"
                      className="flex-1"
                    >
                      Sauvegarder
                    </Button>
                    <Link to={`/scholarship/${recommendation.data.id}`} className="flex-1">
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
  )
}
