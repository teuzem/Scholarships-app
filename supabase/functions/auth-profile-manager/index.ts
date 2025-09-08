// Edge Function: auth-profile-manager
// Gestion complète de l'authentification et création de profils

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
    const { userId, userType, profileData } = await req.json()

    if (!userId || !userType || !profileData) {
      throw new Error('Paramètres manquants: userId, userType, profileData requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Créer le profil principal
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: profileData.email,
        full_name: profileData.full_name,
        user_type: userType,
        phone: profileData.phone || null,
        website: profileData.website || null,
        bio: profileData.bio || null,
        city: profileData.city || null,
        country: profileData.country || null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Erreur création profil: ${profileError.message}`)
    }

    // Créer le profil spécifique selon le type d'utilisateur
    if (userType === 'student') {
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          id: userId,
          profile_id: userId,
          field_of_study: profileData.field_of_study || null,
          current_education_level: profileData.current_education_level || null,
          gpa: profileData.gpa || null,
          nationality: profileData.nationality || null,
          date_of_birth: profileData.date_of_birth || null,
          languages_spoken: profileData.languages_spoken || [],
          preferred_study_countries: profileData.preferred_study_countries || [],
          preferred_study_fields: profileData.preferred_study_fields || [],
          financial_need_level: profileData.financial_need_level || null,
          academic_achievements: profileData.academic_achievements || null,
          work_experience: profileData.work_experience || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (studentError) {
        throw new Error(`Erreur création profil étudiant: ${studentError.message}`)
      }
    } else if (userType === 'institution') {
      const { error: institutionError } = await supabase
        .from('institution_profiles')
        .upsert({
          id: userId,
          profile_id: userId,
          institution_name: profileData.institution_name,
          institution_type: profileData.institution_type || 'university',
          country: profileData.country,
          contact_email: profileData.email,
          contact_person: profileData.full_name,
          phone: profileData.phone || null,
          website_url: profileData.website || null,
          description: profileData.description || null,
          focus_areas: profileData.focus_areas || [],
          established_year: profileData.established_year || null,
          total_students: profileData.total_students || null,
          international_students_percentage: profileData.international_students_percentage || null,
          ranking_global: profileData.ranking_global || null,
          ranking_national: profileData.ranking_national || null,
          scholarship_budget_annual: profileData.scholarship_budget_annual || null,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (institutionError) {
        throw new Error(`Erreur création profil institution: ${institutionError.message}`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: profile,
      message: 'Profil créé avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erreur auth-profile-manager:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'AUTH_PROFILE_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})