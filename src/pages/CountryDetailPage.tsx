import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, StatCard } from '@/components/ui/Card'
import CountryFlag from '@/components/ui/CountryFlag'
import MapComponent from '@/components/ui/MapComponent'
import DataTable from '@/components/ui/DataTable'
import Chart from '@/components/ui/Charts'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import { useCountry, useInstitutions, useContinents } from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { 
  Globe, Users, DollarSign, Building, MapPin, Languages, 
  School, ArrowLeft, ExternalLink, BarChart3, Landmark
} from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Country = Tables<'countries'>
type Institution = Tables<'institutions'>

export default function CountryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: country, isLoading } = useCountry(id!)
  const { data: allInstitutions } = useInstitutions()
  const { data: continents } = useContinents()
  
  // Synchronisation temps réel
  const { isConnected } = useRealtimeSubscription({
    table: 'countries',
    filter: `id=eq.${id}`,
    onChange: () => {
      setLastUpdate(new Date())
    }
  })

  // Institutions de ce pays
  const countryInstitutions = useMemo(() => {
    if (!allInstitutions || !country) return []
    return allInstitutions.filter(inst => inst.country_id === country.id)
  }, [allInstitutions, country])

  // Données pour la carte
  const mapLocation = useMemo(() => {
    if (!country) return []
    
    const coordinates: Record<string, [number, number]> = {
      'France': [46.6034, 1.8883],
      'Germany': [51.1657, 10.4515], 
      'United Kingdom': [55.3781, -3.4360],
      'Spain': [40.4637, -3.7492],
      'Italy': [41.8719, 12.5674],
      'Canada': [56.1304, -106.3468],
      'United States': [37.0902, -95.7129],
      'Japan': [36.2048, 138.2529],
      'Australia': [-25.2744, 133.7751],
      'Brazil': [-14.2350, -51.9253]
    }

    const coords = coordinates[country.name]
    if (!coords) return []

    const [lat, lng] = coords
    return [{
      id: country.id,
      name: country.name,
      lat,
      lng,
      info: `Capitale: ${country.capital || 'N/A'}`,
      type: 'country' as const
    }]
  }, [country])

  // Colonnes pour le tableau des institutions
  const institutionColumns = [
    {
      key: 'name' as keyof Institution,
      label: 'Institution',
      sortable: true,
      render: (value: string, row: Institution) => (
        <div className="flex items-center space-x-3">
          <School className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {row.institution_type_id && (
              <div className="text-sm text-gray-500">Type: {row.institution_type_id}</div>
            )}
          </div>
          <Link 
            to={`/institution/${row.id}`}
            className="ml-auto p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Voir les détails"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )
    },
    {
      key: 'city' as keyof Institution,
      label: 'Ville',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'student_count' as keyof Institution,
      label: 'Nombre d\'\'étudiants',
      sortable: true,
      render: (value: number | null) => 
        value ? value.toLocaleString() : '-'
    },
    {
      key: 'ranking_global' as keyof Institution,
      label: 'Classement mondial',
      sortable: true,
      render: (value: number | null) => 
        value ? `#${value}` : 'Non classé'
    },
    {
      key: 'established_year' as keyof Institution,
      label: 'Fondée',
      sortable: true,
      render: (value: number | null) => value || '-'
    }
  ]

  // Statistiques des institutions
  const institutionStats = useMemo(() => {
    if (!countryInstitutions.length) return {
      total: 0,
      totalStudents: 0,
      avgRanking: 0,
      oldestYear: 0
    }

    const withStudents = countryInstitutions.filter(i => i.student_count)
    const withRanking = countryInstitutions.filter(i => i.ranking_global)
    const withYear = countryInstitutions.filter(i => i.established_year)

    return {
      total: countryInstitutions.length,
      totalStudents: withStudents.reduce((sum, i) => sum + (i.student_count || 0), 0),
      avgRanking: withRanking.length > 0 
        ? withRanking.reduce((sum, i) => sum + (i.ranking_global || 0), 0) / withRanking.length 
        : 0,
      oldestYear: withYear.length > 0 
        ? Math.min(...withYear.map(i => i.established_year || 9999))
        : 0
    }
  }, [countryInstitutions])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!countryInstitutions.length) return { byType: [], byCity: [] }

    // Par type d'institution
    const typeCounts = countryInstitutions.reduce((acc, inst) => {
      const type = inst.institution_type_id || 'Non spécifié'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }))

    // Par ville
    const cityCounts = countryInstitutions.reduce((acc, inst) => {
      const city = inst.city || 'Ville inconnue'
      acc[city] = (acc[city] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCity = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({
        name: city,
        value: count
      }))

    return { byType, byCity }
  }, [countryInstitutions])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
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

  if (!country) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pays non trouvé</h1>
        <Link 
          to="/countries" 
          className="text-blue-600 hover:text-blue-800"
        >
          Retour aux pays
        </Link>
      </div>
    )
  }

  const continent = continents?.find(c => c.id === country.continent_id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/countries"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <CountryFlag 
            countryCode={country.iso_code_2 || undefined}
            countryName={country.name}
            size="xl"
            fallbackEmoji={true}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{country.name}</h1>
            {country.name_official && country.name_official !== country.name && (
              <p className="text-lg text-gray-600 mt-1">{country.name_official}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {country.capital || 'Capitale inconnue'}
              </span>
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                {continent?.name || 'Continent inconnu'}
              </span>
              {country.official_language && (
                <span className="flex items-center">
                  <Languages className="h-4 w-4 mr-1" />
                  {country.official_language}
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
          title="Population"
          value={country.population ? country.population.toLocaleString() : 'N/A'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="PIB (USD)"
          value={country.gdp_usd ? `$${(country.gdp_usd / 1000000000).toFixed(1)}B` : 'N/A'}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Institutions"
          value={institutionStats.total}
          icon={School}
          color="purple"
        />
        <StatCard
          title="Total étudiants"
          value={institutionStats.totalStudents ? institutionStats.totalStudents.toLocaleString() : 'N/A'}
          icon={Users}
          color="orange"
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
                { label: 'Nom officiel', value: country.name_official },
                { label: 'Capitale', value: country.capital },
                { label: 'Continent', value: continent?.name },
                { label: 'Population', value: country.population?.toLocaleString() },
                { label: 'PIB (USD)', value: country.gdp_usd ? `$${(country.gdp_usd / 1000000000).toFixed(1)} milliards` : null },
                { label: 'Langue officielle', value: country.official_language },
                { label: 'Code ISO2', value: country.iso_code_2 },
                { label: 'Code ISO3', value: country.iso_code_3 },
                { label: 'Devise', value: country.currency }
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Carte */}
          {mapLocation.length > 0 && (
            <Card className="p-0 mt-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Localisation</h3>
              </div>
              <MapComponent
                locations={mapLocation}
                center={[mapLocation[0].lat, mapLocation[0].lng]}
                zoom={6}
                height="300px"
              />
            </Card>
          )}
        </div>

        {/* Institutions */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Institutions d\'enseignement supérieur
              </h2>
              <span className="text-sm text-gray-500">
                {institutionStats.total} institution{institutionStats.total > 1 ? 's' : ''}
              </span>
            </div>

            {/* Statistiques institutions */}
            {institutionStats.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total étudiants</div>
                  <div className="text-lg font-bold text-blue-900">
                    {institutionStats.totalStudents.toLocaleString()}
                  </div>
                </div>
                {institutionStats.avgRanking > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Classement moyen</div>
                    <div className="text-lg font-bold text-green-900">
                      #{Math.round(institutionStats.avgRanking)}
                    </div>
                  </div>
                )}
                {institutionStats.oldestYear > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Plus ancienne</div>
                    <div className="text-lg font-bold text-purple-900">
                      {institutionStats.oldestYear}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Liste des institutions */}
            {countryInstitutions.length > 0 ? (
              <DataTable
                data={countryInstitutions}
                columns={institutionColumns}
                searchPlaceholder="Rechercher une institution..."
                isLoading={false}
                emptyMessage="Aucune institution trouvée"
              />
            ) : (
              <div className="text-center py-12">
                <Landmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune institution répertoriée
                </h3>
                <p className="text-gray-500">
                  Aucune institution d\'enseignement supérieur n\'est actuellement répertoriée pour ce pays.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Graphiques (si institutions disponibles) */}
      {countryInstitutions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Institutions par type</h3>
            <Chart
              type="pie"
              data={chartData.byType}
              height={300}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Institutions par ville (Top 10)</h3>
            <Chart
              type="bar"
              data={chartData.byCity}
              height={300}
              colors={['#10B981']}
            />
          </Card>
        </div>
      )}
    </div>
  )
}