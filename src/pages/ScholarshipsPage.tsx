import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScholarships, useUserFavorites, useAddToFavorites, useRemoveFromFavorites, useInstitutions, useCountries } from '@/hooks/useDatabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, StatCard } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import {
  Heart,
  Clock,
  MapPin,
  DollarSign,
  Filter,
  GraduationCap,
  ExternalLink,
  Star,
  Search,
  X,
  AlertTriangle,
  Loader2,
  Grid3X3,
  List,
  Table,
  BarChart3,
  Calendar,
  BookOpen,
  Building2,
  Globe
} from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Scholarship = Tables<'scholarships'>
type Institution = Tables<'institutions'>
type Country = Tables<'countries'>

interface ScholarshipFilters {
  search: string
  study_level: string
  amount_min: string
  amount_max: string
  deadline_from: string
  scholarship_type: string
  is_featured: string
  country: string
  institution_id: string
  field_of_study: string
  duration: string
}

type ViewMode = 'table' | 'cards' | 'grid' | 'charts'

export default function ScholarshipsPage() {
  const { user } = useAuth()
  const { data: scholarships, isLoading, error } = useScholarships()
  const { data: userFavorites } = useUserFavorites(user?.id)
  const { data: institutions } = useInstitutions()
  const { data: countries } = useCountries()
  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()
  
  const [filters, setFilters] = useState<ScholarshipFilters>({
    search: '',
    study_level: '',
    amount_min: '',
    amount_max: '',
    deadline_from: '',
    scholarship_type: '',
    is_featured: '',
    country: '',
    institution_id: '',
    field_of_study: '',
    duration: ''
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const favoriteScholarshipIds = new Set(userFavorites?.map(f => f.scholarship_id) || [])

  const handleToggleFavorite = (scholarshipId: string) => {
    if (!user) return
    
    if (favoriteScholarshipIds.has(scholarshipId)) {
      removeFromFavorites.mutate({ userId: user.id, scholarshipId })
    } else {
      addToFavorites.mutate({ userId: user.id, scholarshipId })
    }
  }

  const filteredScholarships = useMemo(() => {
    if (!scholarships) return []
    
    return scholarships.filter((scholarship) => {
      // Recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          scholarship.title?.toLowerCase().includes(searchLower) ||
          scholarship.description?.toLowerCase().includes(searchLower) ||
          scholarship.study_fields?.some(field => field.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      
      // Niveau d'études
      if (filters.study_level && scholarship.study_level !== filters.study_level) {
        return false
      }
      
      // Montant minimum
      if (filters.amount_min && scholarship.amount) {
        if (scholarship.amount < parseInt(filters.amount_min)) return false
      }
      
      // Montant maximum
      if (filters.amount_max && scholarship.amount) {
        if (scholarship.amount > parseInt(filters.amount_max)) return false
      }
      
      // Date limite
      if (filters.deadline_from) {
        const deadlineDate = new Date(scholarship.application_deadline)
        const filterDate = new Date(filters.deadline_from)
        if (deadlineDate < filterDate) return false
      }
      
      // Type de bourse
      if (filters.scholarship_type && scholarship.scholarship_type !== filters.scholarship_type) {
        return false
      }
      
      // Bourses recommandées
      if (filters.is_featured === 'true' && !scholarship.is_featured) {
        return false
      }
      
      // Pays
      if (filters.country && scholarship.target_countries) {
        if (!scholarship.target_countries.includes(filters.country)) return false
      }
      
      // Institution
      if (filters.institution_id && scholarship.institution_id !== filters.institution_id) {
        return false
      }
      
      // Domaine d'études
      if (filters.field_of_study && scholarship.study_fields) {
        if (!scholarship.study_fields.includes(filters.field_of_study)) return false
      }
      
      // Durée
      if (filters.duration && scholarship.duration_months) {
        const durationFilter = parseInt(filters.duration)
        if (scholarship.duration_months !== durationFilter) return false
      }
      
      return true
    })
  }, [scholarships, filters])

  const clearFilters = () => {
    setFilters({
      search: '',
      study_level: '',
      amount_min: '',
      amount_max: '',
      deadline_from: '',
      scholarship_type: '',
      is_featured: '',
      country: '',
      institution_id: '',
      field_of_study: '',
      duration: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const stats = useMemo(() => {
    if (!scholarships) return { 
      total: 0, 
      active: 0, 
      featured: 0, 
      expiringSoon: 0, 
      totalAmount: 0, 
      averageAmount: 0, 
      renewable: 0 
    }
    
    const active = scholarships.filter(s => s.is_active).length
    const featured = scholarships.filter(s => s.is_featured).length
    const renewable = scholarships.filter(s => s.renewable).length
    const expiringSoon = scholarships.filter(s => {
      const deadline = new Date(s.application_deadline)
      const now = new Date()
      return (deadline.getTime() - now.getTime()) < (30 * 24 * 60 * 60 * 1000)
    }).length
    const totalAmount = scholarships.reduce((sum, s) => sum + (s.amount || 0), 0)
    const averageAmount = scholarships.length > 0 ? totalAmount / scholarships.length : 0
    
    return {
      total: scholarships.length,
      active,
      featured,
      expiringSoon,
      totalAmount,
      averageAmount,
      renewable
    }
  }, [scholarships])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!filteredScholarships) return { types: [], levels: [], amounts: [], countries: [] }
    
    const typeData = filteredScholarships.reduce((acc, scholarship) => {
      const type = scholarship.scholarship_type || 'Non spécifié'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const levelData = filteredScholarships.reduce((acc, scholarship) => {
      const level = scholarship.study_level || 'Non spécifié'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const amountRanges = {
      '0-5K€': 0,
      '5K-15K€': 0,
      '15K-30K€': 0,
      '30K+€': 0
    }
    
    filteredScholarships.forEach(s => {
      const amount = s.amount || 0
      if (amount < 5000) amountRanges['0-5K€']++
      else if (amount < 15000) amountRanges['5K-15K€']++
      else if (amount < 30000) amountRanges['15K-30K€']++
      else amountRanges['30K+€']++
    })
    
    const countryData = filteredScholarships.reduce((acc, scholarship) => {
      const countries = scholarship.target_countries || ['International']
      countries.forEach(country => {
        acc[country] = (acc[country] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    return {
      types: Object.entries(typeData).map(([name, value]) => ({ name, value })),
      levels: Object.entries(levelData).map(([name, value]) => ({ name, value })),
      amounts: Object.entries(amountRanges).map(([name, value]) => ({ name, value })),
      countries: Object.entries(countryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
    }
  }, [filteredScholarships])

  // Options uniques pour les filtres
  const uniqueOptions = useMemo(() => {
    if (!scholarships) return {
      studyLevels: [],
      scholarshipTypes: [],
      fieldsOfStudy: [],
      durations: [],
      targetCountries: []
    }
    
    const studyLevels = [...new Set(scholarships.map(s => s.study_level).filter(Boolean))]
    const scholarshipTypes = [...new Set(scholarships.map(s => s.scholarship_type).filter(Boolean))]
    const fieldsOfStudy = [...new Set(scholarships.flatMap(s => s.study_fields || []).filter(Boolean))]
    const durations = [...new Set(scholarships.map(s => s.duration_months).filter(Boolean))].map(d => `${d} mois`)
    
    const targetCountries = [...new Set(
      scholarships
        .flatMap(s => s.target_countries || [])
        .filter(Boolean)
    )]
    
    return {
      studyLevels: studyLevels.sort(),
      scholarshipTypes: scholarshipTypes.sort(),
      fieldsOfStudy: fieldsOfStudy.sort(),
      durations: durations.sort(),
      targetCountries: targetCountries.sort()
    }
  }, [scholarships])

  // Rendu des vues
  const renderScholarshipCard = (scholarship: Scholarship) => (
    <div key={scholarship.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to={`/scholarship/${scholarship.id}`}
              className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {scholarship.title}
            </Link>
            {scholarship.is_featured && (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {scholarship.study_level && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {scholarship.study_level}
              </span>
            )}
            {scholarship.scholarship_type && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {scholarship.scholarship_type}
              </span>
            )}
            {scholarship.renewable && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Renouvelable
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {scholarship.amount ? `${scholarship.amount.toLocaleString()}€` : 'Non spécifié'}
          </div>
          {scholarship.currency && scholarship.currency !== 'EUR' && (
            <div className="text-sm text-gray-500">{scholarship.currency}</div>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">
        {scholarship.description}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
        {scholarship.study_fields && scholarship.study_fields.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{scholarship.study_fields[0]}{scholarship.study_fields.length > 1 ? ` +${scholarship.study_fields.length - 1}` : ''}</span>
          </div>
        )}
        
        {scholarship.duration_months && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{scholarship.duration_months} mois</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Échéance: {new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}
          </span>
        </div>
        
        {scholarship.target_countries && scholarship.target_countries.length > 0 && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {scholarship.target_countries.slice(0, 2).join(', ')}
              {scholarship.target_countries.length > 2 && ` +${scholarship.target_countries.length - 2}`}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            scholarship.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {scholarship.is_active ? 'Ouvert' : 'Fermé'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <IconButton
              icon={Heart}
              size="sm"
              variant={favoriteScholarshipIds.has(scholarship.id) ? 'primary' : 'ghost'}
              onClick={() => handleToggleFavorite(scholarship.id)}
              className={favoriteScholarshipIds.has(scholarship.id) ? 'text-red-500' : 'text-gray-400'}
            />
          )}
          <Link to={`/scholarship/${scholarship.id}`}>
            <Button size="sm" variant="outline">
              Voir détails
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (filteredScholarships.length === 0) {
      return (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {scholarships?.length === 0 ? 'Aucune bourse disponible' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-600">
            {scholarships?.length === 0 
              ? 'Les bourses d\'études seront bientôt disponibles.'
              : 'Aucune bourse ne correspond à vos critères de recherche. Essayez d\'ajuster vos filtres.'}
          </p>
        </div>
      )
    }

    switch (viewMode) {
      case 'cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredScholarships.map(renderScholarshipCard)}
          </div>
        )
        
      case 'grid':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredScholarships.map(scholarship => (
              <div key={scholarship.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <Link to={`/scholarship/${scholarship.id}`} className="block">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                      {scholarship.title}
                    </h3>
                    <div className="text-lg font-bold text-green-600 mb-2">
                      {scholarship.amount ? `${scholarship.amount.toLocaleString()}€` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {scholarship.study_level || 'Tous niveaux'}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )
        
      case 'table':
        return (
          <DataTable
            data={filteredScholarships}
            columns={columns}
            searchPlaceholder="Rechercher des bourses..."
            isLoading={isLoading}
            emptyMessage={hasActiveFilters ? 'Aucune bourse trouvée avec ces critères' : 'Aucune bourse disponible'}
            onRowClick={(scholarship) => window.open(`/scholarship/${scholarship.id}`, '_blank')}
          />
        )
        
      case 'charts':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Répartition par type</h3>
                  <div className="h-64">
                    {/* Placeholder for chart component */}
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Graphique des types de bourses</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {chartData.types.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Répartition par niveau</h3>
                  <div className="h-64">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Graphique des niveaux d'études</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {chartData.levels.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Répartition par montant</h3>
                  <div className="h-64">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Graphique des montants</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {chartData.amounts.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Top 10 des pays cibles</h3>
                  <div className="h-64">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Graphique des pays</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {chartData.countries.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  // Colonnes pour DataTable
  const columns = [
    {
      key: 'title' as keyof Scholarship,
      label: 'Titre',
      sortable: true,
      render: (value: string, row: Scholarship) => (
        <div className="space-y-1">
          <Link 
            to={`/scholarship/${row.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 block"
          >
            {value}
          </Link>
          <div className="flex items-center space-x-2">
            {row.is_featured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Recommandée
              </span>
            )}
            {row.scholarship_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {row.scholarship_type}
              </span>
            )}
            {row.renewable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Renouvelable
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'amount' as keyof Scholarship,
      label: 'Montant',
      sortable: true,
      render: (value: number | null, row: Scholarship) => (
        <div className="text-right">
          {value ? (
            <div className="font-semibold text-green-600">
              {value.toLocaleString()} {row.currency || 'EUR'}
            </div>
          ) : (
            <span className="text-gray-400">Non spécifié</span>
          )}
        </div>
      )
    },
    {
      key: 'study_fields' as keyof Scholarship,
      label: 'Domaine',
      sortable: true,
      render: (value: string[] | null) => (
        <div className="flex items-center space-x-1">
          <BookOpen className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {value && value.length > 0 
              ? value[0] + (value.length > 1 ? ` +${value.length - 1}` : '') 
              : 'Non spécifié'}
          </span>
        </div>
      )
    },
    {
      key: 'application_deadline' as keyof Scholarship,
      label: 'Date limite',
      sortable: true,
      render: (value: string) => {
        const deadline = new Date(value)
        const now = new Date()
        const isExpiringSoon = (deadline.getTime() - now.getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 jours
        
        return (
          <div className="flex items-center space-x-1">
            <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {deadline.toLocaleDateString('fr-FR')}
            </span>
          </div>
        )
      }
    },
    {
      key: 'study_level' as keyof Scholarship,
      label: 'Niveau',
      sortable: true,
      render: (value: string | null) => (
        value ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {value}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'target_countries' as keyof Scholarship,
      label: 'Pays cibles',
      render: (value: string[] | null) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {value && value.length > 0 ? value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : '') : 'Tous pays'}
          </span>
        </div>
      )
    },
    {
      key: 'actions' as keyof Scholarship,
      label: 'Actions',
      render: (_, row: Scholarship) => (
        <div className="flex items-center space-x-2">
          {user && (
            <IconButton
              icon={Heart}
              size="sm"
              variant={favoriteScholarshipIds.has(row.id) ? 'primary' : 'ghost'}
              onClick={() => handleToggleFavorite(row.id)}
              className={favoriteScholarshipIds.has(row.id) ? 'text-red-500' : 'text-gray-400'}
            />
          )}
          <Link to={`/scholarship/${row.id}`}>
            <IconButton
              icon={ExternalLink}
              size="sm"
              variant="ghost"
            />
          </Link>
        </div>
      )
    }
  ]

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center space-x-2 text-red-600 p-6">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur lors du chargement des bourses</span>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="flex items-center space-x-2 text-red-600 p-6">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur lors du chargement des bourses d'études</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
            Bourses d'études disponibles
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explorez notre base de données complète de bourses d'études et trouvez 
            le financement parfait pour vos études supérieures.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total des bourses"
            value={stats.total.toLocaleString()}
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            title="Bourses actives"
            value={stats.active.toLocaleString()}
            icon={Star}
            color="green"
          />
          <StatCard
            title="Montant total"
            value={`${(stats.totalAmount / 1000000).toFixed(1)}M€`}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Montant moyen"
            value={`${Math.round(stats.averageAmount).toLocaleString()}€`}
            icon={Clock}
            color="orange"
          />
        </div>

        {/* View Mode Toggle and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Découvrez {filteredScholarships.length} bourses
              </h2>
              <p className="text-gray-600">
                Utilisez les filtres pour trouver les opportunités qui correspondent à votre profil
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Cartes</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Grille</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Tableau</span>
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'charts'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Graphiques</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher des bourses par titre, description ou domaine d'études..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-11 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Effacer les filtres
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center mb-4">
                    <Filter className="h-5 w-5 mr-2 text-blue-600" />
                    Filtres avancés
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Affinez votre recherche avec des critères spécifiques
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Niveau d'études
                    </label>
                    <select 
                      value={filters.study_level}
                      onChange={(e) => setFilters(prev => ({ ...prev, study_level: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous niveaux</option>
                      {uniqueOptions.studyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Type de bourse
                    </label>
                    <select 
                      value={filters.scholarship_type}
                      onChange={(e) => setFilters(prev => ({ ...prev, scholarship_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous types</option>
                      {uniqueOptions.scholarshipTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Domaine d'études
                    </label>
                    <select 
                      value={filters.field_of_study}
                      onChange={(e) => setFilters(prev => ({ ...prev, field_of_study: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous domaines</option>
                      {uniqueOptions.fieldsOfStudy.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pays cible
                    </label>
                    <select 
                      value={filters.country}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous pays</option>
                      {uniqueOptions.targetCountries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Institution
                    </label>
                    <select 
                      value={filters.institution_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, institution_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Toutes institutions</option>
                      {institutions?.map(institution => (
                        <option key={institution.id} value={institution.id}>{institution.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Durée
                    </label>
                    <select 
                      value={filters.duration}
                      onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Toutes durées</option>
                      {uniqueOptions.durations.map(duration => {
                        const months = duration.replace(' mois', '')
                        return (
                          <option key={duration} value={months}>{duration}</option>
                        )
                      })}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bourses recommandées
                    </label>
                    <select 
                      value={filters.is_featured}
                      onChange={(e) => setFilters(prev => ({ ...prev, is_featured: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Toutes les bourses</option>
                      <option value="true">Recommandées uniquement</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Montant minimum (€)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.amount_min}
                      onChange={(e) => setFilters(prev => ({ ...prev, amount_min: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Montant maximum (€)
                    </label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={filters.amount_max}
                      onChange={(e) => setFilters(prev => ({ ...prev, amount_max: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date limite à partir de
                    </label>
                    <input
                      type="date"
                      value={filters.deadline_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, deadline_from: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Chargement des bourses...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {filteredScholarships.length}
                </span>
                <span className="text-gray-600">
                  bourse{filteredScholarships.length > 1 ? 's' : ''} sur {stats.total}
                  {hasActiveFilters && ' (filtrées)'}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  )
}
