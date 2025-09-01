import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'
import toast from 'react-hot-toast'

export function useScholarships() {
  return useQuery({
    queryKey: ['scholarships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'scholarships'>[]
    }
  })
}

export function useScholarship(id: string) {
  return useQuery({
    queryKey: ['scholarship', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'scholarships'> | null
    },
    enabled: !!id
  })
}

export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as Tables<'institutions'>[]
    }
  })
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: ['institution', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'institutions'> | null
    },
    enabled: !!id
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables<'countries'>[]
    }
  })
}

export function useCountry(id: string) {
  return useQuery({
    queryKey: ['country', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'countries'> | null
    },
    enabled: !!id
  })
}

export function useAcademicPrograms() {
  return useQuery({
    queryKey: ['academic_programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_programs')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as Tables<'academic_programs'>[]
    }
  })
}

export function useApplications(userId?: string) {
  return useQuery({
    queryKey: ['applications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', userId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'applications'>[]
    },
    enabled: !!userId
  })
}

export function useUserFavorites(userId?: string) {
  return useQuery({
    queryKey: ['user_favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'user_favorites'>[]
    },
    enabled: !!userId
  })
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'notifications'>[]
    },
    enabled: !!userId
  })
}

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'messages'>[]
    },
    enabled: !!userId
  })
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'profiles'> | null
    },
    enabled: !!userId
  })
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'user_profiles'> | null
    },
    enabled: !!userId
  })
}

export function useStudentProfile(profileId?: string) {
  return useQuery({
    queryKey: ['student_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('profile_id', profileId!)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'student_profiles'> | null
    },
    enabled: !!profileId
  })
}

export function useInstitutionProfile(profileId?: string) {
  return useQuery({
    queryKey: ['institution_profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_profiles')
        .select('*')
        .eq('profile_id', profileId!)
        .maybeSingle()
      
      if (error) throw error
      return data as Tables<'institution_profiles'> | null
    },
    enabled: !!profileId
  })
}

export function useMlRecommendations(userId?: string) {
  return useQuery({
    queryKey: ['ml_recommendations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_recommendations')
        .select('*')
        .eq('student_id', userId!)
        .order('match_score', { ascending: false })
      
      if (error) throw error
      return data as Tables<'ml_recommendations'>[]
    },
    enabled: !!userId
  })
}

export function useDocuments(userId?: string) {
  return useQuery({
    queryKey: ['documents', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', userId!)
        .order('uploaded_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'documents'>[]
    },
    enabled: !!userId
  })
}

export function useAnalyticsEvents() {
  return useQuery({
    queryKey: ['analytics_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return data as Tables<'analytics_events'>[]
    }
  })
}

export function useContinents() {
  return useQuery({
    queryKey: ['continents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('continents')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables<'continents'>[]
    }
  })
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables<'regions'>[]
    }
  })
}

export function useProgramCategories() {
  return useQuery({
    queryKey: ['program_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables<'program_categories'>[]
    }
  })
}

export function useInstitutionTypes() {
  return useQuery({
    queryKey: ['institution_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_types')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables<'institution_types'>[]
    }
  })
}

export function useScholarshipEligibility(scholarshipId?: string) {
  return useQuery({
    queryKey: ['scholarship_eligibility', scholarshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarship_eligibility')
        .select('*')
        .eq('scholarship_id', scholarshipId!)
        .order('criteria_type')
      
      if (error) throw error
      return data as Tables<'scholarship_eligibility'>[]
    },
    enabled: !!scholarshipId
  })
}

export function useScholarshipPrograms(scholarshipId?: string) {
  return useQuery({
    queryKey: ['scholarship_programs', scholarshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarship_programs')
        .select('*')
        .eq('scholarship_id', scholarshipId!)
      
      if (error) throw error
      return data as Tables<'scholarship_programs'>[]
    },
    enabled: !!scholarshipId
  })
}

export function useRecommendationHistory(userId?: string) {
  return useQuery({
    queryKey: ['recommendation_history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Tables<'recommendation_history'>[]
    },
    enabled: !!userId
  })
}

// Mutation hooks
export function useAddToFavorites() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, scholarshipId }: { userId: string, scholarshipId: string }) => {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, scholarship_id: scholarshipId })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_favorites'] })
      toast.success('Ajouté aux favoris')
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout aux favoris')
    }
  })
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, scholarshipId }: { userId: string, scholarshipId: string }) => {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('scholarship_id', scholarshipId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_favorites'] })
      toast.success('Retiré des favoris')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression des favoris')
    }
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string, updates: TablesUpdate<'user_profiles'> }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] })
      toast.success('Profil mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil')
    }
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
}
