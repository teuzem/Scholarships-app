import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = 'https://yvuiksswghrqmpwcthkz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dWlrc3N3Z2hycW1wd2N0aGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjUyNzAsImV4cCI6MjA3MTEwMTI3MH0.X6MQZDWqa-6he75a4A9RBKx73tG8P5FGKeVbpZA-rVA'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Helper function to get student profile
export async function getStudentProfile(userId: string): Promise<any | null> {
  try {
    // Using any to bypass TypeScript inference issues
    const result: any = await (supabase as any)
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (result.error) {
      console.error('Error getting student profile:', result.error)
      return null
    }
    
    return result.data
  } catch (error) {
    console.error('Error in getStudentProfile:', error)
    return null
  }
}

// Helper function to get institution profile
export async function getInstitutionProfile(userId: string): Promise<any | null> {
  try {
    // Using any to bypass TypeScript inference issues
    const result: any = await (supabase as any)
      .from('institution_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (result.error) {
      console.error('Error getting institution profile:', result.error)
      return null
    }
    
    return result.data
  } catch (error) {
    console.error('Error in getInstitutionProfile:', error)
    return null
  }
}

// Helper function to invoke edge functions safely
export async function invokeEdgeFunction(functionName: string, payload: any = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (error) {
      console.error(`Error invoking ${functionName}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error(`Error in invokeEdgeFunction(${functionName}):`, error)
    throw error
  }
}
