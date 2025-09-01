import React from 'react'

// Fonction pour convertir le code pays en emoji drapeau
export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return ''
  
  try {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) => 
        String.fromCodePoint(127397 + char.charCodeAt(0))
      )
  } catch {
    return ''
  }
}

// Mapping des codes pays vers leurs noms complets pour les URLs d'images
const countryCodeMap: Record<string, string> = {
  'FR': 'france',
  'US': 'united-states',
  'GB': 'united-kingdom', 
  'DE': 'germany',
  'ES': 'spain',
  'IT': 'italy',
  'CA': 'canada',
  'JP': 'japan',
  'AU': 'australia',
  'BR': 'brazil',
  'CN': 'china',
  'IN': 'india',
  'RU': 'russia',
  'MX': 'mexico',
  'AR': 'argentina',
  'KR': 'south-korea',
  'TR': 'turkey',
  'SA': 'saudi-arabia',
  'EG': 'egypt',
  'ZA': 'south-africa',
  'NG': 'nigeria',
  'KE': 'kenya',
  'GH': 'ghana',
  'MA': 'morocco',
  'TN': 'tunisia',
  'AE': 'united-arab-emirates',
  'QA': 'qatar',
  'KW': 'kuwait',
  'JO': 'jordan',
  'LB': 'lebanon'
}

// Fonction pour obtenir l'URL de l'image du drapeau via l'API flagcdn
const getFlagImageUrl = (countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' = 'w40'): string => {
  if (!countryCode || countryCode.length !== 2) return ''
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`
}

interface CountryFlagProps {
  countryCode?: string
  countryName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  className?: string
  fallbackEmoji?: boolean
}

export default function CountryFlag({ 
  countryCode, 
  countryName, 
  size = 'md',
  showName = false,
  className = '',
  fallbackEmoji = true
}: CountryFlagProps) {
  if (!countryCode && !countryName) return null

  // Dimensions selon la taille
  const dimensions = {
    sm: { width: 16, height: 12, text: 'text-xs', emoji: 'text-sm' },
    md: { width: 20, height: 15, text: 'text-sm', emoji: 'text-base' },
    lg: { width: 24, height: 18, text: 'text-base', emoji: 'text-lg' },
    xl: { width: 32, height: 24, text: 'text-lg', emoji: 'text-xl' }
  }[size]

  const flagSize = size === 'sm' ? 'w20' : size === 'lg' ? 'w80' : size === 'xl' ? 'w160' : 'w40'

  // Essayer d'obtenir le code pays de 2 lettres
  let code = countryCode
  if (!code && countryName) {
    // Essayer de déduire le code pays du nom (mapping inverse)
    const foundEntry = Object.entries(countryCodeMap).find(([_, name]) => 
      name.toLowerCase() === countryName.toLowerCase() ||
      countryName.toLowerCase().includes(name.toLowerCase())
    )
    code = foundEntry?.[0]
  }

  if (!code) {
    return showName && countryName ? (
      <span className={`inline-flex items-center ${className}`}>
        <span className={`text-gray-400 mr-2 ${dimensions.text}`}>🏳️</span>
        <span className={dimensions.text}>{countryName}</span>
      </span>
    ) : null
  }

  const flagEmoji = getFlagEmoji(code)
  const flagImageUrl = getFlagImageUrl(code, flagSize)

  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* Image du drapeau avec fallback vers emoji */}
      <span className="relative inline-block mr-2">
        <img
          src={flagImageUrl}
          alt={`Drapeau ${countryName || code}`}
          width={dimensions.width}
          height={dimensions.height}
          className="rounded-sm border border-gray-200 shadow-sm"
          onError={(e) => {
            if (fallbackEmoji && flagEmoji) {
              // Remplacer l'image par l'emoji en cas d'erreur
              const target = e.target as HTMLImageElement
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `<span class="${dimensions.emoji}">${flagEmoji}</span>`
              }
            } else {
              // Fallback vers icône générique
              const target = e.target as HTMLImageElement
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `<span class="text-gray-400 ${dimensions.emoji}">🏳️</span>`
              }
            }
          }}
        />
      </span>
      
      {/* Nom du pays si demandé */}
      {showName && countryName && (
        <span className={dimensions.text}>{countryName}</span>
      )}
    </span>
  )
}

// Export des fonctions utilitaires
export { getFlagImageUrl, countryCodeMap }