// Edge Function: institution-analytics
// Analytics avancées pour les institutions

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
    const { institutionId, timeframe = '30d' } = await req.json()

    if (!institutionId) {
      throw new Error('institutionId requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculer la date de début
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

    // Récupérer les bourses de l'institution
    const { data: scholarships, error: scholarshipsError } = await supabase
      .from('scholarships')
      .select('*')
      .eq('institution_id', institutionId)

    if (scholarshipsError) throw scholarshipsError

    const scholarshipIds = scholarships?.map(s => s.id) || []

    // Récupérer les candidatures
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships(title, amount),
        profiles(nationality, country)
      `)
      .in('scholarship_id', scholarshipIds)
      .gte('created_at', startDate.toISOString())

    if (applicationsError) throw applicationsError

    // Récupérer les événements d'analyse
    const { data: analyticsEvents, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', institutionId)
      .gte('created_at', startDate.toISOString())

    if (analyticsError) throw analyticsError

    // Calculer les métriques
    const analytics = await calculateInstitutionAnalytics(
      scholarships || [],
      applications || [],
      analyticsEvents || [],
      timeframe
    )

    return new Response(JSON.stringify({
      success: true,
      data: analytics,
      metadata: {
        institutionId,
        timeframe,
        generatedAt: new Date().toISOString(),
        dataPoints: {
          scholarships: scholarships?.length || 0,
          applications: applications?.length || 0,
          events: analyticsEvents?.length || 0
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erreur institution analytics:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'INSTITUTION_ANALYTICS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function calculateInstitutionAnalytics(
  scholarships: any[],
  applications: any[],
  events: any[],
  timeframe: string
) {
  const now = new Date()
  
  // Métriques de base
  const totalScholarships = scholarships.length
  const activeScholarships = scholarships.filter(s => s.is_active).length
  const totalApplications = applications.length
  const acceptedApplications = applications.filter(a => a.status === 'accepted').length
  const rejectedApplications = applications.filter(a => a.status === 'rejected').length
  const pendingApplications = applications.filter(a => a.status === 'pending' || a.status === 'under_review').length

  // Métriques de performance
  const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
  const totalFunding = scholarships.reduce((sum, s) => sum + (s.amount || 0), 0)
  const avgApplicationsPerScholarship = totalScholarships > 0 ? totalApplications / totalScholarships : 0

  // Métriques temporelles
  const applicationsByDay = generateTimeSeriesData(applications, timeframe, 'created_at')
  const viewsByDay = generateTimeSeriesData(events.filter(e => e.event_type === 'scholarship_view'), timeframe, 'created_at')

  // Métriques géographiques
  const applicationsByCountry = applications.reduce((acc, app) => {
    const country = app.profiles?.nationality || app.profiles?.country || 'Non spécifié'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Performance des bourses
  const scholarshipPerformance = scholarships.map(scholarship => {
    const scholarshipApps = applications.filter(app => app.scholarship_id === scholarship.id)
    const views = events.filter(e => 
      e.event_type === 'scholarship_view' && e.scholarship_id === scholarship.id
    ).length

    return {
      scholarship_id: scholarship.id,
      title: scholarship.title,
      amount: scholarship.amount,
      applications_count: scholarshipApps.length,
      accepted_count: scholarshipApps.filter(a => a.status === 'accepted').length,
      rejected_count: scholarshipApps.filter(a => a.status === 'rejected').length,
      pending_count: scholarshipApps.filter(a => a.status === 'pending' || a.status === 'under_review').length,
      views_count: views,
      conversion_rate: views > 0 ? (scholarshipApps.length / views) * 100 : 0,
      success_rate: scholarshipApps.length > 0 ? (scholarshipApps.filter(a => a.status === 'accepted').length / scholarshipApps.length) * 100 : 0
    }
  }).sort((a, b) => b.applications_count - a.applications_count)

  // Tendances et prédictions
  const trends = calculateTrends(applications, timeframe)
  const predictions = generatePredictions(applicationsByDay, timeframe)

  // Métriques d'engagement
  const engagementMetrics = calculateEngagementMetrics(events, applications)

  return {
    overview: {
      totalScholarships,
      activeScholarships,
      totalApplications,
      acceptedApplications,
      rejectedApplications,
      pendingApplications,
      successRate,
      totalFunding,
      avgApplicationsPerScholarship
    },
    timeSeries: {
      applicationsByDay,
      viewsByDay
    },
    geographic: {
      applicationsByCountry: Object.entries(applicationsByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ name: country, value: count }))
    },
    scholarshipPerformance,
    trends,
    predictions,
    engagement: engagementMetrics,
    insights: generateInsights(scholarships, applications, events)
  }
}

function generateTimeSeriesData(data: any[], timeframe: string, dateField: string) {
  const result = []
  const now = new Date()
  
  let days = 30
  switch (timeframe) {
    case '7d': days = 7; break
    case '30d': days = 30; break
    case '90d': days = 90; break
    case '1y': days = 365; break
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]
    
    const count = data.filter(item => 
      item[dateField] && item[dateField].startsWith(dateKey)
    ).length

    result.push({
      date: dateKey,
      name: date.toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      value: count
    })
  }

  return result
}

function calculateTrends(applications: any[], timeframe: string) {
  const now = new Date()
  const halfPeriod = new Date(now)
  
  switch (timeframe) {
    case '7d':
      halfPeriod.setDate(halfPeriod.getDate() - 3.5)
      break
    case '30d':
      halfPeriod.setDate(halfPeriod.getDate() - 15)
      break
    case '90d':
      halfPeriod.setDate(halfPeriod.getDate() - 45)
      break
    case '1y':
      halfPeriod.setMonth(halfPeriod.getMonth() - 6)
      break
  }

  const recentApps = applications.filter(app => 
    new Date(app.created_at) > halfPeriod
  ).length

  const olderApps = applications.filter(app => 
    new Date(app.created_at) <= halfPeriod
  ).length

  const trend = olderApps > 0 ? ((recentApps - olderApps) / olderApps) * 100 : 0

  return {
    applicationTrend: {
      value: trend,
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      percentage: Math.abs(trend)
    },
    acceptanceRateTrend: calculateAcceptanceRateTrend(applications, halfPeriod),
    popularityTrend: calculatePopularityTrend(applications, halfPeriod)
  }
}

function calculateAcceptanceRateTrend(applications: any[], halfPeriod: Date) {
  const recentApps = applications.filter(app => new Date(app.created_at) > halfPeriod)
  const olderApps = applications.filter(app => new Date(app.created_at) <= halfPeriod)

  const recentAcceptanceRate = recentApps.length > 0 
    ? (recentApps.filter(a => a.status === 'accepted').length / recentApps.length) * 100 
    : 0

  const olderAcceptanceRate = olderApps.length > 0 
    ? (olderApps.filter(a => a.status === 'accepted').length / olderApps.length) * 100 
    : 0

  const trend = olderAcceptanceRate > 0 ? recentAcceptanceRate - olderAcceptanceRate : 0

  return {
    value: trend,
    direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
    percentage: Math.abs(trend)
  }
}

function calculatePopularityTrend(applications: any[], halfPeriod: Date) {
  // Calculer la tendance de popularité basée sur le volume de candidatures
  const recentVolume = applications.filter(app => new Date(app.created_at) > halfPeriod).length
  const olderVolume = applications.filter(app => new Date(app.created_at) <= halfPeriod).length

  const trend = olderVolume > 0 ? ((recentVolume - olderVolume) / olderVolume) * 100 : 0

  return {
    value: trend,
    direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
    percentage: Math.abs(trend)
  }
}

function generatePredictions(timeSeriesData: any[], timeframe: string) {
  if (timeSeriesData.length < 7) {
    return {
      nextWeekApplications: 0,
      nextMonthApplications: 0,
      confidence: 'low'
    }
  }

  // Calcul simple de tendance linéaire
  const recentData = timeSeriesData.slice(-7)
  const avgDaily = recentData.reduce((sum, day) => sum + day.value, 0) / recentData.length

  // Calculer la tendance
  const firstHalf = recentData.slice(0, 3).reduce((sum, day) => sum + day.value, 0) / 3
  const secondHalf = recentData.slice(-3).reduce((sum, day) => sum + day.value, 0) / 3
  const trendFactor = secondHalf > firstHalf ? 1.1 : secondHalf < firstHalf ? 0.9 : 1

  return {
    nextWeekApplications: Math.round(avgDaily * 7 * trendFactor),
    nextMonthApplications: Math.round(avgDaily * 30 * trendFactor),
    confidence: recentData.some(d => d.value > 0) ? 'medium' : 'low'
  }
}

function calculateEngagementMetrics(events: any[], applications: any[]) {
  const viewEvents = events.filter(e => e.event_type === 'scholarship_view')
  const totalViews = viewEvents.length
  const uniqueViewers = new Set(viewEvents.map(e => e.user_id)).size
  const totalApplications = applications.length

  const conversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0
  const engagementRate = uniqueViewers > 0 ? (totalApplications / uniqueViewers) * 100 : 0

  // Calculer le temps moyen entre vue et candidature
  const avgTimeToApply = calculateAverageTimeToApply(events, applications)

  return {
    totalViews,
    uniqueViewers,
    conversionRate,
    engagementRate,
    avgTimeToApply,
    bounceRate: totalViews > 0 ? ((totalViews - uniqueViewers) / totalViews) * 100 : 0
  }
}

function calculateAverageTimeToApply(events: any[], applications: any[]): number {
  const timeDifferences = []

  for (const application of applications) {
    const viewEvent = events.find(e => 
      e.event_type === 'scholarship_view' && 
      e.scholarship_id === application.scholarship_id &&
      e.user_id === application.student_id &&
      new Date(e.created_at) < new Date(application.created_at)
    )

    if (viewEvent) {
      const timeDiff = new Date(application.created_at).getTime() - new Date(viewEvent.created_at).getTime()
      timeDifferences.push(timeDiff / (1000 * 60 * 60 * 24)) // en jours
    }
  }

  return timeDifferences.length > 0 
    ? timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length 
    : 0
}

function generateInsights(scholarships: any[], applications: any[], events: any[]) {
  const insights = []

  // Insight sur les bourses les plus populaires
  const scholarshipPopularity = scholarships.map(s => ({
    ...s,
    applicationCount: applications.filter(a => a.scholarship_id === s.id).length
  })).sort((a, b) => b.applicationCount - a.applicationCount)

  if (scholarshipPopularity.length > 0 && scholarshipPopularity[0].applicationCount > 0) {
    insights.push({
      type: 'top_performer',
      title: 'Bourse la plus populaire',
      description: `"${scholarshipPopularity[0].title}" a reçu ${scholarshipPopularity[0].applicationCount} candidatures`,
      actionable: true,
      suggestion: 'Considérez créer des bourses similaires'
    })
  }

  // Insight sur les taux d'acceptation
  const overallSuccessRate = applications.length > 0 
    ? (applications.filter(a => a.status === 'accepted').length / applications.length) * 100 
    : 0

  if (overallSuccessRate < 10 && applications.length > 20) {
    insights.push({
      type: 'low_acceptance',
      title: 'Taux d\'acceptation faible',
      description: `Seulement ${overallSuccessRate.toFixed(1)}% des candidatures sont acceptées`,
      actionable: true,
      suggestion: 'Révisez vos critères ou augmentez le nombre de bourses'
    })
  }

  // Insight sur la diversité géographique
  const countries = new Set(applications.map(a => a.profiles?.nationality).filter(Boolean))
  if (countries.size > 10) {
    insights.push({
      type: 'geographic_diversity',
      title: 'Excellente diversité géographique',
      description: `Candidats de ${countries.size} pays différents`,
      actionable: false,
      suggestion: 'Continuez à promouvoir l\'internationalisation'
    })
  }

  // Insight sur les deadlines
  const expiredScholarships = scholarships.filter(s => 
    new Date(s.application_deadline) < now && s.is_active
  )
  if (expiredScholarships.length > 0) {
    insights.push({
      type: 'expired_scholarships',
      title: 'Bourses expirées',
      description: `${expiredScholarships.length} bourses ont dépassé leur deadline`,
      actionable: true,
      suggestion: 'Archivez ces bourses ou prolongez les deadlines'
    })
  }

  // Insight sur l'engagement
  const viewEvents = events.filter(e => e.event_type === 'scholarship_view')
  const conversionRate = viewEvents.length > 0 ? (applications.length / viewEvents.length) * 100 : 0
  
  if (conversionRate > 15) {
    insights.push({
      type: 'high_conversion',
      title: 'Excellent taux de conversion',
      description: `${conversionRate.toFixed(1)}% des visiteurs postulent`,
      actionable: false,
      suggestion: 'Vos bourses sont très attractives'
    })
  } else if (conversionRate < 5 && viewEvents.length > 50) {
    insights.push({
      type: 'low_conversion',
      title: 'Taux de conversion faible',
      description: `Seulement ${conversionRate.toFixed(1)}% des visiteurs postulent`,
      actionable: true,
      suggestion: 'Améliorez la description ou simplifiez le processus'
    })
  }

  return insights
}