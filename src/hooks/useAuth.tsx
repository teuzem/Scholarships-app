import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserProfile, getStudentProfile, getInstitutionProfile, invokeEdgeFunction } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  user_type: string
  email: string
  full_name: string
  phone?: string
  profile_image_url?: string
  bio?: string
  website?: string
  city?: string
  country?: string
  avatar_url?: string
  verified?: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  studentProfile: any | null
  institutionProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string, userType: 'student' | 'institution', additionalData?: any) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<any>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
  updateStudentProfile: (updates: any) => Promise<any>
  updateInstitutionProfile: (updates: any) => Promise<any>
  refreshProfile: () => Promise<void>
  isStudent: boolean
  isInstitution: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [studentProfile, setStudentProfile] = useState<any | null>(null)
  const [institutionProfile, setInstitutionProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user and profile on mount
  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          await loadUserProfile(user.id)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // NEVER use any async operations in callback for auth state
        setUser(session?.user || null)
        
        if (session?.user) {
          // Load profile after state change
          loadUserProfile(session.user.id)
        } else {
          // Clear profiles when user signs out
          setProfile(null)
          setStudentProfile(null)
          setInstitutionProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Load user profile and specific profile based on user type
  async function loadUserProfile(userId: string) {
    try {
      let userProfile = await getUserProfile(userId)
      
      // Si le profil n'existe pas, essayer de le créer automatiquement
      if (!userProfile) {
        console.log('Profile not found, creating default profile...')
        try {
          // Obtenir l'email de l'utilisateur
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          const userEmail = currentUser?.email || ''
          
          // Créer un profil par défaut
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              user_type: 'student', // Type par défaut
              full_name: 'Utilisateur',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (!createError && newProfile) {
            userProfile = newProfile
          } else {
            console.error('Error creating default profile:', createError)
          }
        } catch (createProfileError) {
          console.error('Failed to create default profile:', createProfileError)
        }
      }
      
      setProfile(userProfile)
      
      if (userProfile) {
        if (userProfile.user_type === 'student') {
          const studentData = await getStudentProfile(userId)
          setStudentProfile(studentData)
          setInstitutionProfile(null)
        } else if (userProfile.user_type === 'institution') {
          const institutionData = await getInstitutionProfile(userId)
          setInstitutionProfile(institutionData)
          setStudentProfile(null)
        }
      } else {
        // Si toujours pas de profil, effacer les données
        setStudentProfile(null)
        setInstitutionProfile(null)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // En cas d'erreur, assurer que les profils sont effacés
      setProfile(null)
      setStudentProfile(null)
      setInstitutionProfile(null)
    }
  }

  // Sign in method
  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) throw error
      
      // Note: last_login update can be added later if needed in database schema
      
      toast.success('Connexion réussie')
      return data
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Erreur lors de la connexion')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign up method with profile creation
  async function signUp(email: string, password: string, fullName: string, userType: 'student' | 'institution', additionalData: any = {}) {
    try {
      setLoading(true)
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        // Create profile using edge function
        try {
          const profileData = {
            email,
            full_name: fullName,
            ...additionalData
          }
          
          await invokeEdgeFunction('auth-profile-manager', {
            userId: data.user.id,
            userType,
            profileData
          })
          
        } catch (profileError) {
          console.error('Error creating profile:', profileError)
          // Profile creation failed, but auth user was created
          toast.error('Compte créé mais erreur lors de la création du profil. Veuillez contacter le support.')
        }
      }
      
      toast.success('Compte créé! Vérifiez votre email pour confirmer votre compte.')
      return data
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Erreur lors de l\'inscription')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign out method
  async function signOut() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear all state
      setUser(null)
      setProfile(null)
      setStudentProfile(null)
      setInstitutionProfile(null)
      
      toast.success('Déconnexion réussie')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Erreur lors de la déconnexion')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Reset password method
  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.protocol}//${window.location.host}/auth/reset-password`
      })
      
      if (error) throw error
      
      toast.success('Email de réinitialisation envoyé!')
      return { success: true }
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email')
      throw error
    }
  }

  // Update profile method - utilise l'edge function pour une gestion robuste
  async function updateProfile(updates: Partial<UserProfile>) {
    try {
      if (!user || !profile) {
        throw new Error('Utilisateur non connecté')
      }
      
      setLoading(true)
      
      // Utiliser l'edge function profile-manager pour une gestion robuste
      const result = await invokeEdgeFunction('profile-manager', {
        action: 'update_profile',
        userId: user.id,
        profileData: updates
      })
      
      if (result?.data) {
        setProfile(result.data)
        toast.success('Profil mis à jour avec succès')
        return result.data
      } else {
        throw new Error('Erreur lors de la mise à jour du profil')
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour du profil')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Refresh profile method
  async function refreshProfile() {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  // Computed properties
  const isStudent = profile?.user_type === 'student'
  const isInstitution = profile?.user_type === 'institution'

  // Méthodes pour la gestion des profils spécifiques
  const updateStudentProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté')
      
      const result = await invokeEdgeFunction('profile-manager', {
        action: 'update_student_profile',
        userId: user.id,
        profileData: updates
      })
      
      if (result?.data) {
        setStudentProfile(result.data)
        toast.success('Profil étudiant mis à jour')
        return result.data
      }
    } catch (error: any) {
      console.error('Update student profile error:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
      throw error
    }
  }
  
  const updateInstitutionProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté')
      
      const result = await invokeEdgeFunction('profile-manager', {
        action: 'update_institution_profile',
        userId: user.id,
        profileData: updates
      })
      
      if (result?.data) {
        setInstitutionProfile(result.data)
        toast.success('Profil institution mis à jour')
        return result.data
      }
    } catch (error: any) {
      console.error('Update institution profile error:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
      throw error
    }
  }

  const value = {
    user,
    profile,
    studentProfile,
    institutionProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateStudentProfile,
    updateInstitutionProfile,
    refreshProfile,
    isStudent,
    isInstitution
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
