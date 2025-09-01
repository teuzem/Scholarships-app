import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '@/components/ui/DataTable'
import { Card, StatCard } from '@/components/ui/Card'
import AdvancedFilters from '@/components/ui/AdvancedFilters'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import CountryFlag from '@/components/ui/CountryFlag'
import Chart from '@/components/ui/Charts'
import { useInstitutions, useCountries, useInstitutionTypes } from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { 
  University, Users, Star, Building, Globe,
  Grid3X3, List, BarChart3, Eye, ExternalLink,
  MapPin, Award, Calendar, TrendingUp
} from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Institution = Tables<'institutions'>

export default function InstitutionsPage() {
  const { data: institutions, isLoading, refetch } = useInstitutions()
  const { data: countries } = useCountries()
  const { data: institutionTypes } = useInstitutionTypes()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedView, setSelectedView] = useState<'table' | 'grid' | 'list' | 'charts'>('table')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Configuration des filtres avancés
  const filterFields = [
    {
      key: 'search',
      label: 'Recherche',
      type: 'search' as const,
      placeholder: 'Nom, ville, description...'
    },
    {
      key: 'country',
      label: 'Pays',
      type: 'select' as const,
      options: countries?.map(c => ({ label: c.name, value: c.id })) || []
    },
    {
      key: 'type',
      label: 'Type d\'institution',
      type: 'select' as const,
      options: institutionTypes?.map(t => ({ label: t.name, value: t.id })) || []
    },
    {
      key: 'ranking',
      label: 'Classement mondial',
      type: 'range' as const,
      min: 1,
      max: 1000
    },
    {
      key: 'students',
      label: 'Nombre d\'\'étudiants',
      type: 'range' as const,
      min: 0,
      max: 100000
    },
    {
      key: 'founded',
      label: 'Année de fondation',
      type: 'range' as const,
      min: 1000,
      max: 2025
    }
  ]

  // Synchronisation temps réel
  const { isConnected } = useRealtimeSubscription({
    table: 'institutions',
    onChange: (payload) => {
      console.log('Institutions updated:', payload)
      setLastUpdate(new Date())
      refetch()
    }
  })

  // Filtrage des données
  const filteredInstitutions = useMemo(() => {
    if (!institutions) return []
    
    return institutions.filter(institution => {
      // Recherche textuelle
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!institution.name.toLowerCase().includes(searchTerm) &&
            !institution.city?.toLowerCase().includes(searchTerm) &&
            !institution.description?.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Filtre par pays
      if (filters.country && institution.country_id !== filters.country) {
        return false
      }

      // Filtre par type
      if (filters.type && institution.institution_type_id !== filters.type) {
        return false
      }

      // Filtre par classement
      if (filters.ranking?.min && institution.ranking_global && institution.ranking_global < parseInt(filters.ranking.min)) {
        return false
      }
      if (filters.ranking?.max && institution.ranking_global && institution.ranking_global > parseInt(filters.ranking.max)) {
        return false
      }

      // Filtre par nombre d'étudiants
      if (filters.students?.min && institution.student_count && institution.student_count < parseInt(filters.students.min)) {
        return false
      }
      if (filters.students?.max && institution.student_count && institution.student_count > parseInt(filters.students.max)) {
        return false
      }

      // Filtre par année de fondation
      if (filters.founded?.min && institution.established_year && institution.established_year < parseInt(filters.founded.min)) {
        return false
      }
      if (filters.founded?.max && institution.established_year && institution.established_year > parseInt(filters.founded.max)) {
        return false
      }

      return true
    })
  }, [institutions, filters])

  // Données pour la carte (coordonnées approximatives)
  const mapLocations = useMemo(() => {
    if (!filteredInstitutions) return []
    
    const coordinates: Record<string, [number, number]> = {
      // Grandes villes universitaires
      'Paris': [48.8566, 2.3522],
      'London': [51.5074, -0.1278],
      'Berlin': [52.5200, 13.4050],
      'Madrid': [40.4168, -3.7038],
      'Rome': [41.9028, 12.4964],
      'New York': [40.7128, -74.0060],
      'Boston': [42.3601, -71.0589],
      'Toronto': [43.6532, -79.3832],
      'Tokyo': [35.6762, 139.6503],
      'Sydney': [-33.8688, 151.2093],
      'Melbourne': [-37.8136, 144.9631],
      'Beijing': [39.9042, 116.4074],
      'Shanghai': [31.2304, 121.4737],
      'Mumbai': [19.0760, 72.8777],
      'Delhi': [28.7041, 77.1025]
    }

    return filteredInstitutions
      .filter(institution => institution.city && coordinates[institution.city])
      .slice(0, 100) // Limiter à 100 pour les performances
      .map(institution => {
        const [lat, lng] = coordinates[institution.city!] || [0, 0]
        return {
          id: institution.id,
          name: institution.name,
          lat,
          lng,
          info: `${institution.name} | Étudiants: ${institution.student_count?.toLocaleString() || 'N/A'} | Classement: ${institution.ranking_global ? `#${institution.ranking_global}` : 'N/A'}`,
          type: 'institution' as const
        }
      })
  }, [filteredInstitutions])

  // Colonnes pour le tableau
  const columns = [
    {
      key: 'name' as keyof Institution,
      label: 'Institution',
      sortable: true,
      render: (value: string, row: Institution) => {
        const country = countries?.find(c => c.id === row.country_id)
        return (
          <div className="flex items-center space-x-3">
            <University className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium text-gray-900">{value}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {country && (
                  <>
                    <CountryFlag 
                      countryCode={country.iso_code_2 || undefined}
                      countryName={country.name}
                      size="sm"
                      fallbackEmoji={true}
                    />
                    <span>{row.city}, {country.name}</span>
                  </>
                )}
              </div>
            </div>
            <Link 
              to={`/institution/${row.id}`}
              className="ml-auto p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        )
      }
    },
    {
      key: 'student_count' as keyof Institution,
      label: 'Étudiants',
      sortable: true,
      render: (value: number | null) => (
        <div className="text-right">
          <span className="font-medium">{value ? value.toLocaleString() : '-'}</span>
        </div>
      )
    },
    {
      key: 'ranking_global' as keyof Institution,
      label: 'Classement',
      sortable: true,
      render: (value: number | null) => (
        value ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Star className="h-3 w-3 mr-1" />
            #{value}
          </span>
        ) : (
          <span className="text-gray-400">Non classé</span>
        )
      )
    },
    {
      key: 'established_year' as keyof Institution,
      label: 'Fondée',
      sortable: true,
      render: (value: number | null) => (
        value ? (
          <span className="text-sm text-gray-600">{value}</span>
        ) : '-'
      )
    },
    {
      key: 'institution_type_id' as keyof Institution,
      label: 'Type',
      render: (value: string | null) => {
        const type = institutionTypes?.find(t => t.id === value)
        return type?.name || 'Non spécifié'
      }
    }
  ]

  // Statistiques dynamiques
  const stats = useMemo(() => {
    const filtered = filteredInstitutions || []
    const withStudents = filtered.filter(i => i.student_count)
    const withRanking = filtered.filter(i => i.ranking_global)
    const withYear = filtered.filter(i => i.established_year)
    
    return {
      total: filtered.length,
      totalAll: institutions?.length || 0,
      totalStudents: withStudents.reduce((sum, i) => sum + (i.student_count || 0), 0),
      avgRanking: withRanking.length > 0 
        ? withRanking.reduce((sum, i) => sum + (i.ranking_global || 0), 0) / withRanking.length 
        : 0,
      countries: new Set(filtered.map(i => i.country_id)).size,
      avgAge: withYear.length > 0 
        ? 2025 - (withYear.reduce((sum, i) => sum + (i.established_year || 0), 0) / withYear.length)
        : 0
    }
  }, [filteredInstitutions, institutions])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!filteredInstitutions) return { byCountry: [], byType: [], byRanking: [] }

    // Répartition par pays
    const countryCounts = filteredInstitutions.reduce((acc, inst) => {
      const country = countries?.find(c => c.id === inst.country_id)?.name || 'Pays inconnu'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCountry = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({
        name: country,
        value: count
      }))

    // Répartition par type
    const typeCounts = filteredInstitutions.reduce((acc, inst) => {
      const type = institutionTypes?.find(t => t.id === inst.institution_type_id)?.name || 'Non spécifié'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }))

    // Distribution par classement
    const rankingRanges = {
      'Top 100': 0,
      '101-300': 0,
      '301-500': 0,
      '501-1000': 0,
      'Non classé': 0
    }

    filteredInstitutions.forEach(inst => {
      if (!inst.ranking_global) {
        rankingRanges['Non classé']++
      } else if (inst.ranking_global <= 100) {
        rankingRanges['Top 100']++
      } else if (inst.ranking_global <= 300) {
        rankingRanges['101-300']++
      } else if (inst.ranking_global <= 500) {
        rankingRanges['301-500']++
      } else {
        rankingRanges['501-1000']++
      }
    })

    const byRanking = Object.entries(rankingRanges).map(([range, count]) => ({
      name: range,
      value: count
    }))

    return { byCountry, byType, byRanking }
  }, [filteredInstitutions, countries, institutionTypes])

  // Rendu de la vue grille
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredInstitutions?.map((institution) => {
        const country = countries?.find(c => c.id === institution.country_id)
        return (
          <Card key={institution.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <University className="h-6 w-6 text-blue-500" />
                {country && (
                  <CountryFlag 
                    countryCode={country.iso_code_2 || undefined}
                    countryName={country.name}
                    size="sm"
                    fallbackEmoji={true}
                  />
                )}
              </div>
              <Link 
                to={`/institution/${institution.id}`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{institution.name}</h3>
                <p className="text-sm text-gray-500">
                  {institution.city}{country ? `, ${country.name}` : ''}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Étudiants</span>
                  <span className="text-sm font-medium">
                    {institution.student_count ? institution.student_count.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Classement</span>
                  <span className="text-sm font-medium">
                    {institution.ranking_global ? `#${institution.ranking_global}` : 'Non classé'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fondée</span>
                  <span className="text-sm font-medium">{institution.established_year || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )

  // Rendu de la vue liste
  const renderListView = () => (
    <div className="space-y-4">
      {filteredInstitutions?.map((institution) => {
        const country = countries?.find(c => c.id === institution.country_id)
        return (
          <Card key={institution.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <University className="h-8 w-8 text-blue-500" />
                <div className="flex items-center space-x-3">
                  {country && (
                    <CountryFlag 
                      countryCode={country.iso_code_2 || undefined}
                      countryName={country.name}
                      size="md"
                      fallbackEmoji={true}
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                    <div className="flex items-center space-x-6 mt-1 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {institution.city}{country ? `, ${country.name}` : ''}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {institution.student_count ? institution.student_count.toLocaleString() : 'N/A'} étudiants
                      </span>
                      {institution.ranking_global && (
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          Classement #{institution.ranking_global}
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
              </div>
              <Link 
                to={`/institution/${institution.id}`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </Link>
            </div>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header avec indicateur temps réel */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <RealTimeIndicator 
            isConnected={isConnected} 
            lastUpdate={lastUpdate}
            className="mb-4"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Institutions d\'enseignement supérieur
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez les meilleures universités et écoles du monde entier 
          avec leurs programmes et opportunités de bourses.
        </p>
      </div>

      {/* Statistiques dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Institutions affichées"
          value={`${stats.total}${stats.total !== stats.totalAll ? `/${stats.totalAll}` : ''}`}
          icon={University}
          color="blue"
        />
        <StatCard
          title="Total étudiants"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Classement moyen"
          value={stats.avgRanking > 0 ? `#${Math.round(stats.avgRanking)}` : 'N/A'}
          icon={Star}
          color="purple"
        />
        <StatCard
          title="Pays représentés"
          value={stats.countries}
          icon={Globe}
          color="orange"
        />
      </div>

      {/* Filtres avancés */}
      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        tableName="institutions"
        showCounts={true}
      />

      {/* Sélecteur de vues */}
      <div className="flex justify-center flex-wrap gap-2">
        {[
          { key: 'table', icon: Building, label: 'Tableau' },
          { key: 'grid', icon: Grid3X3, label: 'Grille' },
          { key: 'list', icon: List, label: 'Liste' },
          { key: 'charts', icon: BarChart3, label: 'Graphiques' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as any)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedView === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      {selectedView === 'table' && (
        <DataTable
          data={filteredInstitutions || []}
          columns={columns}
          searchPlaceholder="Rechercher une institution..."
          isLoading={isLoading}
          emptyMessage="Aucune institution trouvée"
        />
      )}

      {selectedView === 'grid' && renderGridView()}
      
      {selectedView === 'list' && renderListView()}

      {selectedView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 pays (institutions)</h3>
            <Chart
              type="bar"
              data={chartData.byCountry}
              height={300}
              colors={['#3B82F6']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par type</h3>
            <Chart
              type="pie"
              data={chartData.byType}
              height={300}
              colors={['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution par classement</h3>
            <Chart
              type="doughnut"
              data={chartData.byRanking}
              height={300}
              colors={['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#059669']}
            />
          </Card>
        </div>
      )}

      {/* Comparateur d'institutions (section bonus) */}
      {filteredInstitutions && filteredInstitutions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparateur rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meilleur classement */}
            {(() => {
              const bestRanked = filteredInstitutions
                .filter(i => i.ranking_global)
                .sort((a, b) => (a.ranking_global || 9999) - (b.ranking_global || 9999))[0]
              const country = countries?.find(c => c.id === bestRanked?.country_id)
              return bestRanked ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium mb-1">Meilleur classement</div>
                  <div className="font-semibold text-gray-900 line-clamp-1">{bestRanked.name}</div>
                  <div className="text-sm text-gray-500">{bestRanked.city}, {country?.name}</div>
                  <div className="text-lg font-bold text-yellow-600">
                    #{bestRanked.ranking_global || bestRanked.ranking_national || 'N/A'}
                  </div>
                </div>
              ) : null
            })()}

            {/* Plus d'étudiants */}
            {(() => {
              const largest = filteredInstitutions
                .filter(i => i.student_count)
                .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))[0]
              const country = countries?.find(c => c.id === largest?.country_id)
              return largest ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium mb-1">Plus grande</div>
                  <div className="font-semibold text-gray-900 line-clamp-1">{largest.name}</div>
                  <div className="text-sm text-gray-500">{largest.city}, {country?.name}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {largest.student_count?.toLocaleString()} étudiants
                  </div>
                </div>
              ) : null
            })()}

            {/* Plus ancienne */}
            {(() => {
              const oldest = filteredInstitutions
                .filter(i => i.established_year)
                .sort((a, b) => (a.established_year || 9999) - (b.established_year || 9999))[0]
              const country = countries?.find(c => c.id === oldest?.country_id)
              return oldest ? (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium mb-1">Plus ancienne</div>
                  <div className="font-semibold text-gray-900 line-clamp-1">{oldest.name}</div>
                  <div className="text-sm text-gray-500">{oldest.city}, {country?.name}</div>
                  <div className="text-lg font-bold text-purple-600">
                    {oldest.established_year}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        </Card>
      )}
    </div>
  )
}