import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import CountryFlag from '@/components/ui/CountryFlag'
import { useScholarship, useUserFavorites, useAddToFavorites, useRemoveFromFavorites } from '@/hooks/useDatabase'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Users,
  BookOpen,
  Award,
  DollarSign,
  Clock,
  GraduationCap,
  FileText,
  CheckCircle,
  XCircle,
  Target,
  AlertCircle,
  ExternalLink,
  Download,
  User,
  Heart,
  Star
} from 'lucide-react'

interface Institution {
  id: string;
  name: string;
  type?: string;
  country?: string;
  country_code?: string;
  city: string;
  website?: string;
  logo_url?: string;
}

interface AcademicProgram {
  id: string;
  name: string;
  degree_type: string;
  field_of_study: string;
  duration_years: number;
  language: string;
}

interface ScholarshipEligibility {
  id: string;
  criteria_type: string;
  criteria_value: string;
  min_value?: number;
  max_value?: number;
  unit?: string;
  is_required: boolean;
}

export default function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: scholarship, isLoading } = useScholarship(id!)
  const { data: userFavorites } = useUserFavorites(user?.id)
  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()
  
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [academicProgram, setAcademicProgram] = useState<AcademicProgram | null>(null)
  const [eligibilityCriteria, setEligibilityCriteria] = useState<ScholarshipEligibility[]>([])
  const [relatedScholarships, setRelatedScholarships] = useState<any[]>([])

  const isFavorite = userFavorites?.some(f => f.scholarship_id === id) || false

  const handleToggleFavorite = () => {
    if (!user || !id) return
    
    if (isFavorite) {
      removeFromFavorites.mutate({ userId: user.id, scholarshipId: id })
    } else {
      addToFavorites.mutate({ userId: user.id, scholarshipId: id })
    }
  }
  
  // Charger les données supplémentaires
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!scholarship) return;
      
      try {
        // Charger l'institution
        if (scholarship.institution_id) {
          const { data: institutionData } = await supabase
            .from('institutions')
            .select('id, name, city, website, logo_url')
            .eq('id', scholarship.institution_id)
            .single();
          
          if (institutionData) {
            setInstitution({
              id: institutionData.id,
              name: institutionData.name,
              city: institutionData.city,
              website: institutionData.website,
              logo_url: institutionData.logo_url
            });
          }
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données supplémentaires:', error);
      }
    };

    fetchAdditionalData();
  }, [scholarship, id]);

  // Calculer le statut de la bourse
  const getScholarshipStatus = () => {
    if (!scholarship.is_active) {
      return { status: 'inactive', label: 'Inactive', color: 'red' };
    }
    
    if (scholarship.application_deadline) {
      const deadline = new Date(scholarship.application_deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) {
        return { status: 'expired', label: 'Expirée', color: 'red', daysUntilDeadline };
      } else if (daysUntilDeadline <= 7) {
        return { status: 'urgent', label: 'Urgent', color: 'amber', daysUntilDeadline };
      } else if (daysUntilDeadline <= 30) {
        return { status: 'soon', label: 'Bientôt', color: 'orange', daysUntilDeadline };
      }
    }
    
    return { status: 'active', label: 'Active', color: 'green' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!scholarship) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-6">Bourse introuvable</p>
          <Link to="/scholarships">
            <Button variant="primary" icon={ArrowLeft}>
              Retour aux bourses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const scholarshipStatus = getScholarshipStatus();
  const isExpired = scholarshipStatus.status === 'expired';
  const isExpiringSoon = scholarshipStatus.status === 'urgent' || scholarshipStatus.status === 'soon';
  const daysUntilDeadline = scholarshipStatus.daysUntilDeadline || 0;

  // Calculer les statistiques
  const stats = {
    amount: scholarship.amount || 0,
    currency: scholarship.currency || 'USD',
    duration: scholarship.duration_months || 0,
    coverage: 0, // Pas de coverage_percentage dans le schema
    views: scholarship.view_count || 0,
    applications: scholarship.application_count || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600">Accueil</Link>
              <span>/</span>
              <Link to="/scholarships" className="hover:text-blue-600">Bourses</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium truncate max-w-xs">{scholarship.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête de la bourse */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {/* Note: CountryFlag sera désactivé temporairement car pas de country_code disponible */}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">{scholarship.title}</h1>
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                      scholarshipStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                      scholarshipStatus.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                      scholarshipStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      scholarshipStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scholarshipStatus.label}
                    </span>
                  </div>
                  
                  {institution && (
                    <Link 
                      to={`/institution/${institution.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-2"
                    >
                      <span>{institution.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                    {institution && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{institution.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>{scholarship.scholarship_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{scholarship.scholarship_type || 'Type non spécifié'}</span>
                    </div>
                    {scholarship.application_deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Échéance: {new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {scholarship.contact_email && (
                      <a href={`mailto:${scholarship.contact_email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <Mail className="h-4 w-4" />
                        <span>Contact</span>
                      </a>
                    )}
                    {scholarship.contact_phone && (
                      <a href={`tel:${scholarship.contact_phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <Phone className="h-4 w-4" />
                        <span>Téléphone</span>
                      </a>
                    )}
                    {scholarship.application_url && (
                      <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <Globe className="h-4 w-4" />
                        <span>Site web</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 lg:text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.amount > 0 ? `${stats.amount.toLocaleString()} ${stats.currency}` : 'Montant variable'}
                  </div>
                  {scholarship.renewable && (
                    <div className="flex items-center justify-end gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Renouvelable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Montant"
            value={stats.amount > 0 ? `${stats.amount.toLocaleString()} ${stats.currency}` : 'Variable'}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Durée"
            value={stats.duration > 0 ? `${stats.duration} mois` : 'N/A'}
            icon={Clock}
            color="green"
          />
          <StatCard
            title="Vues"
            value={stats.views.toString()}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Candidatures"
            value={stats.applications.toString()}
            icon={FileText}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {scholarship.description && (
              <Card>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Description
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{scholarship.description}</p>
                </div>
              </Card>
            )}

            {/* Critères d'éligibilité originaux si pas de table séparée */}
            {eligibilityCriteria.length === 0 && scholarship.eligibility_criteria && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                  Critères d'éligibilité
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {scholarship.eligibility_criteria.split('\n').map((criterion, index) => (
                    <p key={index} className="mb-3 flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {criterion}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {/* Exigences de candidature originales */}
            {scholarship.application_requirements && scholarship.application_requirements.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Documents requis
                </h2>
                <ul className="space-y-3">
                  {scholarship.application_requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Processus de candidature */}
            {scholarship.application_process && scholarship.application_process.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Processus de candidature
                </h2>
                <ol className="space-y-4">
                  {scholarship.application_process.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Actions principales */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                {user && (
                  <Button
                    variant={isFavorite ? 'secondary' : 'outline'}
                    icon={Heart}
                    onClick={handleToggleFavorite}
                    fullWidth
                    className={`${isFavorite ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'}`}
                  >
                    {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>
                )}
                
                {scholarship.application_url && (
                  <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button
                      variant="primary"
                      icon={ExternalLink}
                      fullWidth
                      disabled={isExpired}
                    >
                      {isExpired ? 'Candidatures fermées' : 'Postuler maintenant'}
                    </Button>
                  </a>
                )}
              </div>
            </Card>

            {/* Informations importantes */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Informations clés</h3>
              <div className="space-y-3">
                {scholarship.application_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date limite:</span>
                    <span className="font-semibold text-red-600">
                      {new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {scholarship.duration_months && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-semibold">{scholarship.duration_months} mois</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`font-semibold ${
                    scholarshipStatus.color === 'green' ? 'text-green-600' :
                    scholarshipStatus.color === 'amber' ? 'text-amber-600' :
                    scholarshipStatus.color === 'orange' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {scholarshipStatus.label}
                  </span>
                </div>
              </div>
            </Card>

            {/* Contact */}
            {(scholarship.contact_email || scholarship.contact_phone) && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact
                </h3>
                <div className="space-y-3">
                  {scholarship.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${scholarship.contact_email}`} className="text-blue-600 hover:text-blue-800">
                        {scholarship.contact_email}
                      </a>
                    </div>
                  )}
                  {scholarship.contact_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${scholarship.contact_phone}`} className="text-blue-600 hover:text-blue-800">
                        {scholarship.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Alerte deadline */}
            {isExpiringSoon && (
              <Card className="border-orange-200 bg-orange-50">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800">Attention!</h3>
                    <p className="text-orange-700">
                      Cette bourse expire dans {daysUntilDeadline} jour{daysUntilDeadline > 1 ? 's' : ''}. 
                      Dépêchez-vous de postuler!
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}