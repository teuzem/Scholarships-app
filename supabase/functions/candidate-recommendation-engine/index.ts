// Edge Function: candidate-recommendation-engine
// Moteur de recommandations de candidats pour les institutions

import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface InstitutionProfile {
  id: string
  institution_name: string
  institution_type?: string
  country?: string
  focus_areas?: string[]
  ranking_global?: number
  total_students?: number
  scholarship_budget_annual?: number
}

interface StudentCandidate {
  id: string
  full_name: string
  email: string
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
  bio?: string
}

interface CandidateFactors {
  academicExcellence: number
  fieldAlignment: number
  geographicFit: number
  languageCompatibility: number
  experienceRelevance: number
  achievementQuality: number
  motivationAlignment: number
  diversityValue: number
  financialNeed: number
  careerPotential: number
  researchCapability: number
  leadershipPotential: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { institutionId, scholarshipId, limit = 50, minScore = 70 } = await req.json()

    if (!institutionId) {
      throw new Error('institutionId requis')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer le profil de l'institution
    const { data: institutionProfile } = await supabase
      .from('institution_profiles')
      .select('*')
      .eq('profile_id', institutionId)
      .single()

    if (!institutionProfile) {
      throw new Error('Profil institution non trouvé')
    }

    // Récupérer les informations de la bourse spécifique si fournie
    let scholarshipCriteria = null
    if (scholarshipId) {
      const { data: scholarship } = await supabase
        .from('scholarships')
        .select('*')
        .eq('id', scholarshipId)
        .single()
      scholarshipCriteria = scholarship
    }

    // Récupérer tous les profils étudiants actifs
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profiles!inner(
          id, full_name, email, bio, user_type, verified, created_at
        )
      `)
      .eq('profiles.user_type', 'student')

    if (studentsError) {
      throw new Error(`Erreur récupération étudiants: ${studentsError.message}`)
    }

    // Générer les recommandations de candidats
    const recommendations = await generateCandidateRecommendations(
      supabase,
      institutionProfile,
      scholarshipCriteria,
      students || [],
      limit,
      minScore
    )

    return new Response(JSON.stringify({
      success: true,
      data: recommendations,
      metadata: {
        totalCandidates: students?.length || 0,
        recommendationsGenerated: recommendations.length,
        averageScore: recommendations.length > 0 
          ? recommendations.reduce((sum, r) => sum + r.match_score, 0) / recommendations.length 
          : 0,
        institutionName: institutionProfile.institution_name,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erreur candidate recommendation engine:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'CANDIDATE_RECOMMENDATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateCandidateRecommendations(
  supabase: any,
  institutionProfile: InstitutionProfile,
  scholarshipCriteria: any,
  students: any[],
  limit: number,
  minScore: number
) {
  const recommendations = []

  for (const studentData of students) {
    const student = {
      ...studentData,
      ...studentData.profiles
    }

    const factors = await calculateCandidateFactors(
      supabase,
      institutionProfile,
      scholarshipCriteria,
      student
    )
    
    const matchScore = calculateCandidateScore(factors)
    
    if (matchScore >= minScore) {
      recommendations.push({
        candidate_id: student.id,
        institution_id: institutionProfile.id,
        match_score: Math.round(matchScore * 100) / 100,
        recommendation_factors: factors,
        candidate_data: {
          full_name: student.full_name,
          email: student.email,
          field_of_study: student.field_of_study,
          current_education_level: student.current_education_level,
          gpa: student.gpa,
          nationality: student.nationality,
          languages_spoken: student.languages_spoken,
          bio: student.bio,
          academic_achievements: student.academic_achievements,
          work_experience: student.work_experience
        },
        reasons: generateCandidateReasons(factors, student),
        fit_analysis: generateFitAnalysis(factors, institutionProfile),
        potential_contribution: assessPotentialContribution(student, institutionProfile),
        risk_assessment: assessCandidateRisk(student),
        generated_at: new Date().toISOString()
      })
    }
  }

  return recommendations
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit)
}

async function calculateCandidateFactors(
  supabase: any,
  institutionProfile: InstitutionProfile,
  scholarshipCriteria: any,
  student: StudentCandidate
): Promise<CandidateFactors> {
  const factors: CandidateFactors = {
    academicExcellence: 0,
    fieldAlignment: 0,
    geographicFit: 0,
    languageCompatibility: 0,
    experienceRelevance: 0,
    achievementQuality: 0,
    motivationAlignment: 0,
    diversityValue: 0,
    financialNeed: 0,
    careerPotential: 0,
    researchCapability: 0,
    leadershipPotential: 0
  }

  // 1. Excellence académique (25%)
  if (student.gpa) {
    if (student.gpa >= 3.9) factors.academicExcellence = 100
    else if (student.gpa >= 3.7) factors.academicExcellence = 90
    else if (student.gpa >= 3.5) factors.academicExcellence = 80
    else if (student.gpa >= 3.2) factors.academicExcellence = 70
    else if (student.gpa >= 3.0) factors.academicExcellence = 60
    else factors.academicExcellence = Math.max(0, (student.gpa / 3.0) * 50)
  }

  // 2. Alignement du domaine d'étude (20%)
  if (student.field_of_study && institutionProfile.focus_areas) {
    const studentField = student.field_of_study.toLowerCase()
    const matchingAreas = institutionProfile.focus_areas.filter(area =>
      area.toLowerCase().includes(studentField) ||
      studentField.includes(area.toLowerCase()) ||
      calculateSemanticSimilarity(studentField, area.toLowerCase()) > 0.7
    )
    factors.fieldAlignment = Math.min((matchingAreas.length / institutionProfile.focus_areas.length) * 100, 100)
  }

  // 3. Compatibilité géographique (10%)
  if (student.preferred_study_countries && institutionProfile.country) {
    if (student.preferred_study_countries.includes(institutionProfile.country)) {
      factors.geographicFit = 100
    } else {
      // Vérifier les pays voisins ou régions similaires
      factors.geographicFit = calculateGeographicCompatibility(
        student.preferred_study_countries,
        institutionProfile.country
      )
    }
  }

  // 4. Compatibilité linguistique (8%)
  if (student.languages_spoken) {
    const institutionCountry = institutionProfile.country?.toLowerCase()
    const languageMap: Record<string, string[]> = {
      'france': ['french', 'français'],
      'germany': ['german', 'deutsch', 'allemand'],
      'spain': ['spanish', 'español', 'espagnol'],
      'italy': ['italian', 'italiano', 'italien'],
      'united kingdom': ['english', 'anglais'],
      'united states': ['english', 'anglais'],
      'canada': ['english', 'french', 'anglais', 'français']
    }

    const requiredLanguages = languageMap[institutionCountry || ''] || ['english']
    const spokenLanguages = student.languages_spoken.map(l => l.toLowerCase())
    
    const hasRequiredLanguage = requiredLanguages.some(lang => 
      spokenLanguages.some(spoken => spoken.includes(lang) || lang.includes(spoken))
    )
    
    if (hasRequiredLanguage) {
      factors.languageCompatibility = 100
    } else {
      factors.languageCompatibility = Math.min(spokenLanguages.length * 20, 60)
    }
  }

  // 5. Pertinence de l'expérience (12%)
  if (student.work_experience) {
    factors.experienceRelevance = analyzeWorkExperienceRelevance(
      student.work_experience,
      institutionProfile.focus_areas || []
    )
  }

  // 6. Qualité des réalisations (15%)
  if (student.academic_achievements) {
    factors.achievementQuality = analyzeAchievementQuality(student.academic_achievements)
  }

  // 7. Alignement motivationnel (10%)
  if (student.bio) {
    factors.motivationAlignment = analyzeMotivationAlignment(
      student.bio,
      institutionProfile.focus_areas || []
    )
  }

  // 8. Valeur de diversité (5%)
  factors.diversityValue = calculateDiversityValue(student, institutionProfile)

  // 9. Besoin financier (3%)
  if (student.financial_need_level) {
    factors.financialNeed = student.financial_need_level * 20 // 1-5 scale to 0-100
  }

  // 10. Potentiel de carrière (7%)
  factors.careerPotential = assessCareerPotential(student)

  // 11. Capacité de recherche (8%)
  factors.researchCapability = assessResearchCapability(student)

  // 12. Potentiel de leadership (5%)
  factors.leadershipPotential = assessLeadershipPotential(student)

  return factors
}

function calculateCandidateScore(factors: CandidateFactors): number {
  const weights = {
    academicExcellence: 0.25,
    fieldAlignment: 0.20,
    geographicFit: 0.10,
    languageCompatibility: 0.08,
    experienceRelevance: 0.12,
    achievementQuality: 0.15,
    motivationAlignment: 0.10,
    diversityValue: 0.05,
    financialNeed: 0.03,
    careerPotential: 0.07,
    researchCapability: 0.08,
    leadershipPotential: 0.05
  }

  let totalScore = 0
  for (const [factor, weight] of Object.entries(weights)) {
    const value = factors[factor as keyof CandidateFactors]
    totalScore += value * weight
  }

  return Math.min(totalScore, 100)
}

function calculateSemanticSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  const synonyms: Record<string, string[]> = {
    'computer': ['informatique', 'computing', 'software', 'programming', 'tech'],
    'medicine': ['médecine', 'medical', 'health', 'healthcare', 'santé'],
    'engineering': ['ingénierie', 'ingénieur', 'technique', 'technology'],
    'business': ['commerce', 'management', 'économie', 'finance', 'marketing'],
    'science': ['sciences', 'research', 'recherche', 'scientifique'],
    'art': ['arts', 'design', 'creative', 'créatif', 'artistique'],
    'law': ['droit', 'legal', 'juridique', 'justice'],
    'education': ['éducation', 'teaching', 'enseignement', 'pédagogie']
  }

  let matches = 0
  let totalComparisons = 0

  for (const word1 of words1) {
    for (const word2 of words2) {
      totalComparisons++
      
      if (word1 === word2) {
        matches += 1
        continue
      }
      
      for (const [key, syns] of Object.entries(synonyms)) {
        if ((syns.includes(word1) || word1.includes(key)) && 
            (syns.includes(word2) || word2.includes(key))) {
          matches += 0.8
          break
        }
      }
      
      if (word1.length > 3 && word2.length > 3) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches += 0.6
        }
      }
    }
  }

  return totalComparisons > 0 ? matches / totalComparisons : 0
}

function calculateGeographicCompatibility(
  preferredCountries: string[],
  institutionCountry: string
): number {
  // Régions géographiques et compatibilités
  const regions: Record<string, string[]> = {
    'europe': ['france', 'germany', 'spain', 'italy', 'united kingdom', 'netherlands', 'belgium'],
    'north_america': ['united states', 'canada', 'mexico'],
    'asia': ['china', 'japan', 'south korea', 'singapore', 'india'],
    'oceania': ['australia', 'new zealand']
  }

  const instCountryLower = institutionCountry.toLowerCase()
  
  // Correspondance directe
  if (preferredCountries.some(country => country.toLowerCase() === instCountryLower)) {
    return 100
  }

  // Correspondance régionale
  for (const [region, countries] of Object.entries(regions)) {
    if (countries.includes(instCountryLower)) {
      const hasRegionalPreference = preferredCountries.some(country =>
        countries.includes(country.toLowerCase())
      )
      if (hasRegionalPreference) {
        return 70
      }
    }
  }

  return 30 // Score minimal pour ouverture internationale
}

function analyzeWorkExperienceRelevance(experience: string, focusAreas: string[]): number {
  if (!experience) return 0
  
  const expLower = experience.toLowerCase()
  let score = 20 // Score de base pour avoir de l'expérience
  
  // Mots-clés valorisés par domaine
  const domainKeywords: Record<string, string[]> = {
    'technology': ['programming', 'software', 'development', 'coding', 'tech', 'digital'],
    'research': ['research', 'recherche', 'analysis', 'study', 'investigation'],
    'healthcare': ['medical', 'health', 'patient', 'clinical', 'hospital'],
    'business': ['management', 'sales', 'marketing', 'finance', 'consulting'],
    'education': ['teaching', 'tutoring', 'training', 'education', 'mentoring']
  }

  for (const focusArea of focusAreas) {
    const areaLower = focusArea.toLowerCase()
    
    // Correspondance directe
    if (expLower.includes(areaLower)) {
      score += 25
    }
    
    // Correspondance par mots-clés
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (areaLower.includes(domain)) {
        const matchingKeywords = keywords.filter(keyword => expLower.includes(keyword))
        score += matchingKeywords.length * 8
      }
    }
  }

  // Bonus pour expérience internationale
  const internationalKeywords = ['international', 'global', 'abroad', 'étranger', 'overseas']
  if (internationalKeywords.some(keyword => expLower.includes(keyword))) {
    score += 15
  }

  return Math.min(score, 100)
}

function analyzeAchievementQuality(achievements: string): number {
  if (!achievements) return 0
  
  const achievementsLower = achievements.toLowerCase()
  let score = 30 // Score de base
  
  // Réalisations de haut niveau
  const highImpactKeywords = [
    'publication', 'patent', 'brevet', 'award', 'prix', 'medal', 'médaille',
    'scholarship', 'bourse', 'fellowship', 'grant', 'subvention',
    'first place', 'winner', 'champion', 'laureate', 'lauréat'
  ]
  
  // Réalisations académiques
  const academicKeywords = [
    'dean\'s list', 'honor roll', 'summa cum laude', 'magna cum laude',
    'valedictorian', 'thesis', 'thèse', 'research', 'conference'
  ]
  
  // Réalisations de leadership
  const leadershipKeywords = [
    'president', 'leader', 'captain', 'coordinator', 'organizer',
    'founder', 'fondateur', 'director', 'manager', 'head'
  ]

  for (const keyword of highImpactKeywords) {
    if (achievementsLower.includes(keyword)) {
      score += 20
    }
  }

  for (const keyword of academicKeywords) {
    if (achievementsLower.includes(keyword)) {
      score += 15
    }
  }

  for (const keyword of leadershipKeywords) {
    if (achievementsLower.includes(keyword)) {
      score += 12
    }
  }

  return Math.min(score, 100)
}

function analyzeMotivationAlignment(bio: string, focusAreas: string[]): number {
  if (!bio) return 0
  
  const bioLower = bio.toLowerCase()
  let score = 20 // Score de base
  
  // Mots-clés de motivation
  const motivationKeywords = [
    'passionate', 'passionné', 'dedicated', 'dévoué', 'committed', 'engagé',
    'aspire', 'aspirer', 'dream', 'rêve', 'goal', 'objectif', 'mission'
  ]
  
  for (const keyword of motivationKeywords) {
    if (bioLower.includes(keyword)) {
      score += 10
    }
  }

  // Alignement avec les domaines de focus
  for (const area of focusAreas) {
    if (bioLower.includes(area.toLowerCase())) {
      score += 20
    }
  }

  return Math.min(score, 100)
}

function calculateDiversityValue(student: StudentCandidate, institution: InstitutionProfile): number {
  let score = 50 // Score neutre
  
  // Diversité géographique
  if (student.nationality && institution.country) {
    if (student.nationality.toLowerCase() !== institution.country.toLowerCase()) {
      score += 25 // Bonus pour diversité internationale
    }
  }

  // Diversité linguistique
  if (student.languages_spoken && student.languages_spoken.length > 2) {
    score += 15 // Bonus pour multilinguisme
  }

  // Diversité de parcours (basée sur l'expérience)
  if (student.work_experience) {
    const expLower = student.work_experience.toLowerCase()
    const diverseKeywords = ['volunteer', 'bénévole', 'nonprofit', 'community', 'social']
    if (diverseKeywords.some(keyword => expLower.includes(keyword))) {
      score += 10
    }
  }

  return Math.min(score, 100)
}

function assessCareerPotential(student: StudentCandidate): number {
  let score = 50
  
  // Niveau d'étude avancé
  if (student.current_education_level === 'PhD' || student.current_education_level === 'Master') {
    score += 20
  }
  
  // GPA élevé
  if (student.gpa && student.gpa >= 3.7) {
    score += 15
  }
  
  // Expérience professionnelle
  if (student.work_experience) {
    score += 10
  }
  
  // Réalisations académiques
  if (student.academic_achievements) {
    score += 15
  }

  return Math.min(score, 100)
}

function assessResearchCapability(student: StudentCandidate): number {
  let score = 30
  
  const researchKeywords = [
    'research', 'recherche', 'publication', 'thesis', 'thèse',
    'conference', 'journal', 'study', 'analysis', 'investigation'
  ]
  
  if (student.academic_achievements) {
    const achievementsLower = student.academic_achievements.toLowerCase()
    for (const keyword of researchKeywords) {
      if (achievementsLower.includes(keyword)) {
        score += 15
      }
    }
  }
  
  if (student.work_experience) {
    const expLower = student.work_experience.toLowerCase()
    for (const keyword of researchKeywords) {
      if (expLower.includes(keyword)) {
        score += 10
      }
    }
  }

  return Math.min(score, 100)
}

function assessLeadershipPotential(student: StudentCandidate): number {
  let score = 30
  
  const leadershipKeywords = [
    'leader', 'president', 'captain', 'coordinator', 'organizer',
    'manager', 'director', 'founder', 'head', 'chief'
  ]
  
  const sources = [
    student.academic_achievements,
    student.work_experience,
    student.bio
  ].filter(Boolean)

  for (const source of sources) {
    const sourceLower = source!.toLowerCase()
    for (const keyword of leadershipKeywords) {
      if (sourceLower.includes(keyword)) {
        score += 12
      }
    }
  }

  return Math.min(score, 100)
}

function generateCandidateReasons(factors: CandidateFactors, student: StudentCandidate): string[] {
  const reasons: string[] = []

  if (factors.academicExcellence >= 90) {
    reasons.push(`Excellence académique exceptionnelle (GPA: ${student.gpa})`)
  } else if (factors.academicExcellence >= 80) {
    reasons.push('Très bon dossier académique')
  }

  if (factors.fieldAlignment >= 80) {
    reasons.push('Domaine d\'étude parfaitement aligné')
  } else if (factors.fieldAlignment >= 60) {
    reasons.push('Domaine d\'étude compatible')
  }

  if (factors.achievementQuality >= 80) {
    reasons.push('Réalisations académiques remarquables')
  }

  if (factors.researchCapability >= 80) {
    reasons.push('Forte capacité de recherche démontrée')
  }

  if (factors.leadershipPotential >= 80) {
    reasons.push('Potentiel de leadership évident')
  }

  if (factors.languageCompatibility >= 90) {
    reasons.push('Compétences linguistiques excellentes')
  }

  if (factors.geographicFit >= 90) {
    reasons.push('Destination d\'étude préférée')
  }

  if (factors.diversityValue >= 80) {
    reasons.push('Apporte une diversité précieuse')
  }

  if (factors.experienceRelevance >= 70) {
    reasons.push('Expérience professionnelle pertinente')
  }

  if (reasons.length === 0) {
    reasons.push('Profil correspondant aux critères généraux')
  }

  return reasons.slice(0, 6)
}

function generateFitAnalysis(factors: CandidateFactors, institution: InstitutionProfile): string {
  const strongPoints = []
  const improvementAreas = []

  if (factors.academicExcellence >= 85) strongPoints.push('excellence académique')
  if (factors.fieldAlignment >= 80) strongPoints.push('alignement du domaine')
  if (factors.achievementQuality >= 80) strongPoints.push('qualité des réalisations')
  if (factors.researchCapability >= 75) strongPoints.push('capacité de recherche')

  if (factors.languageCompatibility < 70) improvementAreas.push('compétences linguistiques')
  if (factors.experienceRelevance < 60) improvementAreas.push('expérience pertinente')

  let analysis = `Candidat avec ${strongPoints.join(', ')}.`
  
  if (improvementAreas.length > 0) {
    analysis += ` Pourrait bénéficier d'un développement en ${improvementAreas.join(', ')}.`
  }

  return analysis
}

function assessPotentialContribution(student: StudentCandidate, institution: InstitutionProfile): string {
  const contributions = []

  if (student.gpa && student.gpa >= 3.8) {
    contributions.push('Excellence académique qui rehaussera la réputation')
  }

  if (student.languages_spoken && student.languages_spoken.length > 2) {
    contributions.push('Diversité linguistique et culturelle')
  }

  if (student.academic_achievements) {
    contributions.push('Potentiel de recherche et publications')
  }

  if (student.work_experience) {
    contributions.push('Expérience pratique valorisante')
  }

  return contributions.length > 0 
    ? contributions.join('. ') + '.'
    : 'Contribution positive attendue au programme.'
}

function assessCandidateRisk(student: StudentCandidate): 'low' | 'medium' | 'high' {
  let riskScore = 0

  // Facteurs de risque
  if (!student.gpa || student.gpa < 3.0) riskScore += 30
  if (!student.academic_achievements) riskScore += 20
  if (!student.work_experience) riskScore += 15
  if (!student.languages_spoken || student.languages_spoken.length < 2) riskScore += 10

  if (riskScore <= 20) return 'low'
  if (riskScore <= 40) return 'medium'
  return 'high'
}