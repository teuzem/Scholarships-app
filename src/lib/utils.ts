import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateShort(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR')
}

export function getCountryFlag(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return ''
  
  return countryCode
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(127397 + char.charCodeAt(0))
    )
}

export function truncateText(text: string, maxLength: number = 100) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function calculateDaysUntil(date: string | Date) {
  const targetDate = new Date(date)
  const today = new Date()
  const timeDiff = targetDate.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'accepted':
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'pending':
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
    case 'declined':
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateMockData() {
  // Mock data for charts when real data is not available
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
  const countries = ['France', 'Allemagne', 'Royaume-Uni', 'Espagne', 'Italie']
  const institutions = ['Sorbonne', 'Cambridge', 'Oxford', 'MIT', 'Stanford']
  
  return {
    scholarshipTrends: months.map(month => ({
      month,
      count: Math.floor(Math.random() * 100) + 50
    })),
    
    scholarshipsByCountry: countries.map(name => ({
      name,
      count: Math.floor(Math.random() * 200) + 100
    })),
    
    applicationStatus: [
      { name: 'En attente', value: Math.floor(Math.random() * 20) + 10 },
      { name: 'Approuvées', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'Rejetées', value: Math.floor(Math.random() * 10) + 2 }
    ],
    
    topInstitutions: institutions.map(name => ({
      name,
      scholarships: Math.floor(Math.random() * 50) + 20
    })),
    
    recentActivity: Array.from({ length: 7 }, (_, i) => ({
      day: `J-${7-i}`,
      applications: Math.floor(Math.random() * 10) + 1,
      favorites: Math.floor(Math.random() * 15) + 1
    }))
  }
}