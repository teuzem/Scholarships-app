import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Filter, X, Search, Calendar } from 'lucide-react'
import { useRealtimeCounts } from '@/hooks/useRealtimeSubscription'

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterField {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'range' | 'date' | 'search'
  options?: FilterOption[]
  min?: number
  max?: number
  placeholder?: string
}

interface AdvancedFiltersProps {
  fields: FilterField[]
  values: Record<string, any>
  onChange: (filters: Record<string, any>) => void
  onApply?: () => void
  onReset?: () => void
  tableName?: string
  className?: string
  showCounts?: boolean
}

export default function AdvancedFilters({
  fields,
  values,
  onChange,
  onApply,
  onReset,
  tableName,
  className = '',
  showCounts = true
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0)
  
  const { counts } = useRealtimeCounts(tableName || 'scholarships', values)

  useEffect(() => {
    const activeFilters = Object.values(values).filter(v => 
      v !== undefined && v !== null && v !== '' && 
      !(Array.isArray(v) && v.length === 0)
    ).length
    setAppliedFiltersCount(activeFilters)
  }, [values])

  const handleFieldChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value })
  }

  const handleReset = () => {
    const resetValues = Object.keys(values).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {} as Record<string, any>)
    onChange(resetValues)
    onReset?.()
  }

  const renderField = (field: FilterField) => {
    const value = values[field.key] || ''

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Tous</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {showCounts && option.count ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            <select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value)
                handleFieldChange(field.key, selectedValues)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-h-[120px]"
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} {showCounts && option.count ? `(${option.count})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Maintenez Ctrl/Cmd pour sélectionner plusieurs options</p>
          </div>
        )

      case 'range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={`Min (${field.min || 0})`}
              value={value.min || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, min: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder={`Max (${field.max || '∞'})`}
              value={value.max || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, max: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )

      case 'date':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value.start || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, start: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={value.end || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, end: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )

      case 'search':
      default:
        return (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={field.placeholder || `Rechercher...`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )
    }
  }

  return (
    <Card className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filtres avancés</h3>
            {appliedFiltersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {appliedFiltersCount} actif{appliedFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showCounts && tableName && (
              <div className="text-sm text-gray-500">
                {counts.total.toLocaleString()} résultats
                {counts.new > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    +{counts.new} nouveaux
                  </span>
                )}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        {isExpanded && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleReset}
                icon={X}
                disabled={appliedFiltersCount === 0}
              >
                Réinitialiser
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="primary"
                  onClick={onApply}
                >
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}