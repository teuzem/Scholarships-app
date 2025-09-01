import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  BookOpen,
  GraduationCap,
  Building2,
  Save,
  Edit3,
  Camera,
  Award,
  Languages,
  Target,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { 
    user, 
    profile, 
    studentProfile, 
    institutionProfile, 
    updateProfile, 
    updateStudentProfile, 
    updateInstitutionProfile,
    isStudent, 
    isInstitution,
    loading 
  } = useAuth()
  
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [generalForm, setGeneralForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    city: '',
    country: ''
  })
  
  const [studentForm, setStudentForm] = useState({
    field_of_study: '',
    current_education_level: '',
    current_institution: '',
    gpa: '',
    graduation_year: '',
    languages: [] as string[],
    preferred_study_countries: [] as string[],
    career_goals: '',
    academic_achievements: [] as string[],
    extracurricular_activities: [] as string[]
  })
  
  const [institutionForm, setInstitutionForm] = useState({
    institution_name: '',
    institution_type: '',
    country: '',
    city: '',
    website: '',
    description: '',
    focus_areas: [] as string[],
    accreditations: [] as string[],
    ranking: '',
    student_population: '',
    contact_email: '',
    contact_phone: ''
  })

  // Initialize forms with existing data
  useEffect(() => {
    if (profile) {
      setGeneralForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        website: profile.website || '',
        city: profile.city || '',
        country: profile.country || ''
      })
    }
    
    if (studentProfile) {
      setStudentForm({
        field_of_study: studentProfile.field_of_study || '',
        current_education_level: studentProfile.current_education_level || '',
        current_institution: studentProfile.current_institution || '',
        gpa: studentProfile.gpa?.toString() || '',
        graduation_year: studentProfile.graduation_year?.toString() || '',
        languages: studentProfile.languages || [],
        preferred_study_countries: studentProfile.preferred_study_countries || [],
        career_goals: studentProfile.career_goals || '',
        academic_achievements: studentProfile.academic_achievements || [],
        extracurricular_activities: studentProfile.extracurricular_activities || []
      })
    }
    
    if (institutionProfile) {
      setInstitutionForm({
        institution_name: institutionProfile.institution_name || '',
        institution_type: institutionProfile.institution_type || '',
        country: institutionProfile.country || '',
        city: institutionProfile.city || '',
        website: institutionProfile.website || '',
        description: institutionProfile.description || '',
        focus_areas: institutionProfile.focus_areas || [],
        accreditations: institutionProfile.accreditations || [],
        ranking: institutionProfile.ranking || '',
        student_population: institutionProfile.student_population?.toString() || '',
        contact_email: institutionProfile.contact_email || '',
        contact_phone: institutionProfile.contact_phone || ''
      })
    }
  }, [profile, studentProfile, institutionProfile])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Sauvegarder le profil général
      await updateProfile({
        full_name: generalForm.full_name,
        phone: generalForm.phone,
        bio: generalForm.bio,
        website: generalForm.website,
        city: generalForm.city,
        country: generalForm.country
      })
      
      // Sauvegarder le profil spécifique
      if (isStudent) {
        await updateStudentProfile({
          ...studentForm,
          gpa: studentForm.gpa ? parseFloat(studentForm.gpa) : null,
          graduation_year: studentForm.graduation_year ? parseInt(studentForm.graduation_year) : null
        })
      } else if (isInstitution) {
        await updateInstitutionProfile({
          ...institutionForm,
          student_population: institutionForm.student_population ? parseInt(institutionForm.student_population) : null
        })
      }
      
      setEditing(false)
      toast.success('Profil sauvegardé avec succès')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const addToArray = (arrayName: string, value: string, form: any, setForm: any) => {
    if (value.trim()) {
      const currentArray = form[arrayName] || []
      setForm({
        ...form,
        [arrayName]: [...currentArray, value.trim()]
      })
    }
  }

  const removeFromArray = (arrayName: string, index: number, form: any, setForm: any) => {
    const currentArray = form[arrayName] || []
    setForm({
      ...form,
      [arrayName]: currentArray.filter((_: any, i: number) => i !== index)
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              {isStudent ? (
                <GraduationCap className="w-8 h-8 text-white" />
              ) : (
                <Building2 className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.full_name || 'Mon Profil'}
              </h1>
              <p className="text-lg text-gray-600">
                {isStudent ? 'Profil Étudiant' : 'Profil Institution'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  loading={saving}
                  icon={Save}
                >
                  Sauvegarder
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                icon={Edit3}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil général */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations générales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={generalForm.full_name}
                    onChange={(e) => setGeneralForm({...generalForm, full_name: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{generalForm.full_name || 'Non renseigné'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{generalForm.email}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={generalForm.phone}
                    onChange={(e) => setGeneralForm({...generalForm, phone: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{generalForm.phone || 'Non renseigné'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site web
                </label>
                {editing ? (
                  <input
                    type="url"
                    value={generalForm.website}
                    onChange={(e) => setGeneralForm({...generalForm, website: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{generalForm.website || 'Non renseigné'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={generalForm.city}
                    onChange={(e) => setGeneralForm({...generalForm, city: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{generalForm.city || 'Non renseigné'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={generalForm.country}
                    onChange={(e) => setGeneralForm({...generalForm, country: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{generalForm.country || 'Non renseigné'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biographie
              </label>
              {editing ? (
                <textarea
                  value={generalForm.bio}
                  onChange={(e) => setGeneralForm({...generalForm, bio: e.target.value})}
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Décrivez-vous en quelques mots..."
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{generalForm.bio || 'Aucune biographie renseignée'}</p>
              )}
            </div>
          </Card>

          {/* Profil spécifique étudiant */}
          {isStudent && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Profil académique
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domaine d'étude
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={studentForm.field_of_study}
                      onChange={(e) => setStudentForm({...studentForm, field_of_study: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{studentForm.field_of_study || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau d'étude
                  </label>
                  {editing ? (
                    <select
                      value={studentForm.current_education_level}
                      onChange={(e) => setStudentForm({...studentForm, current_education_level: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="High School">Lycée</option>
                      <option value="Bachelor">Licence</option>
                      <option value="Master">Master</option>
                      <option value="PhD">Doctorat</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{studentForm.current_education_level || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution actuelle
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={studentForm.current_institution}
                      onChange={(e) => setStudentForm({...studentForm, current_institution: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{studentForm.current_institution || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={studentForm.gpa}
                      onChange={(e) => setStudentForm({...studentForm, gpa: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{studentForm.gpa || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objectifs de carrière
                </label>
                {editing ? (
                  <textarea
                    value={studentForm.career_goals}
                    onChange={(e) => setStudentForm({...studentForm, career_goals: e.target.value})}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez vos objectifs professionnels..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{studentForm.career_goals || 'Non renseigné'}</p>
                )}
              </div>
            </Card>
          )}

          {/* Profil spécifique institution */}
          {isInstitution && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Profil institutionnel
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'institution
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={institutionForm.institution_name}
                      onChange={(e) => setInstitutionForm({...institutionForm, institution_name: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{institutionForm.institution_name || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'institution
                  </label>
                  {editing ? (
                    <select
                      value={institutionForm.institution_type}
                      onChange={(e) => setInstitutionForm({...institutionForm, institution_type: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="University">Université</option>
                      <option value="College">Collège</option>
                      <option value="Institute">Institut</option>
                      <option value="School">École</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{institutionForm.institution_type || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de contact
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={institutionForm.contact_email}
                      onChange={(e) => setInstitutionForm({...institutionForm, contact_email: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{institutionForm.contact_email || 'Non renseigné'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone de contact
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={institutionForm.contact_phone}
                      onChange={(e) => setInstitutionForm({...institutionForm, contact_phone: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{institutionForm.contact_phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {editing ? (
                  <textarea
                    value={institutionForm.description}
                    onChange={(e) => setInstitutionForm({...institutionForm, description: e.target.value})}
                    rows={4}
                    className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez votre institution..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{institutionForm.description || 'Non renseigné'}</p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du profil</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email vérifié</span>
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Vérifié
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type de compte</span>
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {isStudent ? 'Étudiant' : 'Institution'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Membre depuis</span>
                <span className="text-xs text-gray-500">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                icon={isStudent ? Award : Building2}
              >
                {isStudent ? 'Mes candidatures' : 'Mes bourses'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                icon={Star}
              >
                Mes favoris
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                icon={Target}
              >
                Recommandations IA
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
