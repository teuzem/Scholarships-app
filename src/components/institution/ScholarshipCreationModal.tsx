import React, { useState } from 'react'
import { useCreateScholarship } from '@/hooks/useInstitutionWorkflows'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  X, 
  Plus, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Globe,
  Users,
  FileText,
  Award,
  Clock,
  Target,
  Languages,
  GraduationCap
} from 'lucide-react'

interface ScholarshipCreationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScholarshipCreationModal({ isOpen, onClose }: ScholarshipCreationModalProps) {
  const createScholarship = useCreateScholarship()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Informations de base
    title: '',
    description: '',
    detailed_description: '',
    scholarship_type: 'merit',
    
    // Financement
    amount: '',
    currency: 'EUR',
    number_of_awards: '1',
    renewable: false,
    renewal_criteria: '',
    
    // Critères académiques
    study_level: '',
    study_fields: [] as string[],
    min_gpa: '',
    eligibility_criteria: '',
    
    // Critères géographiques
    target_countries: [] as string[],
    target_nationalities: [] as string[],
    target_regions: [] as string[],
    
    // Critères d'âge et langue
    min_age: '',
    max_age: '',
    required_languages: [] as string[],
    language_requirements: '',
    
    // Dates et processus
    application_deadline: '',
    start_date: '',
    end_date: '',
    duration_months: '',
    
    // Processus de candidature
    application_requirements: [] as string[],
    application_process: [] as string[],
    application_url: '',
    application_fee: '',
    application_fee_currency: 'EUR',
    
    // Avantages et obligations
    benefits: [] as string[],
    coverage_details: [] as string[],
    obligations: [] as string[],
    restrictions: [] as string[],
    
    // Contact et informations
    contact_email: '',
    contact_phone: '',
    source_url: '',
    
    // Métadonnées
    tags: [] as string[],
    selection_criteria: [] as string[],
    is_featured: false,
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Titre requis'
        if (!formData.description.trim()) newErrors.description = 'Description requise'
        if (!formData.scholarship_type) newErrors.scholarship_type = 'Type de bourse requis'
        break
      case 2:
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Montant valide requis'
        if (!formData.application_deadline) newErrors.application_deadline = 'Date limite requise'
        break
      case 3:
        if (!formData.study_level) newErrors.study_level = 'Niveau d\'étude requis'
        if (formData.study_fields.length === 0) newErrors.study_fields = 'Au moins un domaine d\'étude requis'
        if (!formData.eligibility_criteria.trim()) newErrors.eligibility_criteria = 'Critères d\'éligibilité requis'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    try {
      const scholarshipData = {
        ...formData,
        amount: parseFloat(formData.amount),
        number_of_awards: parseInt(formData.number_of_awards),
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
        application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null
      }

      await createScholarship.mutateAsync(scholarshipData)
      onClose()
      setStep(1)
      setFormData({
        title: '',
        description: '',
        detailed_description: '',
        scholarship_type: 'merit',
        amount: '',
        currency: 'EUR',
        number_of_awards: '1',
        renewable: false,
        renewal_criteria: '',
        study_level: '',
        study_fields: [],
        min_gpa: '',
        eligibility_criteria: '',
        target_countries: [],
        target_nationalities: [],
        target_regions: [],
        min_age: '',
        max_age: '',
        required_languages: [],
        language_requirements: '',
        application_deadline: '',
        start_date: '',
        end_date: '',
        duration_months: '',
        application_requirements: [],
        application_process: [],
        application_url: '',
        application_fee: '',
        application_fee_currency: 'EUR',
        benefits: [],
        coverage_details: [],
        obligations: [],
        restrictions: [],
        contact_email: '',
        contact_phone: '',
        source_url: '',
        tags: [],
        selection_criteria: [],
        is_featured: false,
        is_active: true
      })
    } catch (error) {
      console.error('Error creating scholarship:', error)
    }
  }

  const addToArray = (field: string, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()]
      }))
    }
  }

  const removeFromArray = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre de la bourse *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Bourse d'excellence en informatique"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description courte *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Description concise de la bourse (max 500 caractères)"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description détaillée
            </label>
            <textarea
              value={formData.detailed_description}
              onChange={(e) => setFormData(prev => ({ ...prev, detailed_description: e.target.value }))}
              rows={5}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Description complète avec tous les détails importants"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de bourse *
            </label>
            <select
              value={formData.scholarship_type}
              onChange={(e) => setFormData(prev => ({ ...prev, scholarship_type: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.scholarship_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="merit">Bourse au mérite</option>
              <option value="need">Bourse sur critères sociaux</option>
              <option value="research">Bourse de recherche</option>
              <option value="sports">Bourse sportive</option>
              <option value="arts">Bourse artistique</option>
              <option value="diversity">Bourse de diversité</option>
              <option value="international">Bourse internationale</option>
              <option value="government">Bourse gouvernementale</option>
              <option value="corporate">Bourse d'entreprise</option>
            </select>
            {errors.scholarship_type && <p className="text-red-500 text-xs mt-1">{errors.scholarship_type}</p>}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financement et dates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10000"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Devise
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar US (USD)</option>
              <option value="GBP">Livre Sterling (GBP)</option>
              <option value="CAD">Dollar Canadien (CAD)</option>
              <option value="AUD">Dollar Australien (AUD)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date limite de candidature *
            </label>
            <input
              type="date"
              value={formData.application_deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.application_deadline ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.application_deadline && <p className="text-red-500 text-xs mt-1">{errors.application_deadline}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de bourses disponibles
            </label>
            <input
              type="number"
              value={formData.number_of_awards}
              onChange={(e) => setFormData(prev => ({ ...prev, number_of_awards: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début des études
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée (en mois)
            </label>
            <input
              type="number"
              value={formData.duration_months}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_months: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="12"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.renewable}
              onChange={(e) => setFormData(prev => ({ ...prev, renewable: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Bourse renouvelable</span>
          </label>
          
          {formData.renewable && (
            <div className="mt-2">
              <textarea
                value={formData.renewal_criteria}
                onChange={(e) => setFormData(prev => ({ ...prev, renewal_criteria: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Critères de renouvellement..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Critères académiques</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau d'étude *
            </label>
            <select
              value={formData.study_level}
              onChange={(e) => setFormData(prev => ({ ...prev, study_level: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.study_level ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un niveau</option>
              <option value="Bachelor">Licence</option>
              <option value="Master">Master</option>
              <option value="PhD">Doctorat</option>
              <option value="Postdoc">Post-doctorat</option>
              <option value="All">Tous niveaux</option>
            </select>
            {errors.study_level && <p className="text-red-500 text-xs mt-1">{errors.study_level}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domaines d'étude * (séparez par des virgules)
            </label>
            <input
              type="text"
              placeholder="Informatique, Ingénierie, Sciences"
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  const value = e.currentTarget.value.replace(',', '').trim()
                  if (value) {
                    addToArray('study_fields', value)
                    e.currentTarget.value = ''
                  }
                }
              }}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.study_fields ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.study_fields.map((field, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {field}
                  <button
                    onClick={() => removeFromArray('study_fields', index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.study_fields && <p className="text-red-500 text-xs mt-1">{errors.study_fields}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPA minimum
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={formData.min_gpa}
                onChange={(e) => setFormData(prev => ({ ...prev, min_gpa: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="3.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Âge minimum - maximum
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.min_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="18"
                />
                <input
                  type="number"
                  value={formData.max_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_age: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="35"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Critères d'éligibilité *
            </label>
            <textarea
              value={formData.eligibility_criteria}
              onChange={(e) => setFormData(prev => ({ ...prev, eligibility_criteria: e.target.value }))}
              rows={4}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.eligibility_criteria ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Décrivez les critères d'éligibilité détaillés..."
            />
            {errors.eligibility_criteria && <p className="text-red-500 text-xs mt-1">{errors.eligibility_criteria}</p>}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Finalisation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contact
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="contact@institution.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de candidature
            </label>
            <input
              type="url"
              value={formData.application_url}
              onChange={(e) => setFormData(prev => ({ ...prev, application_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Bourse recommandée</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Publier immédiatement</span>
            </label>
          </div>

          {/* Résumé de la bourse */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Résumé de la bourse</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Titre:</strong> {formData.title}</div>
              <div><strong>Montant:</strong> {formData.amount}€</div>
              <div><strong>Type:</strong> {formData.scholarship_type}</div>
              <div><strong>Niveau:</strong> {formData.study_level}</div>
              <div><strong>Domaines:</strong> {formData.study_fields.join(', ')}</div>
              <div><strong>Date limite:</strong> {formData.application_deadline}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Créer une nouvelle bourse</h2>
              <p className="text-gray-600">Étape {step} sur 4</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      stepNumber < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Informations</span>
              <span>Financement</span>
              <span>Critères</span>
              <span>Finalisation</span>
            </div>
          </div>

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            >
              {step > 1 ? 'Précédent' : 'Annuler'}
            </Button>
            
            {step < 4 ? (
              <Button onClick={handleNext}>
                Suivant
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                loading={createScholarship.isPending}
                icon={Award}
              >
                Créer la bourse
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}