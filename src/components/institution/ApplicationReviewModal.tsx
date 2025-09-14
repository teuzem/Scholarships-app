import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  GraduationCap,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Globe,
  Calendar,
  BookOpen,
  Target,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Tables } from '@/types/supabase'

interface ApplicationReviewModalProps {
  applicationId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (applicationId: string, status: string, notes?: string) => void
}

interface ApplicationDetails {
  id: string
  status: string | null
  notes?: string | null
  application_data?: any | null
  submitted_at: string | null
  created_at: string
  student: {
    full_name: string | null
    email: string | null
    phone?: string | null
    bio?: string | null
  } | null
  scholarship: {
    title: string | null
    amount: number | null
    currency: string | null
    study_level: string | null
    study_fields: string[] | null
  } | null
  studentProfile: {
    field_of_study?: string
    current_education_level?: string
    gpa?: number
    nationality?: string
    languages_spoken?: string[]
    academic_achievements?: string
    work_experience?: string
  } | null
}

export default function ApplicationReviewModal({ 
  applicationId, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: ApplicationReviewModalProps) {
  const [application, setApplication] = useState<ApplicationDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    if (applicationId && isOpen) {
      loadApplicationDetails()
    }
  }, [applicationId, isOpen])

  const loadApplicationDetails = async () => {
    if (!applicationId) return

    try {
      setLoading(true)
      
      // Load application with relations
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          scholarships(title, amount, currency, study_level, study_fields),
          profiles(full_name, email, phone, bio)
        `)
        .eq('id', applicationId)
        .single()

      if (appError) throw appError
      if (!appData) throw new Error('Application not found')

      // Load detailed student profile
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('profile_id', appData.student_id)
        .maybeSingle()

      // Transform the data to match our interface
      const transformedApplication: ApplicationDetails = {
        id: appData.id,
        status: appData.status,
        notes: appData.notes,
        application_data: appData.application_data,
        submitted_at: appData.submitted_at,
        created_at: appData.created_at,
        student: appData.profiles ? {
          full_name: (appData.profiles as any)?.full_name || null,
          email: (appData.profiles as any)?.email || null,
          phone: (appData.profiles as any)?.phone || null,
          bio: (appData.profiles as any)?.bio || null
        } : null,
        scholarship: appData.scholarships ? {
          title: (appData.scholarships as any)?.title || null,
          amount: (appData.scholarships as any)?.amount || null,
          currency: (appData.scholarships as any)?.currency || null,
          study_level: (appData.scholarships as any)?.study_level || null,
          study_fields: (appData.scholarships as any)?.study_fields || null
        } : null,
        studentProfile: studentProfile || null
      }

      setApplication(transformedApplication)
      setReviewNotes(appData.notes || '')
      setSelectedStatus(appData.status || 'pending')
    } catch (error) {
      console.error('Error loading application details:', error)
      toast.error('Erreur lors du chargement des détails')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!application || !selectedStatus) return

    try {
      await onStatusUpdate(application.id, selectedStatus, reviewNotes)
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const calculateMatchScore = (): number => {
    if (!application) return 0

    let score = 0
    let factors = 0

    // Field match
    if (application.studentProfile?.field_of_study && application.scholarship?.study_fields) {
      const studentField = application.studentProfile.field_of_study.toLowerCase()
      const hasMatch = application.scholarship.study_fields.some(field => 
        field.toLowerCase().includes(studentField) || studentField.includes(field.toLowerCase())
      )
      if (hasMatch) score += 25
      factors++
    }

    // Level match
    if (application.studentProfile?.current_education_level && application.scholarship?.study_level) {
      const levelMapping: Record<string, string[]> = {
        'High School': ['Bachelor'],
        'Bachelor': ['Master'],
        'Master': ['PhD'],
        'PhD': ['Postdoc']
      }
      
      const compatibleLevels = levelMapping[application.studentProfile.current_education_level] || []
      if (compatibleLevels.includes(application.scholarship.study_level) || 
          application.scholarship.study_level === 'All') {
        score += 25
      }
      factors++
    }

    // GPA excellence
    if (application.studentProfile?.gpa) {
      if (application.studentProfile.gpa >= 3.8) score += 25
      else if (application.studentProfile.gpa >= 3.5) score += 20
      else if (application.studentProfile.gpa >= 3.2) score += 15
      else if (application.studentProfile.gpa >= 3.0) score += 10
      factors++
    }

    // Academic achievements
    if (application.studentProfile?.academic_achievements) {
      const achievements = application.studentProfile.academic_achievements.toLowerCase()
      const highValueKeywords = ['award', 'publication', 'research', 'honor', 'distinction']
      const matchingKeywords = highValueKeywords.filter(keyword => achievements.includes(keyword))
      score += Math.min(matchingKeywords.length * 5, 25)
      factors++
    }

    return factors > 0 ? Math.round(score / factors * 4) : 0
  }

  if (!isOpen || !applicationId) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement des détails...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (!application || !application.student || !application.scholarship) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-8 text-center">
          <p className="text-red-600">Erreur lors du chargement de la candidature</p>
          <Button onClick={onClose} className="mt-4">Fermer</Button>
        </Card>
      </div>
    )
  }

  const matchScore = calculateMatchScore()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Examen de candidature</h2>
              <p className="text-gray-600">Évaluation détaillée du profil candidat</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Candidate information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Candidate profile */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Profil du candidat
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {application.student?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {application.student?.full_name || 'Nom non disponible'}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {application.student?.email || 'Email non disponible'}
                        </span>
                        {application.student?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {application.student.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {application.student?.bio && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Biographie</h5>
                      <p className="text-gray-600 text-sm leading-relaxed">{application.student.bio}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Academic information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Profil académique
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Domaine d'étude</label>
                    <p className="text-gray-900">{application.studentProfile?.field_of_study || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Niveau actuel</label>
                    <p className="text-gray-900">{application.studentProfile?.current_education_level || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">GPA</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {application.studentProfile?.gpa || 'Non spécifié'}
                      {application.studentProfile?.gpa && application.studentProfile.gpa >= 3.5 && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationalité</label>
                    <p className="text-gray-900">{application.studentProfile?.nationality || 'Non spécifiée'}</p>
                  </div>
                </div>

                {application.studentProfile?.languages_spoken && Array.isArray(application.studentProfile.languages_spoken) && application.studentProfile.languages_spoken.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Langues parlées</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {application.studentProfile.languages_spoken.map((language, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {application.studentProfile?.academic_achievements && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Réalisations académiques</label>
                    <p className="text-gray-900 text-sm mt-1 leading-relaxed">
                      {application.studentProfile.academic_achievements}
                    </p>
                  </div>
                )}

                {application.studentProfile?.work_experience && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Expérience professionnelle</label>
                    <p className="text-gray-900 text-sm mt-1 leading-relaxed">
                      {application.studentProfile.work_experience}
                    </p>
                  </div>
                )}
              </Card>

              {/* Scholarship information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Bourse demandée
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{application.scholarship?.title || 'Titre non disponible'}</h4>
                    <p className="text-green-600 font-medium">
                      {application.scholarship?.amount?.toLocaleString() || 'Montant non spécifié'} {application.scholarship?.currency || ''}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Niveau requis</label>
                      <p className="text-gray-900">{application.scholarship?.study_level || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Domaines</label>
                      <p className="text-gray-900">{application.scholarship?.study_fields?.join(', ') || 'Non spécifiés'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Decision panel */}
            <div className="space-y-6">
              {/* Match score */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score de correspondance</h3>
                
                <div className="text-center mb-4">
                  <div className={`text-4xl font-bold ${
                    matchScore >= 80 ? 'text-green-600' :
                    matchScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {matchScore}%
                  </div>
                  <p className="text-sm text-gray-500">Compatibilité calculée</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Domaine d'étude</span>
                    <span className={`font-medium ${
                      application.studentProfile?.field_of_study && 
                      application.scholarship?.study_fields && Array.isArray(application.scholarship.study_fields) &&
                      application.scholarship.study_fields.some(field => 
                        field.toLowerCase().includes(application.studentProfile!.field_of_study!.toLowerCase())
                      ) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {application.studentProfile?.field_of_study && 
                       application.scholarship?.study_fields && Array.isArray(application.scholarship.study_fields) &&
                       application.scholarship.study_fields.some(field => 
                         field.toLowerCase().includes(application.studentProfile!.field_of_study!.toLowerCase())
                       ) ? '✓ Compatible' : '✗ Incompatible'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Niveau académique</span>
                    <span className="font-medium text-green-600">✓ Compatible</span>
                  </div>
                  
                  {application.studentProfile?.gpa && (
                    <div className="flex justify-between text-sm">
                      <span>Excellence académique</span>
                      <span className={`font-medium ${
                        application.studentProfile.gpa >= 3.5 ? 'text-green-600' : 
                        application.studentProfile.gpa >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {application.studentProfile.gpa >= 3.5 ? '✓ Excellent' :
                         application.studentProfile.gpa >= 3.0 ? '~ Bon' : '✗ Insuffisant'}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Review actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Décision</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut de la candidature
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'accepted', label: 'Accepter', color: 'green', icon: CheckCircle },
                        { value: 'rejected', label: 'Refuser', color: 'red', icon: XCircle },
                        { value: 'under_review', label: 'En examen', color: 'yellow', icon: Clock }
                      ].map(({ value, label, color, icon: Icon }) => (
                        <label key={value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value={value}
                            checked={selectedStatus === value}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <Icon className={`w-4 h-4 text-${color}-600`} />
                          <span className="text-gray-900">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes de révision
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Commentaires sur la candidature, justification de la décision..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatus || selectedStatus === application.status}
                      className="flex-1"
                    >
                      Mettre à jour
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(`mailto:${application.student?.email}?subject=Candidature ${application.scholarship?.title}`, '_blank')
                      }}
                      icon={MessageSquare}
                    >
                      Contacter
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Application details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la candidature</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date de soumission</span>
                    <span className="text-gray-900">
                      {new Date(application.submitted_at || application.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut actuel</span>
                    <span className={`font-medium ${
                      application.status === 'accepted' ? 'text-green-600' :
                      application.status === 'rejected' ? 'text-red-600' :
                      application.status === 'under_review' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {application.status === 'accepted' ? 'Acceptée' :
                       application.status === 'rejected' ? 'Refusée' :
                       application.status === 'under_review' ? 'En examen' :
                       'En attente'}
                    </span>
                  </div>

                  {application.application_data && (
                    <div>
                      <label className="text-gray-500">Données de candidature</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded text-xs">
                        <pre>{JSON.stringify(application.application_data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}