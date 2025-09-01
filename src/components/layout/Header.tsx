import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  GraduationCap,
  University,
  Globe,
  User,
  FileText,
  BarChart3,
  Bell,
  MessageSquare,
  Heart,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Search
} from 'lucide-react'

interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuCategories = {
  'Bourses & Programmes': {
    icon: GraduationCap,
    color: 'text-blue-600',
    items: [
      { name: 'Toutes les bourses', href: '/scholarships', desc: 'Explorer toutes les bourses disponibles' },
      { name: 'Programmes académiques', href: '/programs', desc: 'Découvrir les programmes d\'enseignement' },
      { name: 'Catégories de programmes', href: '/program-categories', desc: 'Parcourir par domaine d\'enseignement' },
      { name: 'Critères d\'admissibilité', href: '/eligibility-criteria', desc: 'Comprendre les exigences' },
      { name: 'Relations bourses-programmes', href: '/scholarship-programs', desc: 'Liens entre bourses et programmes' }
    ]
  },
  'Institutions & Géographie': {
    icon: University,
    color: 'text-green-600',
    items: [
      { name: 'Institutions', href: '/institutions', desc: 'Universités et établissements' },
      { name: 'Types d\'institutions', href: '/institution-types', desc: 'Catégories d\'institutions' },
      { name: 'Profils d\'institutions', href: '/institution-profiles', desc: 'Détails des institutions' },
      { name: 'Pays', href: '/countries', desc: 'Explorer les destinations' },
      { name: 'Continents', href: '/continents', desc: 'Vue géographique globale' },
      { name: 'Régions', href: '/regions', desc: 'Régions et sous-régions' }
    ]
  },
  'Profils & Utilisateurs': {
    icon: User,
    color: 'text-purple-600',
    items: [
      { name: 'Mon profil', href: '/profile', desc: 'Gestion du profil personnel' },
      { name: 'Profils étudiants', href: '/student-profiles', desc: 'Profils d\'apprentissage' },
      { name: 'Profils utilisateur', href: '/user-profiles', desc: 'Informations utilisateur détaillées' },
      { name: 'Tous les profils', href: '/profiles', desc: 'Base de profils généraux' },
      { name: 'Utilisateurs', href: '/users', desc: 'Gestion des utilisateurs' }
    ]
  },
  'Candidatures & Favoris': {
    icon: FileText,
    color: 'text-orange-600',
    items: [
      { name: 'Mes candidatures', href: '/applications', desc: 'Suivi des candidatures' },
      { name: 'Mes favoris', href: '/favorites', desc: 'Bourses mises en favoris' },
      { name: 'Favoris utilisateur', href: '/user-favorites', desc: 'Système de favoris' },
      { name: 'Notifications', href: '/notifications', desc: 'Alertes et rappels' },
      { name: 'Messagerie', href: '/messages', desc: 'Communications internes' },
      { name: 'Documents', href: '/documents', desc: 'Gestion de documents' }
    ]
  },
  'Données & Analyses': {
    icon: BarChart3,
    color: 'text-indigo-600',
    items: [
      { name: 'Recommandations IA', href: '/ml-recommendations', desc: 'Suggestions personnalisées' },
      { name: 'Bourses recommandées', href: '/ai-recommendations/scholarships', desc: 'Bourses adaptées à votre profil' },
      { name: 'Candidats recommandés', href: '/ai-recommendations/candidates', desc: 'Meilleurs candidats pour vos bourses' },
      { name: 'Historique recommandations', href: '/recommendation-history', desc: 'Suivi des recommandations' },
      { name: 'Tableau de bord', href: '/dashboard', desc: 'Vue d\'ensemble personnalisée' }
    ]
  }
}

function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 w-full bg-white shadow-2xl border-t z-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {Object.entries(menuCategories).map(([categoryName, category]) => {
            const IconComponent = category.icon
            return (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <IconComponent className={`h-5 w-5 ${category.color}`} />
                  <h3 className="font-semibold text-gray-900 text-sm">{categoryName}</h3>
                </div>
                <ul className="space-y-3">
                  {category.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className="block group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-700 transition-colors">
                          {item.desc}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Recherche', href: '/search' },
    { name: 'Tableau de bord', href: '/dashboard', requireAuth: true }
  ]

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="bg-white shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ScholarConnect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              if (item.requireAuth && !user) return null
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
            
            {/* Mega Menu Trigger */}
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              <span>Explorer</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                isMegaMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>
          </nav>

          {/* Search and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Link
              to="/search"
              className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* Notifications (if logged in) */}
            {user && (
              <Link
                to="/notifications"
                className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors"
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge could go here */}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Mon profil
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Tableau de bord
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        Mes favoris
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          signOut()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      <MegaMenu 
        isOpen={isMegaMenuOpen} 
        onClose={() => setIsMegaMenuOpen(false)} 
      />

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              if (item.requireAuth && !user) return null
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Overlay to close mega menu */}
      {isMegaMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={() => setIsMegaMenuOpen(false)}
        />
      )}
    </header>
  )
}
