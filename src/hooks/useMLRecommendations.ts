import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

interface RecommendationFactors {
  fieldMatch: number
  levelMatch: number
  countryMatch: number
  nationalityMatch: number
  gpaMatch: number
  ageMatch: number
  languageMatch: number
  deadlineUrgency: number
  amountScore: number
  eligibilityMatch: number
  experienceMatch: number
  achievementMatch: number
  institutionPrestige: number
  renewabilityBonus: number
  featuredBonus: number
}

interface ScholarshipRecommendation {
  scholarship_id: string
  student_id: string
  match_score: number
  recommendation_factors: RecommendationFactors
  scholarship_data: {
    title: string
    description: string
    amount?: number
    currency?: string
    application_deadline: string
    study_level?: string
    study_fields: string[]
    target_countries?: string[]
    institution_id: string
  }
  reasons: string[]
  confidence_level: 'high' | 'medium' | 'low'
  urgency_level: 'high' | 'medium' | 'low'
  generated_at: string
}

interface CandidateRecommendation {
  candidate_id: string
  institution_id: string
  match_score: number
  recommendation_factors: any
  candidate_data: {
    full_name: string
    email: string
    field_of_study?: string
    current_education_level?: string
    gpa?: number
    nationality?: string
    languages_spoken?: string[]
    bio?: string
    academic_achievements?: string
    work_experience?: string
  }
  reasons: string[]
  fit_analysis: string
  potential_contribution: string
  risk_assessment: 'low' | 'medium' | 'high'
  generated_at: string
}

// Hook pour les recommandations de bourses (étudiants)
export function useScholarshipRecommendations(options?: {
  limit?: number
  minScore?: number
  autoRefresh?: boolean
}) {
  const { user, profile } = useAuth()
  const { limit = 20, minScore = 60, autoRefresh = false } = options || {}

  return useQuery({
    queryKey: ['scholarship_recommendations', user?.id, limit, minScore],
    queryFn: async (): Promise<ScholarshipRecommendation[]> => {
      if (!user || profile?.user_type !== 'student') {
        throw new Error('Utilisateur étudiant requis')
      }

      const result = await invokeEdgeFunction('ml-recommendation-engine', {
        userId: user.id,
        limit,
        minScore
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la génération des recommandations')
      }

      return result.data || []
    },
    enabled: !!user && profile?.user_type === 'student',
    staleTime: autoRefresh ? 1000 * 60 * 5 : 1000 * 60 * 30, // 5 min si auto-refresh, sinon 30 min
    gcTime: 1000 * 60 * 60, // 1 heure
    refetchOnWindowFocus: autoRefresh
  })
}

// Hook pour les recommandations de candidats (institutions)
export function useCandidateRecommendations(options?: {
  scholarshipId?: string
  limit?: number
  minScore?: number
  autoRefresh?: boolean
}) {
  const { user, profile } = useAuth()
  const { scholarshipId, limit = 50, minScore = 70, autoRefresh = false } = options || {}

  return useQuery({
    queryKey: ['candidate_recommendations', user?.id, scholarshipId, limit, minScore],
    queryFn: async (): Promise<CandidateRecommendation[]> => {
      if (!user || profile?.user_type !== 'institution') {
        throw new Error('Utilisateur institution requis')
      }

      const result = await invokeEdgeFunction('candidate-recommendation-engine', {
        institutionId: user.id,
        scholarshipId,
        limit,
        minScore
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la génération des recommandations')
      }

      return result.data || []
    },
    enabled: !!user && profile?.user_type === 'institution',
    staleTime: autoRefresh ? 1000 * 60 * 10 : 1000 * 60 * 60, // 10 min si auto-refresh, sinon 1 heure
    gcTime: 1000 * 60 * 60 * 2, // 2 heures
    refetchOnWindowFocus: autoRefresh
  })
}

// Hook pour forcer la régénération des recommandations
export function useRegenerateRecommendations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ type, options }: { 
      type: 'scholarship' | 'candidate'
      options?: any 
    }) => {
      if (!user) throw new Error('Utilisateur non connecté')

      const functionName = type === 'scholarship' 
        ? 'ml-recommendation-engine' 
        : 'candidate-recommendation-engine'

      const payload = type === 'scholarship' 
        ? { userId: user.id, ...options }
        : { institutionId: user.id, ...options }

      const result = await invokeEdgeFunction(functionName, payload)

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la régénération')
      }

      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalider les caches appropriés
      if (variables.type === 'scholarship') {
        queryClient.invalidateQueries({ queryKey: ['scholarship_recommendations'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['candidate_recommendations'] })
      }
      
      toast.success('Recommandations mises à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la régénération des recommandations')
    }
  })
}

// Hook pour obtenir les statistiques des recommandations
export function useRecommendationStats() {
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: ['recommendation_stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Utilisateur non connecté')

      const result = await invokeEdgeFunction('recommendation-stats', {
        userId: user.id,
        userType: profile?.user_type
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des statistiques')
      }

      return result.data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 // 1 heure
  })
}

// Hook pour marquer une recommandation comme vue
export function useMarkRecommendationViewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recommendationId, type }: { 
      recommendationId: string
      type: 'scholarship' | 'candidate' 
    }) => {
      const result = await invokeEdgeFunction('recommendation-tracker', {
        action: 'mark_viewed',
        recommendationId,
        type
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du marquage')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendation_stats'] })
    }
  })
}

// Hook pour obtenir l'historique des recommandations
export function useRecommendationHistory(limit = 100) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recommendation_history', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('Utilisateur non connecté')

      const result = await invokeEdgeFunction('recommendation-history', {
        userId: user.id,
        limit
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement de l\'historique')
      }

      return result.data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30 // 30 minutes
  })
}