import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { useScholarships } from '@/hooks/useDatabase'
import { Link } from 'react-router-dom'

export default function SearchPage() {
  const { user } = useAuth()
  const { data: scholarships } = useScholarships()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    level: '',
    country: '',
    field: '',
    amount_min: '',
    amount_max: ''
  })

  const filteredScholarships = scholarships?.filter(scholarship => {
    const matchesSearch = scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholarship.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = !filters.level || scholarship.study_level === filters.level
    const matchesField = !filters.field || 
                        scholarship.study_fields?.some(field => 
                          field.toLowerCase().includes(filters.field.toLowerCase())
                        )
    
    return matchesSearch && matchesLevel && matchesField
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Rechercher des bourses
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Utilisez notre moteur de recherche avancé pour trouver les bourses qui correspondent 
          parfaitement à votre profil et vos objectifs académiques.
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, description, institution..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Advanced Filters */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Filtres avancés</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'études
                </label>
                <select 
                  value={filters.level}
                  onChange={(e) => setFilters({...filters, level: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous niveaux</option>
                  <option value="Bachelor">Licence</option>
                  <option value="Master">Master</option>
                  <option value="PhD">Doctorat</option>
                  <option value="Postdoc">Post-doctorat</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays de destination
                </label>
                <input
                  type="text"
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                  placeholder="Ex: France, Canada..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine d'études
                </label>
                <input
                  type="text"
                  value={filters.field}
                  onChange={(e) => setFilters({...filters, field: e.target.value})}
                  placeholder="Ex: Ingénierie, Médecine..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant minimum
                </label>
                <input
                  type="number"
                  value={filters.amount_min}
                  onChange={(e) => setFilters({...filters, amount_min: e.target.value})}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant maximum
                </label>
                <input
                  type="number"
                  value={filters.amount_max}
                  onChange={(e) => setFilters({...filters, amount_max: e.target.value})}
                  placeholder="Illimité"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Résultats de recherche
          </h2>
          <div className="text-gray-600">
            {filteredScholarships?.length || 0} bourse{(filteredScholarships?.length || 0) > 1 ? 's' : ''} trouvé{(filteredScholarships?.length || 0) > 1 ? 'es' : 'e'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships?.map((scholarship) => (
            <Card key={scholarship.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {scholarship.title}
                  </h3>
                  {scholarship.amount && (
                    <div className="text-sm font-medium text-green-600 ml-2">
                      {scholarship.amount.toLocaleString()} {scholarship.currency || 'EUR'}
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-3">
                  {scholarship.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {scholarship.study_level && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {scholarship.study_level}
                    </span>
                  )}
                  {scholarship.study_fields?.slice(0, 2).map((field, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {field}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Deadline: {new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}
                  </div>
                  <Link to={`/scholarship/${scholarship.id}`}>
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Détails
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredScholarships?.length === 0 && (
          <Card className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche ou explorez toutes nos bourses.
            </p>
            <Link to="/scholarships" className="mt-4 inline-block">
              <Button variant="primary">
                Voir toutes les bourses
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
