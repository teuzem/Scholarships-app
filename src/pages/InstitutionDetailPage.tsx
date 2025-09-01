import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, StatCard } from '@/components/ui/Card'
import CountryFlag from '@/components/ui/CountryFlag'
import MapComponent from '@/components/ui/MapComponent'
import DataTable from '@/components/ui/DataTable'
import Chart from '@/components/ui/Charts'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import { useInstitution, useScholarships, useCountries, useAcademicPrograms } from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { 
  University, Users, Star, MapPin, Calendar, 
  School, ArrowLeft, ExternalLink, BarChart3, 
  Award, DollarSign, Globe, Building
} from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Institution = Tables<'institutions'>
type Scholarship = Tables<'scholarships'>

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: institution, isLoading } = useInstitution(id!)
  const { data: allScholarships } = useScholarships()
  const { data: countries } = useCountries()
  const { data: programs } = useAcademicPrograms()
  
  // Synchronisation temps réel
  const { isConnected } = useRealtimeSubscription({
    table: 'institutions',
    filter: `id=eq.${id}`,
    onChange: () => {
      setLastUpdate(new Date())
    }
  })

  // Bourses de cette institution
  const institutionScholarships = useMemo(() => {
    if (!allScholarships || !institution) return []
    return allScholarships.filter(scholarship => scholarship.institution_id === institution.id)
  }, [allScholarships, institution])

  // Pays de l'institution
  const country = useMemo(() => {
    if (!countries || !institution) return null
    return countries.find(c => c.id === institution.country_id)
  }, [countries, institution])

  // Données pour la carte
  const mapLocation = useMemo(() => {
    if (!institution || !country) return []
    
    const coordinates: Record<string, [number, number]> = {
      'Paris': [48.8566, 2.3522],
      'London': [51.5074, -0.1278],
      'Berlin': [52.5200, 13.4050],
      'Madrid': [40.4168, -3.7038],
      'Rome': [41.9028, 12.4964],
      'New York': [40.7128, -74.0060],
      'Boston': [42.3601, -71.0589],
      'Toronto': [43.6532, -79.3832],
      'Tokyo': [35.6762, 139.6503],
      'Sydney': [-33.8688, 151.2093]
    }

    const coords = coordinates[institution.city || country.name]
    if (!coords) return []

    const [lat, lng] = coords
    return [{
      id: institution.id,
      name: institution.name,
      lat,
      lng,
      info: `${institution.name} - ${institution.city || country.name}`,
      type: 'institution' as const
    }]
  }, [institution, country])

  // Colonnes pour le tableau des bourses
  const scholarshipColumns = [
    {
      key: 'title' as keyof Scholarship,
      label: 'Bourse',
      sortable: true,
      render: (value: string, row: Scholarship) => (
        <div className="flex items-center space-x-3">
          <Award className="h-5 w-5 text-green-500" />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {row.scholarship_type && (
              <div className="text-sm text-gray-500">Type: {row.scholarship_type}</div>
            )}
          </div>
          <Link 
            to={`/scholarship/${row.id}`}
            className="ml-auto p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Voir les détails"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )
    },
    {
      key: 'amount' as keyof Scholarship,
      label: 'Montant (USD)',
      sortable: true,
      render: (value: number | null) => {
        if (!value) return '-'
        return (
          <div className="text-right">
            <div className="font-medium text-green-600">${value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">par an</div>
          </div>
        )
      }
    },
    {
      key: 'study_level' as keyof Scholarship,
      label: 'Niveau d\'\'étude',
      render: (value: string | null) => {
        if (!value) return '-'
        const colorMap: Record<string, string> = {
          'Bachelor': 'bg-green-100 text-green-800',
          'Master': 'bg-blue-100 text-blue-800',
          'PhD': 'bg-purple-100 text-purple-800',
          'All': 'bg-gray-100 text-gray-800'
        }
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'application_deadline' as keyof Scholarship,
      label: 'Date limite',
      sortable: true,
      render: (value: string | null) => {
        if (!value) return '-'
        const date = new Date(value)
        const isExpired = date < new Date()
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
            {date.toLocaleDateString('fr-FR')}
            {isExpired && <div className="text-xs text-red-500">Expirée</div>}
          </div>
        )
      }
    },
    {
      key: 'is_active' as keyof Scholarship,
      label: 'Statut',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  // Statistiques des bourses
  const scholarshipStats = useMemo(() => {
    if (!institutionScholarships.length) return {
      total: 0,
      active: 0,
      totalAmount: 0,
      avgAmount: 0
    }

    const activeScholarships = institutionScholarships.filter(s => s.is_active)
    const withAmount = institutionScholarships.filter(s => s.amount)

    return {
      total: institutionScholarships.length,
      active: activeScholarships.length,
      totalAmount: withAmount.reduce((sum, s) => sum + (s.amount || 0), 0),
      avgAmount: withAmount.length > 0 
        ? withAmount.reduce((sum, s) => sum + (s.amount || 0), 0) / withAmount.length 
        : 0
    }
  }, [institutionScholarships])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!institutionScholarships.length) return { byLevel: [], byType: [], byAmount: [] }

    // Par niveau d'étude
    const levelCounts = institutionScholarships.reduce((acc, s) => {
      const level = s.study_level || 'Non spécifié'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byLevel = Object.entries(levelCounts).map(([level, count]) => ({
      name: level,
      value: count
    }))

    // Par type de bourse
    const typeCounts = institutionScholarships.reduce((acc, s) => {
      const type = s.scholarship_type || 'Non spécifié'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }))

    // Distribution par montant
    const amountRanges = {
      '< $10k': 0,
      '$10k-$25k': 0,
      '$25k-$50k': 0,
      '$50k+': 0,
      'Non spécifié': 0
    }

    institutionScholarships.forEach(s => {
      if (!s.amount) {
        amountRanges['Non spécifié']++
      } else if (s.amount < 10000) {
        amountRanges['< $10k']++
      } else if (s.amount < 25000) {
        amountRanges['$10k-$25k']++
      } else if (s.amount < 50000) {
        amountRanges['$25k-$50k']++
      } else {
        amountRanges['$50k+']++
      }
    })

    const byAmount = Object.entries(amountRanges).map(([range, count]) => ({
      name: range,
      value: count
    }))

    return { byLevel, byType, byAmount }
  }, [institutionScholarships])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!institution) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Institution non trouvée</h1>
        <Link 
          to="/institutions" 
          className="text-blue-600 hover:text-blue-800"
        >
          Retour aux institutions
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/institutions"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <University className="h-12 w-12 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {institution.city}{country ? `, ${country.name}` : ''}
              </span>
              {country && (
                <span className="flex items-center">
                  <CountryFlag 
                    countryCode={country.iso_code_2 || undefined}
                    countryName={country.name}
                    size="sm"
                    showName={true}
                    fallbackEmoji={true}
                  />
                </span>
              )}
              {institution.established_year && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Fondée en {institution.established_year}
                </span>
              )}
            </div>
          </div>
        </div>
        <RealTimeIndicator 
          isConnected={isConnected} 
          lastUpdate={lastUpdate}
        />
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Étudiants"
          value={institution.student_count ? institution.student_count.toLocaleString() : 'N/A'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Classement mondial"
          value={institution.ranking_global ? `#${institution.ranking_global}` : 'Non classé'}
          icon={Star}
          color="orange"
        />
        <StatCard
          title="Bourses disponibles"
          value={scholarshipStats.total}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Bourses actives"
          value={scholarshipStats.active}
          icon={School}
          color="purple"
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations détaillées */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations détaillées</h2>
            <div className="space-y-4">
              {[
                { label: 'Nom complet', value: institution.name },
                { label: 'Ville', value: institution.city },
                { label: 'Pays', value: country?.name },
                { label: 'Nombre d\'\'étudiants', value: institution.student_count?.toLocaleString() },
                { label: 'Classement mondial', value: institution.ranking_global ? `#${institution.ranking_global}` : null },
                { label: 'Année de fondation', value: institution.established_year },
                { label: 'Type', value: institution.institution_type_id },
                { label: 'Site web', value: institution.website }
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {label === 'Site web' && value ? (
                      <a 
                        href={value as string} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Visiter ↗
                      </a>
                    ) : value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Description */}
          {institution.description && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed">{institution.description}</p>
            </Card>
          )}

          {/* Carte */}
          {mapLocation.length > 0 && (
            <Card className="p-0 mt-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Localisation</h3>
              </div>
              <MapComponent
                locations={mapLocation}
                center={[mapLocation[0].lat, mapLocation[0].lng]}
                zoom={10}
                height="300px"
              />
            </Card>
          )}
        </div>

        {/* Bourses */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Bourses d\'\'études disponibles
              </h2>
              <span className="text-sm text-gray-500">
                {scholarshipStats.total} bourse{scholarshipStats.total > 1 ? 's' : ''}
              </span>
            </div>

            {/* Statistiques bourses */}
            {scholarshipStats.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Bourses actives</div>
                  <div className="text-lg font-bold text-green-900">
                    {scholarshipStats.active}/{scholarshipStats.total}
                  </div>
                </div>
                {scholarshipStats.totalAmount > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Montant total</div>
                    <div className="text-lg font-bold text-blue-900">
                      ${scholarshipStats.totalAmount.toLocaleString()}
                    </div>
                  </div>
                )}
                {scholarshipStats.avgAmount > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Montant moyen</div>
                    <div className="text-lg font-bold text-purple-900">
                      ${Math.round(scholarshipStats.avgAmount).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Liste des bourses */}
            {institutionScholarships.length > 0 ? (
              <DataTable
                data={institutionScholarships}
                columns={scholarshipColumns}
                searchPlaceholder="Rechercher une bourse..."
                isLoading={false}
                emptyMessage="Aucune bourse trouvée"
              />
            ) : (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune bourse disponible
                </h3>
                <p className="text-gray-500">
                  Cette institution n\'offre actuellement aucune bourse d\'\'études répertoriée.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Graphiques (si bourses disponibles) */}
      {institutionScholarships.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bourses par niveau</h3>
            <Chart
              type="pie"
              data={chartData.byLevel}
              height={250}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bourses par type</h3>
            <Chart
              type="doughnut"
              data={chartData.byType}
              height={250}
              colors={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution par montant</h3>
            <Chart
              type="bar"
              data={chartData.byAmount}
              height={250}
              colors={['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#6B7280']}
            />
          </Card>
        </div>
      )}
    </div>
  )
}