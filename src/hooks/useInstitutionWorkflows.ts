import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

// Type for application with relations used in notifications
type ApplicationWithRelationsForNotification = Tables<'applications'> & {
  scholarships: {
    title: string
  } | null
  profiles: {
    full_name: string
    email: string
  } | null
}

// Hook pour la création de bourses
export function useCreateScholarship() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (scholarshipData: any) => {
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase
        .from('scholarships')
        .insert({
          ...scholarshipData,
          institution_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Enregistrer l'événement d'analyse
      await supabase.from('analytics_events').insert({
        event_type: 'scholarship_created',
        user_id: user.id,
        scholarship_id: data.id,
        event_data: {
          scholarship_title: scholarshipData.title,
          amount: scholarshipData.amount,
          deadline: scholarshipData.application_deadline
        }
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarships'] })
      toast.success('Bourse créée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création de la bourse')
    }
  })
}

// Hook pour la mise à jour de bourses
export function useUpdateScholarship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ scholarshipId, updates }: { scholarshipId: string, updates: any }) => {
      const { data, error } = await supabase
        .from('scholarships')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', scholarshipId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarships'] })
      toast.success('Bourse mise à jour')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  })
}

// Hook pour la gestion des candidatures
export function useManageApplications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const updateStatus = useMutation({
    mutationFn: async ({ 
      applicationId, 
      status, 
      notes 
    }: { 
      applicationId: string
      status: string
      notes?: string 
    }) => {
      // First, update the application
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status,
          notes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Then, fetch the updated application with relations
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          scholarships(title),
          profiles(full_name, email)
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error

      const typedData = data as ApplicationWithRelationsForNotification

      // Créer une notification pour l'étudiant
      await supabase.from('notifications').insert({
        user_id: typedData.student_id,
        title: `Mise à jour de votre candidature`,
        message: `Votre candidature pour "${typedData.scholarships?.title}" a été ${
          status === 'accepted' ? 'acceptée' : 
          status === 'rejected' ? 'refusée' : 
          'mise à jour'
        }.`,
        type: 'application_status',
        priority: status === 'accepted' ? 'high' : 'medium',
        related_application_id: applicationId,
        related_scholarship_id: typedData.scholarship_id
      })

      return typedData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Statut mis à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  })

  const bulkUpdate = useMutation({
    mutationFn: async ({ 
      applicationIds, 
      status, 
      message 
    }: { 
      applicationIds: string[]
      status: string
      message?: string 
    }) => {
      // Mettre à jour les candidatures
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          notes: message,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', applicationIds)

      if (error) throw error

      // Créer des notifications en lot
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          student_id,
          scholarship_id,
          scholarships(title)
        `)
        .in('id', applicationIds)

      if (applications) {
        const notifications = applications.map(app => ({
          user_id: app.student_id,
          title: `Mise à jour de votre candidature`,
          message: message || `Votre candidature a été ${
            status === 'accepted' ? 'acceptée' : 
            status === 'rejected' ? 'refusée' : 
            'mise à jour'
          }.`,
          type: 'application_status',
          priority: status === 'accepted' ? 'high' : 'medium',
          related_scholarship_id: app.scholarship_id
        }))

        await supabase.from('notifications').insert(notifications)
      }

      return applicationIds.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success(`${count} candidatures mises à jour`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour en lot')
    }
  })

  return {
    updateStatus,
    bulkUpdate
  }
}

// Hook pour la messagerie interne
export function useInstitutionMessaging() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      recipientIds, 
      subject, 
      content, 
      relatedScholarshipId 
    }: {
      recipientIds: string[]
      subject: string
      content: string
      relatedScholarshipId?: string
    }) => {
      if (!user) throw new Error('Utilisateur non connecté')

      const messages = recipientIds.map(recipientId => ({
        sender_id: user.id,
        recipient_id: recipientId,
        subject,
        content,
        related_scholarship_id: relatedScholarshipId,
        message_type: 'institution_communication',
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('messages')
        .insert(messages)
        .select()

      if (error) throw error

      // Créer des notifications correspondantes
      const notifications = recipientIds.map(recipientId => ({
        user_id: recipientId,
        title: `Nouveau message: ${subject}`,
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        type: 'message',
        priority: 'medium',
        action_url: '/messages'
      }))

      await supabase.from('notifications').insert(notifications)

      return data
    },
    onSuccess: (data) => {
      toast.success(`Message envoyé à ${data.length} destinataire(s)`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'envoi du message')
    }
  })
}

// Hook pour les analytics en temps réel
export function useInstitutionAnalytics(institutionId?: string, timeframe = '30d') {
  return useMutation({
    mutationFn: async () => {
      if (!institutionId) throw new Error('Institution ID requis')

      const result = await invokeEdgeFunction('institution-analytics', {
        institutionId,
        timeframe
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des analytics')
      }

      return result.data
    }
  })
}

// Hook pour l'export de données
export function useExportData() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      dataType, 
      format = 'csv',
      filters = {} 
    }: {
      dataType: 'scholarships' | 'applications' | 'analytics'
      format?: 'csv' | 'excel' | 'pdf'
      filters?: any
    }) => {
      if (!user) throw new Error('Utilisateur non connecté')

      const result = await invokeEdgeFunction('data-export', {
        institutionId: user.id,
        dataType,
        format,
        filters
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de l\'export')
      }

      // Télécharger le fichier
      const blob = new Blob([result.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/octet-stream' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dataType}-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)

      return result.data
    },
    onSuccess: () => {
      toast.success('Export terminé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'export')
    }
  })
}