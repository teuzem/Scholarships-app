// Edge Function: recommendation-stats
// Statistiques et métriques des recommandations ML

import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { userId, userType, timeframe = '30d' } = await req.json()

    if (!userId) {
      throw new Error('userId requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculer la date de début selon la période
    const startDate = new Date()
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Récupérer les statistiques selon le type d'utilisateur
    let stats
    if (userType === 'student') {
      stats = await getStudentRecommendationStats(supabase, userId, startDate)
    } else if (userType === 'institution') {
      stats = await getInstitutionRecommendationStats(supabase, userId, startDate)
    } else {
      throw new Error('Type d\'utilisateur non supporté')
    }

    return new Response(JSON.stringify({
      success: true,
      data: stats,
      metadata: {
        userId,
        userType,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erreur recommendation stats:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'RECOMMENDATION_STATS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getStudentRecommendationStats(supabase: any, userId: string, startDate: Date) {
  // Statistiques pour les étudiants
  const { data: history } = await supabase
    .from('recommendation_history')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  const { data: mlRecommendations } = await supabase
    .from('ml_recommendations')
    .select('*')
    .eq('student_id', userId)
    .gte('generated_at', startDate.toISOString())

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  const totalRecommendations = history?.length || 0
  const averageScore = history?.length > 0 
    ? history.reduce((sum, h) => sum + (h.recommendation_score || 0), 0) / history.length 
    : 0

  const viewedRecommendations = mlRecommendations?.filter(r => r.is_viewed).length || 0
  const savedRecommendations = favorites?.length || 0
  
  const successRate = totalRecommendations > 0 
    ? (savedRecommendations / totalRecommendations) * 100 
    : 0

  return {
    totalRecommendations,
    averageScore: Math.round(averageScore * 100) / 100,
    weeklyViews: viewedRecommendations,
    successRate: Math.round(successRate * 100) / 100,
    savedCount: savedRecommendations,
    topCategories: await getTopRecommendedCategories(supabase, userId, 'student'),
    recentActivity: await getRecentActivity(supabase, userId, 'student'),
    performanceMetrics: {
      clickThroughRate: viewedRecommendations > 0 ? (savedRecommendations / viewedRecommendations) * 100 : 0,
      engagementScore: calculateEngagementScore(viewedRecommendations, savedRecommendations, totalRecommendations)
    }
  }
}

async function getInstitutionRecommendationStats(supabase: any, userId: string, startDate: Date) {
  // Statistiques pour les institutions
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      scholarships!inner(institution_id)
    `)
    .eq('scholarships.institution_id', userId)
    .gte('created_at', startDate.toISOString())

  // Simuler des données de recommandations de candidats
  const totalCandidateRecommendations = Math.floor(Math.random() * 100) + 50
  const averageScore = Math.random() * 20 + 75 // 75-95
  const contactedCandidates = Math.floor(Math.random() * 30) + 10
  const successfulMatches = Math.floor(Math.random() * 15) + 5

  const successRate = totalCandidateRecommendations > 0 
    ? (successfulMatches / totalCandidateRecommendations) * 100 
    : 0

  return {
    totalRecommendations: totalCandidateRecommendations,
    averageScore: Math.round(averageScore * 100) / 100,
    weeklyViews: contactedCandidates,
    successRate: Math.round(successRate * 100) / 100,
    contactedCount: contactedCandidates,
    successfulMatches,
    topCandidateFields: await getTopCandidateFields(supabase),
    recentActivity: await getRecentActivity(supabase, userId, 'institution'),
    performanceMetrics: {
      responseRate: contactedCandidates > 0 ? (successfulMatches / contactedCandidates) * 100 : 0,
      qualityScore: averageScore
    }
  }
}

async function getTopRecommendedCategories(supabase: any, userId: string, userType: string) {
  // Retourner des catégories simulées pour l'instant
  if (userType === 'student') {
    return [
      { category: 'Sciences & Technologie', count: 15, avgScore: 87.5 },
      { category: 'Ingénierie', count: 12, avgScore: 84.2 },
      { category: 'Médecine & Santé', count: 8, avgScore: 91.3 }
    ]
  } else {
    return [
      { category: 'Informatique', count: 25, avgScore: 88.7 },
      { category: 'Ingénierie', count: 18, avgScore: 85.4 },
      { category: 'Sciences', count: 15, avgScore: 89.1 }
    ]
  }
}

async function getRecentActivity(supabase: any, userId: string, userType: string) {
  const activities = []
  const now = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    activities.push({
      date: date.toISOString().split('T')[0],
      recommendations: Math.floor(Math.random() * 10) + 1,
      views: Math.floor(Math.random() * 15) + 1,
      actions: Math.floor(Math.random() * 5) + 1
    })
  }
  
  return activities.reverse()
}

async function getTopCandidateFields(supabase: any) {
  // Simuler les domaines les plus populaires
  return [
    { field: 'Informatique', count: 45, avgGPA: 3.7 },
    { field: 'Ingénierie', count: 38, avgGPA: 3.6 },
    { field: 'Sciences', count: 32, avgGPA: 3.8 },
    { field: 'Médecine', count: 28, avgGPA: 3.9 },
    { field: 'Commerce', count: 25, avgGPA: 3.5 }
  ]
}

function calculateEngagementScore(views: number, saves: number, total: number): number {
  if (total === 0) return 0
  
  const viewRate = views / total
  const saveRate = saves / total
  
  // Score d'engagement pondéré
  return Math.round((viewRate * 0.3 + saveRate * 0.7) * 100)
}