// Edge Function: profile-manager
// Gestion complète des profils utilisateur (création, modification, synchronisation)

import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { action, userId, profileData, userType } = requestData

    if (!userId) {
      throw new Error('userId requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (action) {
      case 'update_profile':
        return await updateProfile(supabase, userId, profileData)
      
      case 'update_student_profile':
        return await updateStudentProfile(supabase, userId, profileData)
      
      case 'update_institution_profile':
        return await updateInstitutionProfile(supabase, userId, profileData)
      
      case 'get_full_profile':
        return await getFullProfile(supabase, userId)
      
      case 'switch_user_type':
        return await switchUserType(supabase, userId, userType)
      
      default:
        throw new Error(`Action non supportée: ${action}`)
    }

  } catch (error) {
    console.error('Erreur profile-manager:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'PROFILE_MANAGER_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Met à jour le profil principal
async function updateProfile(supabase: any, userId: string, profileData: any) {
  const updateData = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erreur mise à jour profil: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Met à jour le profil étudiant
async function updateStudentProfile(supabase: any, userId: string, profileData: any) {
  const updateData = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  // Vérifier si le profil existe
  const { data: existing } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()

  let result
  if (existing) {
    // Mettre à jour
    result = await supabase
      .from('student_profiles')
      .update(updateData)
      .eq('profile_id', userId)
      .select()
      .single()
  } else {
    // Créer
    result = await supabase
      .from('student_profiles')
      .insert({
        id: userId,
        profile_id: userId,
        ...updateData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
  }

  if (result.error) {
    throw new Error(`Erreur profil étudiant: ${result.error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: result.data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Met à jour le profil institution
async function updateInstitutionProfile(supabase: any, userId: string, profileData: any) {
  const updateData = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  // Vérifier si le profil existe
  const { data: existing } = await supabase
    .from('institution_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()

  let result
  if (existing) {
    // Mettre à jour
    result = await supabase
      .from('institution_profiles')
      .update(updateData)
      .eq('profile_id', userId)
      .select()
      .single()
  } else {
    // Créer
    result = await supabase
      .from('institution_profiles')
      .insert({
        id: userId,
        profile_id: userId,
        ...updateData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
  }

  if (result.error) {
    throw new Error(`Erreur profil institution: ${result.error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: result.data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Récupère le profil complet
async function getFullProfile(supabase: any, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw new Error(`Profil non trouvé: ${profileError.message}`)
  }

  let specificProfile = null

  if (profile.user_type === 'student') {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle()
    specificProfile = data
  } else if (profile.user_type === 'institution') {
    const { data } = await supabase
      .from('institution_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle()
    specificProfile = data
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: {
      profile,
      specificProfile
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Change le type d'utilisateur
async function switchUserType(supabase: any, userId: string, newUserType: string) {
  if (!['student', 'institution'].includes(newUserType)) {
    throw new Error('Type d\'utilisateur invalide')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      user_type: newUserType,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erreur changement type: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data,
    message: `Type d'utilisateur changé en ${newUserType}` 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}