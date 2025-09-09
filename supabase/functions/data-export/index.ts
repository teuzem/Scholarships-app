// Edge Function: data-export
// Export de données pour les institutions

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
    const { institutionId, dataType, format = 'csv', filters = {} } = await req.json()

    if (!institutionId || !dataType) {
      throw new Error('institutionId et dataType requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let exportData: string

    switch (dataType) {
      case 'scholarships':
        exportData = await exportScholarships(supabase, institutionId, format, filters)
        break
      case 'applications':
        exportData = await exportApplications(supabase, institutionId, format, filters)
        break
      case 'analytics':
        exportData = await exportAnalytics(supabase, institutionId, format, filters)
        break
      default:
        throw new Error(`Type de données non supporté: ${dataType}`)
    }

    return new Response(exportData, {
      headers: {
        ...corsHeaders,
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="${dataType}-${new Date().toISOString().split('T')[0]}.${format}"`
      }
    })

  } catch (error) {
    console.error('Erreur data export:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'DATA_EXPORT_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function exportScholarships(supabase: any, institutionId: string, format: string, filters: any) {
  const { data: scholarships, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('institution_id', institutionId)

  if (error) throw error

  if (format === 'csv') {
    const headers = [
      'ID', 'Titre', 'Description', 'Montant', 'Devise', 'Type',
      'Niveau d\'étude', 'Domaines', 'Date limite', 'Statut', 'Créée le'
    ]

    const rows = scholarships.map(s => [
      s.id,
      s.title,
      s.description,
      s.amount || '',
      s.currency || '',
      s.scholarship_type || '',
      s.study_level || '',
      (s.study_fields || []).join('; '),
      s.application_deadline,
      s.is_active ? 'Active' : 'Inactive',
      new Date(s.created_at).toLocaleDateString('fr-FR')
    ])

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  return JSON.stringify(scholarships, null, 2)
}

async function exportApplications(supabase: any, institutionId: string, format: string, filters: any) {
  // Récupérer les IDs des bourses de l'institution
  const { data: scholarshipIds } = await supabase
    .from('scholarships')
    .select('id')
    .eq('institution_id', institutionId)

  if (!scholarshipIds || scholarshipIds.length === 0) {
    return format === 'csv' ? 'Aucune donnée disponible' : '[]'
  }

  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      scholarships(title, amount),
      profiles(full_name, email, phone)
    `)
    .in('scholarship_id', scholarshipIds.map(s => s.id))

  if (error) throw error

  if (format === 'csv') {
    const headers = [
      'ID', 'Candidat', 'Email', 'Téléphone', 'Bourse', 'Montant',
      'Statut', 'Date candidature', 'Date examen', 'Notes'
    ]

    const rows = applications.map(a => [
      a.id,
      a.profiles?.full_name || '',
      a.profiles?.email || '',
      a.profiles?.phone || '',
      a.scholarships?.title || '',
      a.scholarships?.amount || '',
      a.status || '',
      new Date(a.created_at).toLocaleDateString('fr-FR'),
      a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('fr-FR') : '',
      a.notes || ''
    ])

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  return JSON.stringify(applications, null, 2)
}

async function exportAnalytics(supabase: any, institutionId: string, format: string, filters: any) {
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) throw error

  if (format === 'csv') {
    const headers = [
      'ID', 'Type d\'événement', 'Date', 'Bourse ID', 'Session ID', 'Données'
    ]

    const rows = events.map(e => [
      e.id,
      e.event_type,
      new Date(e.created_at).toLocaleString('fr-FR'),
      e.scholarship_id || '',
      e.session_id || '',
      JSON.stringify(e.event_data || {})
    ])

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  return JSON.stringify(events, null, 2)
}