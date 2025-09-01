import React from 'react'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  onClick?: () => void
  className?: string
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600 bg-blue-100',
    card: 'border-blue-200 hover:border-blue-300',
    trend: 'text-blue-600'
  },
  green: {
    icon: 'text-green-600 bg-green-100',
    card: 'border-green-200 hover:border-green-300',
    trend: 'text-green-600'
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100',
    card: 'border-purple-200 hover:border-purple-300',
    trend: 'text-purple-600'
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100',
    card: 'border-orange-200 hover:border-orange-300',
    trend: 'text-orange-600'
  },
  red: {
    icon: 'text-red-600 bg-red-100',
    card: 'border-red-200 hover:border-red-300',
    trend: 'text-red-600'
  },
  gray: {
    icon: 'text-gray-600 bg-gray-100',
    card: 'border-gray-200 hover:border-gray-300',
    trend: 'text-gray-600'
  }
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  subtitle,
  onClick,
  className = ''
}: StatCardProps) {
  const colors = colorClasses[color]
  
  const TrendIcon = trend ? (
    trend.isPositive ? TrendingUp : trend.value === 0 ? Minus : TrendingDown
  ) : null

  return (
    <div 
      className={`
        bg-white rounded-xl border-2 p-6 transition-all duration-200
        ${colors.card}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className={`p-2 rounded-lg ${colors.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
            
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            
            {trend && (
              <div className={`flex items-center mt-2 ${colors.trend}`}>
                {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  vs période précédente
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { StatCard }