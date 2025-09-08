// Edge Function: recommendation-tracker
// Suivi des interactions avec les recommandations

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
    const { action, recommendationId, type, userId, metadata } = await req.json()

    if (!action || !recommendationId || !type) {
      throw new Error('Paramètres manquants: action, recommendationId, type requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (action) {
      case 'mark_viewed':
        return await markRecommendationViewed(supabase, recommendationId, type, userId)
      
      case 'track_interaction':
        return await trackInteraction(supabase, recommendationId, type, userId, metadata)
      
      case 'record_feedback':
        return await recordFeedback(supabase, recommendationId, type, userId, metadata)
      
      default:
        throw new Error(`Action non supportée: ${action}`)
    }

  } catch (error) {
    console.error('Erreur recommendation tracker:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'RECOMMENDATION_TRACKER_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function markRecommendationViewed(
  supabase: any, 
  recommendationId: string, 
  type: string, 
  userId?: string
) {
  try {
    if (type === 'scholarship') {
      // Marquer la recommandation de bourse comme vue
      await supabase
        .from('ml_recommendations')
        .update({ 
          is_viewed: true,
          viewed_at: new Date().toISOString()
        })
        .eq('scholarship_id', recommendationId)
        .eq('student_id', userId)
    }

    // Enregistrer l'événement d'analyse
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'recommendation_viewed',
        user_id: userId,
        scholarship_id: type === 'scholarship' ? recommendationId : null,
        event_data: {
          recommendation_type: type,
          recommendation_id: recommendationId,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(JSON.stringify({
      success: true,
      message: 'Recommandation marquée comme vue'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    throw new Error(`Erreur marquage vue: ${error.message}`)
  }
}

async function trackInteraction(
  supabase: any,
  recommendationId: string,
  type: string,
  userId?: string,
  metadata?: any
) {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'recommendation_interaction',
        user_id: userId,
        scholarship_id: type === 'scholarship' ? recommendationId : null,
        event_data: {
          recommendation_type: type,
          recommendation_id: recommendationId,
          interaction_type: metadata?.interactionType || 'click',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      })

    return new Response(JSON.stringify({
      success: true,
      message: 'Interaction enregistrée'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    throw new Error(`Erreur enregistrement interaction: ${error.message}`)
  }
}

async function recordFeedback(
  supabase: any,
  recommendationId: string,
  type: string,
  userId?: string,
  metadata?: any
) {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'recommendation_feedback',
        user_id: userId,
        scholarship_id: type === 'scholarship' ? recommendationId : null,
        event_data: {
          recommendation_type: type,
          recommendation_id: recommendationId,
          feedback_type: metadata?.feedbackType || 'rating',
          feedback_value: metadata?.feedbackValue,
          feedback_comment: metadata?.comment,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback enregistré'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    throw new Error(`Erreur enregistrement feedback: ${error.message}`)
  }
}