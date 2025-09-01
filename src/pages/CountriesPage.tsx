import React, { useState, useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import { Card, StatCard } from '@/components/ui/Card'
import AdvancedFilters from '@/components/ui/AdvancedFilters'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import CountryFlag from '@/components/ui/CountryFlag'
import Chart from '@/components/ui/Charts'
import { useCountries, useContinents } from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { 
  Globe, Users, DollarSign, Building, Flag, 
  Grid3X3, List, BarChart3, Eye, ExternalLink 
} from 'lucide-react'
import type { Tables } from '@/types/supabase'
import { Link } from 'react-router-dom'

type Country = Tables<'countries'>

export default function CountriesPage() {
  const { data: countries, isLoading, refetch } = useCountries()
  const { data: continents } = useContinents()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedView, setSelectedView] = useState<'table' | 'grid' | 'list' | 'charts'>('table')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Configuration des filtres avancés enrichis
  const filterFields = [
    {
      key: 'search',
      label: 'Recherche',
      type: 'search' as const,
      placeholder: 'Nom du pays, capitale, nom officiel...'
    },
    {
      key: 'continent',
      label: 'Continent',
      type: 'select' as const,
      options: continents?.map(c => ({ label: c.name, value: c.id })) || []
    },
    {
      key: 'region',
      label: 'Région géographique',
      type: 'select' as const,
      options: [
        { label: 'Europe de l\'Ouest', value: 'western_europe' },
        { label: 'Europe de l\'Est', value: 'eastern_europe' },
        { label: 'Amérique du Nord', value: 'north_america' },
        { label: 'Amérique du Sud', value: 'south_america' },
        { label: 'Amérique Centrale', value: 'central_america' },
        { label: 'Afrique du Nord', value: 'north_africa' },
        { label: 'Afrique Subsaharienne', value: 'sub_saharan_africa' },
        { label: 'Asie de l\'Est', value: 'east_asia' },
        { label: 'Asie du Sud-Est', value: 'southeast_asia' },
        { label: 'Asie du Sud', value: 'south_asia' },
        { label: 'Moyen-Orient', value: 'middle_east' },
        { label: 'Océanie', value: 'oceania' },
        { label: 'Caraibes', value: 'caribbean' }
      ]
    },
    {
      key: 'population',
      label: 'Population',
      type: 'range' as const,
      min: 0,
      max: 1500000000
    },
    {
      key: 'population_category',
      label: 'Catégorie de population',
      type: 'select' as const,
      options: [
        { label: 'Très petit (< 1M)', value: 'very_small' },
        { label: 'Petit (1M - 10M)', value: 'small' },
        { label: 'Moyen (10M - 50M)', value: 'medium' },
        { label: 'Grand (50M - 100M)', value: 'large' },
        { label: 'Très grand (> 100M)', value: 'very_large' }
      ]
    },
    {
      key: 'gdp',
      label: 'PIB (Milliards USD)',
      type: 'range' as const,
      min: 0,
      max: 25000
    },
    {
      key: 'economic_status',
      label: 'Statut économique',
      type: 'select' as const,
      options: [
        { label: 'Pays développés', value: 'developed' },
        { label: 'Pays en développement', value: 'developing' },
        { label: 'Pays émergents', value: 'emerging' },
        { label: 'Pays les moins avancés', value: 'least_developed' }
      ]
    },
    {
      key: 'language',
      label: 'Langues officielles',
      type: 'multiselect' as const,
      options: [
        { label: 'Anglais', value: 'English' },
        { label: 'Français', value: 'French' },
        { label: 'Espagnol', value: 'Spanish' },
        { label: 'Allemand', value: 'German' },
        { label: 'Chinois', value: 'Chinese' },
        { label: 'Arabe', value: 'Arabic' },
        { label: 'Portugais', value: 'Portuguese' },
        { label: 'Russe', value: 'Russian' },
        { label: 'Italien', value: 'Italian' },
        { label: 'Néerlandais', value: 'Dutch' },
        { label: 'Japonais', value: 'Japanese' },
        { label: 'Coréen', value: 'Korean' }
      ]
    },
    {
      key: 'currency_type',
      label: 'Type de monnaie',
      type: 'select' as const,
      options: [
        { label: 'Dollar (USD, CAD, AUD...)', value: 'dollar' },
        { label: 'Euro (EUR)', value: 'euro' },
        { label: 'Livre (GBP)', value: 'pound' },
        { label: 'Yen (JPY)', value: 'yen' },
        { label: 'Yuan (CNY)', value: 'yuan' },
        { label: 'Franc (CHF)', value: 'franc' },
        { label: 'Autres monnaies', value: 'other' }
      ]
    },
    {
      key: 'area',
      label: 'Superficie (km²)',
      type: 'range' as const,
      min: 0,
      max: 20000000
    },
    {
      key: 'study_destination',
      label: 'Destination d\'\u00e9tudes',
      type: 'select' as const,
      options: [
        { label: 'Destination populaire', value: 'popular' },
        { label: 'Destination émergente', value: 'emerging' },
        { label: 'Destination de niche', value: 'niche' }
      ]
    }
  ]

  // Synchronisation temps réel
  const { isConnected } = useRealtimeSubscription({
    table: 'countries',
    onChange: (payload) => {
      console.log('Countries updated:', payload)
      setLastUpdate(new Date())
      refetch()
    }
  })

  // Filtrage des données avec logique avancée
  const filteredCountries = useMemo(() => {
    if (!countries) return []
    
    return countries.filter(country => {
      // Recherche étendue
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!country.name.toLowerCase().includes(searchTerm) &&
            !country.capital?.toLowerCase().includes(searchTerm) &&
            !country.name_official?.toLowerCase().includes(searchTerm) &&
            !country.official_language?.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Filtre par continent
      if (filters.continent && country.continent_id !== filters.continent) {
        return false
      }

      // Filtre par région géographique (mapping approximatif)
      if (filters.region) {
        const countryRegionMap: Record<string, string> = {
          'France': 'western_europe',
          'Germany': 'western_europe',
          'United Kingdom': 'western_europe',
          'Spain': 'western_europe',
          'Italy': 'western_europe',
          'Canada': 'north_america',
          'United States': 'north_america',
          'Mexico': 'central_america',
          'Brazil': 'south_america',
          'China': 'east_asia',
          'Japan': 'east_asia',
          'South Korea': 'east_asia',
          'India': 'south_asia',
          'Russia': 'eastern_europe',
          'Australia': 'oceania'
        }
        
        if (countryRegionMap[country.name] !== filters.region) {
          return false
        }
      }

      // Filtre par population (plage)
      if (filters.population?.min && country.population && country.population < parseInt(filters.population.min)) {
        return false
      }
      if (filters.population?.max && country.population && country.population > parseInt(filters.population.max)) {
        return false
      }

      // Filtre par catégorie de population
      if (filters.population_category && country.population) {
        const pop = country.population
        const category = filters.population_category
        
        if ((category === 'very_small' && pop >= 1000000) ||
            (category === 'small' && (pop < 1000000 || pop >= 10000000)) ||
            (category === 'medium' && (pop < 10000000 || pop >= 50000000)) ||
            (category === 'large' && (pop < 50000000 || pop >= 100000000)) ||
            (category === 'very_large' && pop < 100000000)) {
          return false
        }
      }

      // Filtre par PIB (plage)
      if (filters.gdp?.min && country.gdp_usd && country.gdp_usd < (parseInt(filters.gdp.min) * 1000000000)) {
        return false
      }
      if (filters.gdp?.max && country.gdp_usd && country.gdp_usd > (parseInt(filters.gdp.max) * 1000000000)) {
        return false
      }

      // Filtre par statut économique (mapping approximatif selon PIB par habitant)
      if (filters.economic_status && country.gdp_usd && country.population) {
        const gdpPerCapita = country.gdp_usd / country.population
        const status = filters.economic_status
        
        if ((status === 'developed' && gdpPerCapita < 15000) ||
            (status === 'emerging' && (gdpPerCapita < 5000 || gdpPerCapita >= 20000)) ||
            (status === 'developing' && (gdpPerCapita < 2000 || gdpPerCapita >= 15000)) ||
            (status === 'least_developed' && gdpPerCapita >= 5000)) {
          return false
        }
      }

      // Filtre par langues (multiselect)
      if (filters.language && filters.language.length > 0) {
        if (!country.official_language || !filters.language.includes(country.official_language)) {
          return false
        }
      }

      // Filtre par type de monnaie (mapping approximatif)
      if (filters.currency_type && country.currency) {
        const currencyMap: Record<string, string> = {
          'USD': 'dollar', 'CAD': 'dollar', 'AUD': 'dollar', 'NZD': 'dollar',
          'EUR': 'euro',
          'GBP': 'pound',
          'JPY': 'yen',
          'CNY': 'yuan',
          'CHF': 'franc'
        }
        
        const expectedType = currencyMap[country.currency] || 'other'
        if (expectedType !== filters.currency_type) {
          return false
        }
      }

      // Filtre par superficie
      if (filters.area?.min && country.area_km2 && country.area_km2 < parseInt(filters.area.min)) {
        return false
      }
      if (filters.area?.max && country.area_km2 && country.area_km2 > parseInt(filters.area.max)) {
        return false
      }

      // Filtre par destination d'études (mapping approximatif)
      if (filters.study_destination) {
        const popularDestinations = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France']
        const emergingDestinations = ['China', 'South Korea', 'Japan', 'Brazil', 'India']
        
        if ((filters.study_destination === 'popular' && !popularDestinations.includes(country.name)) ||
            (filters.study_destination === 'emerging' && !emergingDestinations.includes(country.name)) ||
            (filters.study_destination === 'niche' && (popularDestinations.includes(country.name) || emergingDestinations.includes(country.name)))) {
          return false
        }
      }

      return true
    })
  }, [countries, filters])

  // Données pour la carte
  const mapLocations = useMemo(() => {
    if (!filteredCountries) return []
    
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
      'Brazil': [-14.2350, -51.9253],
      'China': [35.8617, 104.1954],
      'India': [20.5937, 78.9629],
      'Russia': [61.5240, 105.3188],
      'South Korea': [35.9078, 127.7669],
      'Mexico': [23.6345, -102.5528]
    }

    return filteredCountries
      .filter(country => coordinates[country.name])
      .map(country => {
        const [lat, lng] = coordinates[country.name] || [0, 0]
        return {
          id: country.id,
          name: country.name,
          lat,
          lng,
          info: `Capitale: ${country.capital || 'N/A'} | Population: ${country.population?.toLocaleString() || 'N/A'}`,
          type: 'country' as const
        }
      })
  }, [filteredCountries])

  // Colonnes pour le tableau
  const columns = [
    {
      key: 'name' as keyof Country,
      label: 'Pays',
      sortable: true,
      render: (value: string, row: Country) => (
        <div className="flex items-center space-x-3">
          <CountryFlag 
            countryCode={row.iso_code_2 || undefined}
            countryName={row.name}
            size="md"
            fallbackEmoji={true}
          />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {row.name_official && row.name_official !== value && (
              <div className="text-sm text-gray-500">{row.name_official}</div>
            )}
          </div>
          <Link 
            to={`/country/${row.id}`}
            className="ml-auto p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      )
    },
    {
      key: 'capital' as keyof Country,
      label: 'Capitale',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'continent_id' as keyof Country,
      label: 'Continent',
      render: (value: string) => {
        const continent = continents?.find(c => c.id === value)
        return continent?.name || 'Non spécifié'
      }
    },
    {
      key: 'population' as keyof Country,
      label: 'Population',
      sortable: true,
      render: (value: number | null) => (
        value ? value.toLocaleString() : '-'
      )
    },
    {
      key: 'gdp_usd' as keyof Country,
      label: 'PIB (USD)',
      sortable: true,
      render: (value: number | null) => (
        value ? `$${(value / 1000000000).toFixed(1)}B` : '-'
      )
    },
    {
      key: 'official_language' as keyof Country,
      label: 'Langue officielle',
      render: (value: string | null) => value || '-'
    }
  ]

  // Statistiques dynamiques
  const stats = useMemo(() => {
    const filtered = filteredCountries || []
    return {
      total: filtered.length,
      totalAll: countries?.length || 0,
      totalPopulation: filtered.reduce((sum, c) => sum + (c.population || 0), 0),
      totalGDP: filtered.reduce((sum, c) => sum + (c.gdp_usd || 0), 0),
      continents: new Set(filtered.map(c => c.continent_id)).size,
      languages: new Set(filtered.map(c => c.official_language).filter(Boolean)).size
    }
  }, [filteredCountries, countries])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!filteredCountries) return { byContinent: [], byLanguage: [], byPopulation: [] }

    // Répartition par continent
    const continentCounts = filteredCountries.reduce((acc, c) => {
      const continent = continents?.find(cont => cont.id === c.continent_id)?.name || 'Non spécifié'
      acc[continent] = (acc[continent] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byContinent = Object.entries(continentCounts).map(([continent, count]) => ({
      name: continent,
      value: count
    }))

    // Répartition par langue
    const languageCounts = filteredCountries.reduce((acc, c) => {
      const lang = c.official_language || 'Non spécifiée'
      acc[lang] = (acc[lang] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byLanguage = Object.entries(languageCounts).map(([language, count]) => ({
      name: language,
      value: count
    }))

    // Distribution par population
    const populationRanges = {
      '< 1M': 0,
      '1M-10M': 0,
      '10M-50M': 0,
      '50M-100M': 0,
      '> 100M': 0
    }

    filteredCountries.forEach(c => {
      if (c.population) {
        if (c.population < 1000000) populationRanges['< 1M']++
        else if (c.population < 10000000) populationRanges['1M-10M']++
        else if (c.population < 50000000) populationRanges['10M-50M']++
        else if (c.population < 100000000) populationRanges['50M-100M']++
        else populationRanges['> 100M']++
      }
    })

    const byPopulation = Object.entries(populationRanges).map(([range, count]) => ({
      name: range,
      value: count
    }))

    return { byContinent, byLanguage, byPopulation }
  }, [filteredCountries, continents])

  // Rendu de la vue grille
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredCountries?.map((country) => (
        <Card key={country.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CountryFlag 
                countryCode={country.iso_code_2 || undefined}
                countryName={country.name}
                size="lg"
                fallbackEmoji={true}
              />
              <div>
                <h3 className="font-semibold text-gray-900">{country.name}</h3>
                <p className="text-sm text-gray-500">{country.capital || 'Capital inconnue'}</p>
              </div>
            </div>
            <Link 
              to={`/country/${country.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Population</span>
              <span className="text-sm font-medium">
                {country.population ? country.population.toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">PIB</span>
              <span className="text-sm font-medium">
                {country.gdp_usd ? `$${(country.gdp_usd / 1000000000).toFixed(1)}B` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Langue</span>
              <span className="text-sm font-medium">{country.official_language || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Continent</span>
              <span className="text-sm font-medium">
                {continents?.find(c => c.id === country.continent_id)?.name || 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  // Rendu de la vue liste
  const renderListView = () => (
    <div className="space-y-4">
      {filteredCountries?.map((country) => (
        <Card key={country.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CountryFlag 
                countryCode={country.iso_code_2 || undefined}
                countryName={country.name}
                size="lg"
                fallbackEmoji={true}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                <div className="flex items-center space-x-6 mt-1 text-sm text-gray-500">
                  <span>📍 {country.capital || 'Capital inconnue'}</span>
                  <span>👥 {country.population ? country.population.toLocaleString() : 'N/A'}</span>
                  <span>💰 {country.gdp_usd ? `$${(country.gdp_usd / 1000000000).toFixed(1)}B` : 'N/A'}</span>
                  <span>🗣️ {country.official_language || 'N/A'}</span>
                </div>
              </div>
            </div>
            <Link 
              to={`/country/${country.id}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </Link>
          </div>
        </Card>
      ))}
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
          Pays et destinations d'études
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explorez les différents pays offrant des opportunités d'études 
          supérieures et des bourses internationales.
        </p>
      </div>

      {/* Statistiques dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pays affichés"
          value={`${stats.total}${stats.total !== stats.totalAll ? `/${stats.totalAll}` : ''}`}
          icon={Globe}
          color="blue"
        />
        <StatCard
          title="Population totale"
          value={`${(stats.totalPopulation / 1000000000).toFixed(1)}B`}
          icon={Users}
          color="green"
        />
        <StatCard
          title="PIB total"
          value={`$${(stats.totalGDP / 1000000000000).toFixed(1)}T`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Langues"
          value={stats.languages}
          icon={Flag}
          color="orange"
        />
      </div>

      {/* Filtres avancés */}
      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        tableName="countries"
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
          data={filteredCountries || []}
          columns={columns}
          searchPlaceholder="Rechercher un pays..."
          isLoading={isLoading}
          emptyMessage="Aucun pays trouvé"
        />
      )}

      {selectedView === 'grid' && renderGridView()}
      
      {selectedView === 'list' && renderListView()}

      {selectedView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par continent</h3>
            <Chart
              type="pie"
              data={chartData.byContinent}
              height={300}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par langue</h3>
            <Chart
              type="doughnut"
              data={chartData.byLanguage}
              height={300}
              colors={['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#6366F1']}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution par population</h3>
            <Chart
              type="bar"
              data={chartData.byPopulation}
              height={300}
              colors={['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#059669']}
            />
          </Card>
        </div>
      )}
    </div>
  )
}