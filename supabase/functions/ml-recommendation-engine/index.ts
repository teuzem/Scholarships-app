// Edge Function: ml-recommendation-engine
// Moteur de recommandations ML avancé pour bourses d'études

import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface StudentProfile {
  id: string
  field_of_study?: string
  current_education_level?: string
  gpa?: number
  nationality?: string
  languages_spoken?: string[]
  preferred_study_countries?: string[]
  preferred_study_fields?: string[]
  financial_need_level?: number
  academic_achievements?: string
  work_experience?: string
  date_of_birth?: string
}

interface Scholarship {
  id: string
  title: string
  description: string
  amount?: number
  currency?: string
  study_level?: string
  study_fields: string[]
  target_countries?: string[]
  target_nationalities?: string[]
  min_gpa?: number
  min_age?: number
  max_age?: number
  application_deadline: string
  eligibility_criteria: string
  required_languages?: string[]
  scholarship_type?: string
  renewable?: boolean
  institution_id: string
  is_active: boolean
  is_featured: boolean
}

interface RecommendationFactors {
  fieldMatch: number
  levelMatch: number
  countryMatch: number
  nationalityMatch: number
  gpaMatch: number
  ageMatch: number
  languageMatch: number
  deadlineUrgency: number
  amountScore: number
  eligibilityMatch: number
  experienceMatch: number
  achievementMatch: number
  institutionPrestige: number
  renewabilityBonus: number
  featuredBonus: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { userId, limit = 20, minScore = 60 } = await req.json()

    if (!userId) {
      throw new Error('userId requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer le profil étudiant complet
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile || profile.user_type !== 'student') {
      throw new Error('Profil étudiant non trouvé')
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle()

    // Récupérer toutes les bourses actives
    const { data: scholarships, error: scholarshipsError } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', new Date().toISOString())

    if (scholarshipsError) {
      throw new Error(`Erreur récupération bourses: ${scholarshipsError.message}`)
    }

    // Générer les recommandations avec scores ML
    const recommendations = await generateAdvancedRecommendations(
      supabase,
      profile,
      studentProfile,
      scholarships || [],
      limit,
      minScore
    )

    // Sauvegarder l'historique des recommandations
    await saveRecommendationHistory(supabase, userId, recommendations)

    return new Response(JSON.stringify({
      success: true,
      data: recommendations,
      metadata: {
        totalScholarships: scholarships?.length || 0,
        recommendationsGenerated: recommendations.length,
        averageScore: recommendations.length > 0 
          ? recommendations.reduce((sum, r) => sum + r.match_score, 0) / recommendations.length 
          : 0,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erreur ML recommendation engine:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ML_RECOMMENDATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateAdvancedRecommendations(
  supabase: any,
  profile: any,
  studentProfile: StudentProfile | null,
  scholarships: Scholarship[],
  limit: number,
  minScore: number
) {
  const recommendations = []

  for (const scholarship of scholarships) {
    const factors = await calculateRecommendationFactors(
      supabase,
      profile,
      studentProfile,
      scholarship
    )
    
    const matchScore = calculateWeightedScore(factors)
    
    if (matchScore >= minScore) {
      recommendations.push({
        scholarship_id: scholarship.id,
        student_id: profile.id,
        match_score: Math.round(matchScore * 100) / 100,
        recommendation_factors: factors,
        scholarship_data: {
          title: scholarship.title,
          description: scholarship.description,
          amount: scholarship.amount,
          currency: scholarship.currency,
          application_deadline: scholarship.application_deadline,
          study_level: scholarship.study_level,
          study_fields: scholarship.study_fields,
          target_countries: scholarship.target_countries,
          institution_id: scholarship.institution_id
        },
        reasons: generateRecommendationReasons(factors, scholarship),
        confidence_level: getConfidenceLevel(matchScore),
        urgency_level: getUrgencyLevel(scholarship.application_deadline),
        generated_at: new Date().toISOString()
      })
    }
  }

  // Trier par score décroissant et limiter
  return recommendations
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit)
}

async function calculateRecommendationFactors(
  supabase: any,
  profile: any,
  studentProfile: StudentProfile | null,
  scholarship: Scholarship
): Promise<RecommendationFactors> {
  const factors: RecommendationFactors = {
    fieldMatch: 0,
    levelMatch: 0,
    countryMatch: 0,
    nationalityMatch: 0,
    gpaMatch: 0,
    ageMatch: 0,
    languageMatch: 0,
    deadlineUrgency: 0,
    amountScore: 0,
    eligibilityMatch: 0,
    experienceMatch: 0,
    achievementMatch: 0,
    institutionPrestige: 0,
    renewabilityBonus: 0,
    featuredBonus: 0
  }

  if (!studentProfile) return factors

  // 1. Correspondance du domaine d'étude (poids: 25%)
  if (studentProfile.field_of_study && scholarship.study_fields) {
    const studentField = studentProfile.field_of_study.toLowerCase()
    const matchingFields = scholarship.study_fields.filter(field => 
      field.toLowerCase().includes(studentField) || 
      studentField.includes(field.toLowerCase()) ||
      calculateSemanticSimilarity(studentField, field.toLowerCase()) > 0.7
    )
    factors.fieldMatch = Math.min(matchingFields.length / scholarship.study_fields.length, 1) * 100
  }

  // 2. Correspondance du niveau d'étude (poids: 20%)
  if (studentProfile.current_education_level && scholarship.study_level) {
    const levelMapping: Record<string, string[]> = {
      'High School': ['Bachelor', 'Associate'],
      'Bachelor': ['Master', 'Graduate'],
      'Master': ['PhD', 'Doctorate', 'Postgraduate'],
      'PhD': ['Postdoc', 'Research']
    }
    
    const compatibleLevels = levelMapping[studentProfile.current_education_level] || []
    if (compatibleLevels.includes(scholarship.study_level) || 
        scholarship.study_level === studentProfile.current_education_level) {
      factors.levelMatch = 100
    } else if (scholarship.study_level === 'All' || scholarship.study_level === 'Any') {
      factors.levelMatch = 80
    }
  }

  // 3. Correspondance géographique (poids: 15%)
  if (studentProfile.preferred_study_countries && scholarship.target_countries) {
    const commonCountries = studentProfile.preferred_study_countries.filter(country =>
      scholarship.target_countries!.includes(country)
    )
    factors.countryMatch = (commonCountries.length / studentProfile.preferred_study_countries.length) * 100
  }

  // 4. Correspondance de nationalité (poids: 10%)
  if (studentProfile.nationality && scholarship.target_nationalities) {
    if (scholarship.target_nationalities.includes(studentProfile.nationality)) {
      factors.nationalityMatch = 100
    }
  } else if (!scholarship.target_nationalities) {
    factors.nationalityMatch = 80 // Pas de restriction = bonus
  }

  // 5. Correspondance GPA (poids: 15%)
  if (scholarship.min_gpa && studentProfile.gpa) {
    if (studentProfile.gpa >= scholarship.min_gpa) {
      const excess = studentProfile.gpa - scholarship.min_gpa
      factors.gpaMatch = Math.min(80 + (excess * 20), 100)
    } else {
      factors.gpaMatch = Math.max(0, (studentProfile.gpa / scholarship.min_gpa) * 60)
    }
  } else if (!scholarship.min_gpa) {
    factors.gpaMatch = 80 // Pas de restriction GPA
  }

  // 6. Correspondance d'âge (poids: 5%)
  if (studentProfile.date_of_birth && (scholarship.min_age || scholarship.max_age)) {
    const age = calculateAge(studentProfile.date_of_birth)
    const minAge = scholarship.min_age || 0
    const maxAge = scholarship.max_age || 100
    
    if (age >= minAge && age <= maxAge) {
      factors.ageMatch = 100
    } else {
      factors.ageMatch = 0
    }
  } else {
    factors.ageMatch = 80 // Pas de restriction d'âge
  }

  // 7. Correspondance linguistique (poids: 10%)
  if (scholarship.required_languages && studentProfile.languages_spoken) {
    const requiredLangs = scholarship.required_languages
    const spokenLangs = studentProfile.languages_spoken
    const matchingLangs = requiredLangs.filter(lang => spokenLangs.includes(lang))
    factors.languageMatch = (matchingLangs.length / requiredLangs.length) * 100
  } else if (!scholarship.required_languages) {
    factors.languageMatch = 80
  }

  // 8. Urgence de la deadline (facteur temporel)
  const daysUntilDeadline = Math.ceil(
    (new Date(scholarship.application_deadline).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilDeadline <= 7) {
    factors.deadlineUrgency = 100 // Très urgent
  } else if (daysUntilDeadline <= 30) {
    factors.deadlineUrgency = 80 // Urgent
  } else if (daysUntilDeadline <= 90) {
    factors.deadlineUrgency = 60 // Modéré
  } else {
    factors.deadlineUrgency = 40 // Pas urgent
  }

  // 9. Score du montant (facteur financier)
  if (scholarship.amount) {
    if (scholarship.amount >= 50000) factors.amountScore = 100
    else if (scholarship.amount >= 25000) factors.amountScore = 80
    else if (scholarship.amount >= 10000) factors.amountScore = 60
    else if (scholarship.amount >= 5000) factors.amountScore = 40
    else factors.amountScore = 20
  }

  // 10. Analyse sémantique des critères d'éligibilité
  if (scholarship.eligibility_criteria && studentProfile.academic_achievements) {
    factors.eligibilityMatch = await analyzeEligibilityCriteria(
      scholarship.eligibility_criteria,
      studentProfile
    )
  }

  // 11. Correspondance d'expérience
  if (studentProfile.work_experience && scholarship.eligibility_criteria) {
    factors.experienceMatch = analyzeWorkExperience(
      studentProfile.work_experience,
      scholarship.eligibility_criteria
    )
  }

  // 12. Score des réalisations académiques
  if (studentProfile.academic_achievements) {
    factors.achievementMatch = analyzeAcademicAchievements(
      studentProfile.academic_achievements
    )
  }

  // 13. Prestige de l'institution
  factors.institutionPrestige = await calculateInstitutionPrestige(
    supabase,
    scholarship.institution_id
  )

  // 14. Bonus pour les bourses renouvelables
  if (scholarship.renewable) {
    factors.renewabilityBonus = 15
  }

  // 15. Bonus pour les bourses recommandées
  if (scholarship.is_featured) {
    factors.featuredBonus = 10
  }

  return factors
}

function calculateWeightedScore(factors: RecommendationFactors): number {
  const weights = {
    fieldMatch: 0.25,
    levelMatch: 0.20,
    countryMatch: 0.15,
    gpaMatch: 0.15,
    languageMatch: 0.10,
    nationalityMatch: 0.10,
    ageMatch: 0.05,
    deadlineUrgency: 0.05,
    amountScore: 0.08,
    eligibilityMatch: 0.12,
    experienceMatch: 0.08,
    achievementMatch: 0.10,
    institutionPrestige: 0.07,
    renewabilityBonus: 0.03,
    featuredBonus: 0.02
  }

  let totalScore = 0
  let totalWeight = 0

  for (const [factor, weight] of Object.entries(weights)) {
    const value = factors[factor as keyof RecommendationFactors]
    if (value > 0) {
      totalScore += value * weight
      totalWeight += weight
    }
  }

  // Normaliser le score
  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0
  
  // Appliquer les bonus
  const bonusScore = factors.renewabilityBonus + factors.featuredBonus
  
  return Math.min(normalizedScore + bonusScore, 100)
}

function calculateSemanticSimilarity(text1: string, text2: string): number {
  // Algorithme de similarité sémantique simplifié
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  // Synonymes et termes liés par domaine
  const synonyms: Record<string, string[]> = {
    'computer': ['informatique', 'computing', 'software', 'programming'],
    'medicine': ['médecine', 'medical', 'health', 'healthcare', 'santé'],
    'engineering': ['ingénierie', 'ingénieur', 'technique', 'technology'],
    'business': ['commerce', 'management', 'économie', 'finance'],
    'science': ['sciences', 'research', 'recherche', 'scientifique'],
    'art': ['arts', 'design', 'creative', 'créatif'],
    'law': ['droit', 'legal', 'juridique'],
    'education': ['éducation', 'teaching', 'enseignement', 'pédagogie']
  }

  let matches = 0
  let totalComparisons = 0

  for (const word1 of words1) {
    for (const word2 of words2) {
      totalComparisons++
      
      // Correspondance exacte
      if (word1 === word2) {
        matches += 1
        continue
      }
      
      // Correspondance par synonymes
      for (const [key, syns] of Object.entries(synonyms)) {
        if ((syns.includes(word1) || word1.includes(key)) && 
            (syns.includes(word2) || word2.includes(key))) {
          matches += 0.8
          break
        }
      }
      
      // Correspondance partielle (sous-chaînes)
      if (word1.length > 3 && word2.length > 3) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches += 0.6
        }
      }
    }
  }

  return totalComparisons > 0 ? matches / totalComparisons : 0
}

async function analyzeEligibilityCriteria(
  criteria: string,
  studentProfile: StudentProfile
): Promise<number> {
  const criteriaLower = criteria.toLowerCase()
  let score = 50 // Score de base
  
  // Analyser les mots-clés dans les critères
  const keywords = {
    gpa: ['gpa', 'grade', 'note', 'moyenne'],
    experience: ['experience', 'expérience', 'work', 'travail'],
    achievement: ['achievement', 'award', 'prix', 'distinction', 'honor'],
    language: ['language', 'langue', 'english', 'français', 'spanish'],
    research: ['research', 'recherche', 'publication', 'thesis', 'thèse']
  }

  // Vérifier la correspondance avec le profil
  if (studentProfile.gpa && keywords.gpa.some(k => criteriaLower.includes(k))) {
    if (studentProfile.gpa >= 3.5) score += 20
    else if (studentProfile.gpa >= 3.0) score += 10
  }

  if (studentProfile.work_experience && keywords.experience.some(k => criteriaLower.includes(k))) {
    score += 15
  }

  if (studentProfile.academic_achievements && keywords.achievement.some(k => criteriaLower.includes(k))) {
    score += 15
  }

  if (studentProfile.languages_spoken && keywords.language.some(k => criteriaLower.includes(k))) {
    score += 10
  }

  return Math.min(score, 100)
}

function analyzeWorkExperience(experience: string, criteria: string): number {
  if (!experience || !criteria) return 0
  
  const expLower = experience.toLowerCase()
  const criteriaLower = criteria.toLowerCase()
  
  // Mots-clés d'expérience valorisés
  const experienceKeywords = [
    'internship', 'stage', 'research', 'recherche', 'project', 'projet',
    'leadership', 'management', 'volunteer', 'bénévole', 'publication'
  ]
  
  let score = 0
  for (const keyword of experienceKeywords) {
    if (expLower.includes(keyword) && criteriaLower.includes(keyword)) {
      score += 15
    }
  }
  
  return Math.min(score, 100)
}

function analyzeAcademicAchievements(achievements: string): number {
  if (!achievements) return 0
  
  const achievementsLower = achievements.toLowerCase()
  let score = 20 // Score de base pour avoir des réalisations
  
  // Mots-clés valorisés
  const highValueKeywords = [
    'publication', 'research', 'award', 'prix', 'honor', 'distinction',
    'scholarship', 'bourse', 'dean', 'summa cum laude', 'magna cum laude'
  ]
  
  const mediumValueKeywords = [
    'project', 'projet', 'competition', 'concours', 'conference',
    'presentation', 'thesis', 'thèse', 'internship', 'stage'
  ]
  
  for (const keyword of highValueKeywords) {
    if (achievementsLower.includes(keyword)) {
      score += 15
    }
  }
  
  for (const keyword of mediumValueKeywords) {
    if (achievementsLower.includes(keyword)) {
      score += 8
    }
  }
  
  return Math.min(score, 100)
}

async function calculateInstitutionPrestige(supabase: any, institutionId: string): Promise<number> {
  try {
    const { data: institution } = await supabase
      .from('institutions')
      .select('ranking_global, ranking_national, established_year')
      .eq('id', institutionId)
      .maybeSingle()

    if (!institution) return 50

    let score = 50

    // Classement mondial
    if (institution.ranking_global) {
      if (institution.ranking_global <= 50) score += 30
      else if (institution.ranking_global <= 100) score += 25
      else if (institution.ranking_global <= 200) score += 20
      else if (institution.ranking_global <= 500) score += 15
      else score += 10
    }

    // Ancienneté (institutions établies)
    if (institution.established_year) {
      const age = new Date().getFullYear() - institution.established_year
      if (age >= 100) score += 10
      else if (age >= 50) score += 5
    }

    return Math.min(score, 100)
  } catch (error) {
    return 50 // Score neutre en cas d'erreur
  }
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

function generateRecommendationReasons(
  factors: RecommendationFactors,
  scholarship: Scholarship
): string[] {
  const reasons: string[] = []

  if (factors.fieldMatch >= 80) {
    reasons.push('Parfaite correspondance avec votre domaine d\'étude')
  } else if (factors.fieldMatch >= 60) {
    reasons.push('Domaine d\'étude compatible')
  }

  if (factors.levelMatch >= 90) {
    reasons.push('Niveau d\'étude idéal pour votre progression')
  }

  if (factors.countryMatch >= 80) {
    reasons.push('Destination d\'étude préférée')
  }

  if (factors.gpaMatch >= 90) {
    reasons.push('Votre GPA dépasse largement les exigences')
  } else if (factors.gpaMatch >= 70) {
    reasons.push('GPA compatible avec les exigences')
  }

  if (factors.languageMatch >= 80) {
    reasons.push('Compétences linguistiques correspondantes')
  }

  if (factors.institutionPrestige >= 80) {
    reasons.push('Institution de prestige international')
  }

  if (scholarship.amount && scholarship.amount >= 20000) {
    reasons.push('Financement substantiel offert')
  }

  if (scholarship.renewable) {
    reasons.push('Bourse renouvelable - sécurité financière')
  }

  if (factors.deadlineUrgency >= 80) {
    reasons.push('Deadline approche - action recommandée')
  }

  if (factors.achievementMatch >= 70) {
    reasons.push('Vos réalisations académiques sont valorisées')
  }

  if (factors.experienceMatch >= 70) {
    reasons.push('Votre expérience professionnelle est un atout')
  }

  // Assurer au moins 2 raisons
  if (reasons.length === 0) {
    reasons.push('Critères d\'éligibilité correspondants')
    reasons.push('Opportunité adaptée à votre profil')
  } else if (reasons.length === 1) {
    reasons.push('Profil compatible avec les exigences')
  }

  return reasons.slice(0, 5) // Limiter à 5 raisons max
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high'
  if (score >= 70) return 'medium'
  return 'low'
}

function getUrgencyLevel(deadline: string): 'high' | 'medium' | 'low' {
  const daysUntilDeadline = Math.ceil(
    (new Date(deadline).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilDeadline <= 14) return 'high'
  if (daysUntilDeadline <= 45) return 'medium'
  return 'low'
}

async function saveRecommendationHistory(
  supabase: any,
  userId: string,
  recommendations: any[]
) {
  try {
    const historyEntries = recommendations.map(rec => ({
      user_id: userId,
      scholarship_id: rec.scholarship_id,
      recommendation_score: rec.match_score,
      factors_considered: rec.recommendation_factors,
      algorithm_version: 'v2.1.0',
      created_at: new Date().toISOString()
    }))

    await supabase
      .from('recommendation_history')
      .insert(historyEntries)
  } catch (error) {
    console.error('Erreur sauvegarde historique:', error)
    // Ne pas faire échouer la fonction pour cette erreur
  }
}