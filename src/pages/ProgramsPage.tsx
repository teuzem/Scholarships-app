import React, { useState, useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import { Card, StatCard } from '@/components/ui/Card'
import AdvancedFilters from '@/components/ui/AdvancedFilters'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import Chart from '@/components/ui/Charts'
import { useAcademicPrograms, useProgramCategories } from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { BookOpen, GraduationCap, DollarSign, Clock, BarChart3, Grid3X3 } from 'lucide-react'
import type { Tables } from '@/types/supabase'

type AcademicProgram = Tables<'academic_programs'>

export default function ProgramsPage() {
  const { data: programs, isLoading, refetch } = useAcademicPrograms()
  const { data: categories } = useProgramCategories()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedView, setSelectedView] = useState<'table' | 'charts'>('table')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Configuration des filtres avancés
  const filterFields = [
    {
      key: 'search',
      label: 'Recherche',
      type: 'search' as const,
      placeholder: 'Nom du programme, domaine...'
    },
    {
      key: 'level',
      label: 'Niveau d\'études',
      type: 'multiselect' as const,
      options: [
        { label: 'Licence', value: 'Bachelor' },
        { label: 'Master', value: 'Master' },
        { label: 'Doctorat', value: 'PhD' },
        { label: 'DUT/BTS', value: 'Associate' },
        { label: 'Certification', value: 'Certificate' }
      ]
    },
    {
      key: 'category',
      label: 'Catégorie',
      type: 'select' as const,
      options: categories?.map(c => ({ label: c.name, value: c.id })) || []
    },
    {
      key: 'duration',
      label: 'Durée (mois)',
      type: 'range' as const,
      min: 1,
      max: 96
    },
    {
      key: 'salary',
      label: 'Salaire moyen (USD)',
      type: 'range' as const,
      min: 20000,
      max: 200000
    },
    {
      key: 'degree_type',
      label: 'Type de diplôme',
      type: 'multiselect' as const,
      options: [
        { label: 'Sciences', value: 'Science' },
        { label: 'Arts', value: 'Arts' },
        { label: 'Ingénierie', value: 'Engineering' },
        { label: 'Commerce', value: 'Business' },
        { label: 'Médecine', value: 'Medicine' },
        { label: 'Droit', value: 'Law' }
      ]
    }
  ]

  // Synchronisation temps réel
  const { isConnected } = useRealtimeSubscription({
    table: 'academic_programs',
    onChange: (payload) => {
      console.log('Academic programs updated:', payload)
      setLastUpdate(new Date())
      refetch()
    }
  })

  // Filtrage des données
  const filteredPrograms = useMemo(() => {
    if (!programs) return []
    
    return programs.filter(program => {
      // Recherche textuelle
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!program.name.toLowerCase().includes(searchTerm) &&
            !program.degree_type?.toLowerCase().includes(searchTerm) &&
            !program.description?.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Filtre par niveau
      if (filters.level && filters.level.length > 0) {
        if (!program.level || !filters.level.includes(program.level)) {
          return false
        }
      }

      // Filtre par catégorie
      if (filters.category && program.program_category_id !== filters.category) {
        return false
      }

      // Filtre par durée
      if (filters.duration?.min && program.duration_months && program.duration_months < parseInt(filters.duration.min)) {
        return false
      }
      if (filters.duration?.max && program.duration_months && program.duration_months > parseInt(filters.duration.max)) {
        return false
      }

      // Filtre par salaire
      if (filters.salary?.min && program.average_salary_usd && program.average_salary_usd < parseInt(filters.salary.min)) {
        return false
      }
      if (filters.salary?.max && program.average_salary_usd && program.average_salary_usd > parseInt(filters.salary.max)) {
        return false
      }

      // Filtre par type de diplôme
      if (filters.degree_type && filters.degree_type.length > 0) {
        if (!program.degree_type || !filters.degree_type.includes(program.degree_type)) {
          return false
        }
      }

      return true
    })
  }, [programs, filters])

  const columns = [
    {
      key: 'name' as keyof AcademicProgram,
      label: 'Programme',
      sortable: true,
      render: (value: string, row: AcademicProgram) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{value}</div>
          {row.degree_type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {row.degree_type}
            </span>
          )}
          {row.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{row.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'level' as keyof AcademicProgram,
      label: 'Niveau',
      sortable: true,
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          'Bachelor': 'bg-green-100 text-green-800',
          'Master': 'bg-blue-100 text-blue-800',
          'PhD': 'bg-purple-100 text-purple-800',
          'Associate': 'bg-yellow-100 text-yellow-800',
          'Certificate': 'bg-gray-100 text-gray-800'
        }
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'program_category_id' as keyof AcademicProgram,
      label: 'Catégorie',
      render: (value: string) => {
        const category = categories?.find(c => c.id === value)
        return (
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>{category?.name || 'Non spécifiée'}</span>
          </div>
        )
      }
    },
    {
      key: 'duration_months' as keyof AcademicProgram,
      label: 'Durée',
      sortable: true,
      render: (value: number | null) => {
        if (!value) return '-'
        const years = Math.floor(value / 12)
        const months = value % 12
        if (years > 0 && months > 0) {
          return `${years}a ${months}m`
        } else if (years > 0) {
          return `${years} an${years > 1 ? 's' : ''}`
        } else {
          return `${months} mois`
        }
      }
    },
    {
      key: 'average_salary_usd' as keyof AcademicProgram,
      label: 'Salaire moyen',
      sortable: true,
      render: (value: number | null) => {
        if (!value) return '-'
        return (
          <div className="text-right">
            <div className="font-medium text-green-600">${value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">/an</div>
          </div>
        )
      }
    }
  ]

  // Statistiques dynamiques basées sur les données filtrées
  const stats = useMemo(() => {
    const filtered = filteredPrograms || []
    const programsWithSalary = filtered.filter(p => p.average_salary_usd)
    const programsWithDuration = filtered.filter(p => p.duration_months)
    
    return {
      total: filtered.length,
      totalAll: programs?.length || 0,
      categories: new Set(filtered.map(p => p.program_category_id)).size,
      avgSalary: programsWithSalary.length > 0 
        ? programsWithSalary.reduce((sum, p) => sum + (p.average_salary_usd || 0), 0) / programsWithSalary.length 
        : 0,
      avgDuration: programsWithDuration.length > 0
        ? programsWithDuration.reduce((sum, p) => sum + (p.duration_months || 0), 0) / programsWithDuration.length
        : 0
    }
  }, [filteredPrograms, programs])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!filteredPrograms) return { byLevel: [], byCategory: [], bySalary: [] }

    // Répartition par niveau
    const levelCounts = filteredPrograms.reduce((acc, p) => {
      const level = p.level || 'Non spécifié'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byLevel = Object.entries(levelCounts).map(([level, count]) => ({
      name: level,
      value: count
    }))

    // Répartition par catégorie
    const categoryCounts = filteredPrograms.reduce((acc, p) => {
      const category = categories?.find(c => c.id === p.program_category_id)?.name || 'Non spécifiée'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      name: category,
      value: count
    }))

    // Distribution des salaires
    const salaryRanges = {
      '< 30k': 0,
      '30k-50k': 0,
      '50k-75k': 0,
      '75k-100k': 0,
      '> 100k': 0
    }

    filteredPrograms.forEach(p => {
      if (p.average_salary_usd) {
        if (p.average_salary_usd < 30000) salaryRanges['< 30k']++
        else if (p.average_salary_usd < 50000) salaryRanges['30k-50k']++
        else if (p.average_salary_usd < 75000) salaryRanges['50k-75k']++
        else if (p.average_salary_usd < 100000) salaryRanges['75k-100k']++
        else salaryRanges['> 100k']++
      }
    })

    const bySalary = Object.entries(salaryRanges).map(([range, count]) => ({
      name: range,
      value: count
    }))

    return { byLevel, byCategory, bySalary }
  }, [filteredPrograms, categories])

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
          Programmes académiques
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez notre catalogue complet de programmes d'études supérieures 
          dans différents domaines et niveaux.
        </p>
      </div>

      {/* Statistiques dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Programmes affichés"
          value={`${stats.total}${stats.total !== stats.totalAll ? `/${stats.totalAll}` : ''}`}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Catégories"
          value={stats.categories}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Salaire moyen"
          value={`$${Math.round(stats.avgSalary).toLocaleString()}`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Durée moyenne"
          value={`${Math.round(stats.avgDuration)} mois`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Filtres avancés */}
      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        tableName="academic_programs"
        showCounts={true}
      />

      {/* Toggle Vue Table/Graphiques */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSelectedView('table')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Vue Tableau
        </button>
        <button
          onClick={() => setSelectedView('charts')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'charts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Vue Graphiques
        </button>
      </div>

      {/* Contenu principal */}
      {selectedView === 'table' ? (
        <DataTable
          data={filteredPrograms || []}
          columns={columns}
          searchPlaceholder="Rechercher un programme..."
          isLoading={isLoading}
          emptyMessage="Aucun programme trouvé"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Répartition par niveau */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par niveau</h3>
            <Chart
              type="pie"
              data={chartData.byLevel}
              height={300}
              colors={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6B7280']}
            />
          </Card>

          {/* Répartition par catégorie */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
            <Chart
              type="doughnut"
              data={chartData.byCategory}
              height={300}
              colors={['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#6366F1', '#A855F7', '#EC4899']}
            />
          </Card>

          {/* Distribution des salaires */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des salaires</h3>
            <Chart
              type="bar"
              data={chartData.bySalary}
              height={300}
              colors={['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#059669']}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </Card>
        </div>
      )}

      {/* Comparateur de programmes (section bonus) */}
      {filteredPrograms && filteredPrograms.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparateur rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Programme avec le meilleur salaire */}
            {(() => {
              const bestSalary = filteredPrograms
                .filter(p => p.average_salary_usd)
                .sort((a, b) => (b.average_salary_usd || 0) - (a.average_salary_usd || 0))[0]
              return bestSalary ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium mb-1">Meilleur salaire</div>
                  <div className="font-semibold text-gray-900">{bestSalary.name}</div>
                  <div className="text-lg font-bold text-green-600">
                    ${bestSalary.average_salary_usd?.toLocaleString()}/an
                  </div>
                </div>
              ) : null
            })()}

            {/* Programme le plus court */}
            {(() => {
              const shortest = filteredPrograms
                .filter(p => p.duration_months)
                .sort((a, b) => (a.duration_months || 0) - (b.duration_months || 0))[0]
              return shortest ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium mb-1">Plus court</div>
                  <div className="font-semibold text-gray-900">{shortest.name}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {shortest.duration_months} mois
                  </div>
                </div>
              ) : null
            })()}

            {/* Programme le plus populaire (par catégorie) */}
            {(() => {
              const categoryCount = filteredPrograms.reduce((acc, p) => {
                const catId = p.program_category_id
                if (catId) acc[catId] = (acc[catId] || 0) + 1
                return acc
              }, {} as Record<string, number>)
              
              const topCategoryId = Object.entries(categoryCount)
                .sort((a, b) => b[1] - a[1])[0]?.[0]
              
              const topCategory = categories?.find(c => c.id === topCategoryId)
              const count = topCategoryId ? categoryCount[topCategoryId] : 0
              
              return topCategory ? (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium mb-1">Catégorie populaire</div>
                  <div className="font-semibold text-gray-900">{topCategory.name}</div>
                  <div className="text-lg font-bold text-purple-600">
                    {count} programme{count > 1 ? 's' : ''}
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
