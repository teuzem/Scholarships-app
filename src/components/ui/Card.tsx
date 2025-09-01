import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow hover:shadow-md ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

import { LucideIcon } from 'lucide-react'
import StatCardComponent from './StatCard'

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

export function StatCard(props: StatCardProps) {
  return <StatCardComponent {...props} />
}

export { StatCardComponent }
export default Card