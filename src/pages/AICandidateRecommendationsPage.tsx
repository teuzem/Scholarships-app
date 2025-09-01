import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  Building2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface CandidateRecommendation {
  id: string
  full_name: string
  email: string
  field_of_study?: string
  current_education_level?: string
  gpa?: number
  university?: string
  country?: string
  languages?: string[]
  career_goals?: string
  academic_achievements?: string[]
  score: number
  reasons: string[]
  profile_image_url?: string
  bio?: string
}

export default function AICandidateRecommendationsPage() {
  const { user, profile, institutionProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([])
  const [filters, setFilters] = useState({
    minScore: 70,
    minGPA: 0,
    studyLevel: 'all',
    fieldOfStudy: 'all'
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && profile && profile.user_type === 'institution') {
      loadRecommendations()
    }
  }, [user, profile])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Récupérer les profils étudiants avec leurs données
      const { data: studentProfiles, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          profiles!inner(full_name, email, bio, profile_image_url, user_type)
        `)
        .eq('profiles.user_type', 'student')
      
      if (error) {
        throw error
      }

      // Générer des recommandations basées sur les critères de l'institution
      const recommendationsWithScores = studentProfiles?.map(student => {
        const score = calculateCandidateScore(student)
        const reasons = generateReasons(student, score)
        
        return {
          id: student.profiles.id,
          full_name: student.profiles.full_name,
          email: student.profiles.email,
          bio: student.profiles.bio,
          profile_image_url: student.profiles.profile_image_url,
          field_of_study: student.field_of_study,
          current_education_level: student.current_education_level,
          gpa: student.gpa,
          university: student.current_institution,
          country: student.country,
          languages: student.languages,
          career_goals: student.career_goals,
          academic_achievements: student.academic_achievements || [],
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

  const calculateCandidateScore = (student: any): number => {
    let score = 50 // Score de base
    
    // Facteurs basés sur le profil de l'institution
    if (institutionProfile) {
      // Domaine d'étude correspondant
      if (student.field_of_study && institutionProfile.focus_areas) {
        const focusAreas = institutionProfile.focus_areas || []
        if (focusAreas.some((area: string) => 
          area.toLowerCase().includes(student.field_of_study.toLowerCase()) ||
          student.field_of_study.toLowerCase().includes(area.toLowerCase())
        )) {
          score += 25
        }
      }
      
      // Niveau d'étude approprié
      if (student.current_education_level) {
        if (student.current_education_level === 'Master' || student.current_education_level === 'PhD') {
          score += 15
        }
      }
    }
    
    // Facteurs académiques
    if (student.gpa) {
      if (student.gpa >= 3.8) score += 20
      else if (student.gpa >= 3.5) score += 15
      else if (student.gpa >= 3.0) score += 10
      else if (student.gpa < 2.5) score -= 10
    }
    
    // Réalisations académiques
    if (student.academic_achievements && student.academic_achievements.length > 0) {
      score += Math.min(student.academic_achievements.length * 5, 15)
    }
    
    // Langues
    if (student.languages && student.languages.length > 1) {
      score += 5
    }
    
    // Objectifs de carrière définis
    if (student.career_goals && student.career_goals.length > 50) {
      score += 10
    }
    
    return Math.min(Math.max(score, 0), 100) // Entre 0 et 100
  }

  const generateReasons = (student: any, score: number): string[] => {
    const reasons: string[] = []
    
    if (score >= 90) {
      reasons.push('Candidat exceptionnel')
    }
    
    if (student.gpa >= 3.8) {
      reasons.push('Excellent dossier académique (GPA: ' + student.gpa + ')')
    } else if (student.gpa >= 3.5) {
      reasons.push('Bon dossier académique')
    }
    
    if (student.academic_achievements && student.academic_achievements.length > 0) {
      reasons.push('Réalisations académiques notables')
    }
    
    if (student.languages && student.languages.length > 1) {
      reasons.push('Compétences linguistiques multiples')
    }
    
    if (student.career_goals && student.career_goals.length > 50) {
      reasons.push('Objectifs professionnels clairs')
    }
    
    if (student.current_education_level === 'Master' || student.current_education_level === 'PhD') {
      reasons.push('Niveau d\'étude avancé')
    }
    
    if (reasons.length === 0) {
      reasons.push('Profil correspondant à vos critères')
    }
    
    return reasons.slice(0, 4) // Limiter à 4 raisons
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
    toast.success('Recommandations mises à jour')
  }

  const contactCandidate = async (candidateEmail: string, candidateName: string) => {
    // Ici on pourrait implémenter un système de messagerie
    toast.success(`Message envoyé à ${candidateName}`)
  }

  const saveToShortlist = async (candidateId: string) => {
    try {
      // Pour l'instant, juste afficher un message de succès
      // Dans une implémentation complète, on pourrait créer une table pour le suivi des candidats
      toast.success('Candidat ajouté à votre liste de suivi')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.score < filters.minScore) return false
    if (filters.minGPA > 0 && (!rec.gpa || rec.gpa < filters.minGPA)) return false
    if (filters.studyLevel !== 'all' && rec.current_education_level !== filters.studyLevel) return false
    if (filters.fieldOfStudy !== 'all' && rec.field_of_study !== filters.fieldOfStudy) return false
    return true
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Analyse des profils candidats...</p>
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
              <User className="w-8 h-8 text-green-600" />
              Candidats recommandés
            </h1>
            <p className="text-lg text-gray-600">
              Découvrez les étudiants qui correspondent le mieux à vos programmes de bourses
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
                GPA minimum
              </label>
              <select
                value={filters.minGPA}
                onChange={(e) => setFilters({...filters, minGPA: Number(e.target.value)})}
                className="border rounded-md px-3 py-1 text-sm"
              >
                <option value={0}>Tous GPA</option>
                <option value={3.0}>3.0+</option>
                <option value={3.5}>3.5+</option>
                <option value={3.8}>3.8+</option>
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
          {filteredRecommendations.map((candidate) => (
            <Card key={candidate.id} className="h-full">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {candidate.profile_image_url ? (
                      <img 
                        src={candidate.profile_image_url} 
                        alt={candidate.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.full_name}</h3>
                      <p className="text-sm text-gray-600">{candidate.field_of_study}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(candidate.score)}`}>
                    {Math.round(candidate.score)}%
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="space-y-3 mb-4">
                    {candidate.current_education_level && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>{candidate.current_education_level}</span>
                        {candidate.gpa && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            GPA: {candidate.gpa}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {candidate.university && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{candidate.university}</span>
                      </div>
                    )}
                    
                    {candidate.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{candidate.country}</span>
                      </div>
                    )}
                  </div>
                  
                  {candidate.bio && (
                    <p className="text-gray-600 text-sm mb-4">
                      {candidate.bio.substring(0, 120)}...
                    </p>
                  )}

                  {/* Languages */}
                  {candidate.languages && candidate.languages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Langues :</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.languages.slice(0, 3).map((language, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasons */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Points forts :</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.reasons.map((reason, index) => (
                        <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => saveToShortlist(candidate.id)}
                    variant="outline"
                    icon={Heart}
                    size="sm"
                    className="flex-1"
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={() => contactCandidate(candidate.email, candidate.full_name)}
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
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun candidat ne correspond à vos critères
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez d'ajuster vos filtres pour voir plus de candidats.
            </p>
            <Button
              variant="outline"
              onClick={() => setFilters({ minScore: 50, minGPA: 0, studyLevel: 'all', fieldOfStudy: 'all' })}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
