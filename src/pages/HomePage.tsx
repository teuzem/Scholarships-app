import React from 'react'
import { Link } from 'react-router-dom'
import { Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  useScholarships, 
  useInstitutions, 
  useCountries, 
  useAcademicPrograms 
} from '@/hooks/useDatabase'
import {
  GraduationCap,
  University,
  Globe,
  BookOpen,
  ArrowRight,
  Star,
  Clock,
  Users,
  Search
} from 'lucide-react'

export default function HomePage() {
  const { data: scholarships, isLoading: scholarshipsLoading } = useScholarships()
  const { data: institutions, isLoading: institutionsLoading } = useInstitutions()
  const { data: countries, isLoading: countriesLoading } = useCountries()
  const { data: programs, isLoading: programsLoading } = useAcademicPrograms()

  const featuredScholarships = scholarships?.filter(s => s.is_featured)?.slice(0, 3) || []
  const recentScholarships = scholarships?.slice(0, 6) || []

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Découvrez votre prochaine
              <span className="block text-yellow-300">opportunité éducative</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Accédez à des milliers de bourses d'études dans le monde entier et trouvez 
              le financement parfait pour vos études supérieures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/search">
                <Button 
                  size="lg" 
                  variant="primary" 
                  icon={Search}
                  className="bg-white text-blue-600 hover:bg-gray-50 w-full"
                >
                  Rechercher des bourses
                </Button>
              </Link>
              <Link to="/institutions">
                <Button 
                  size="lg" 
                  variant="outline" 
                  icon={ArrowRight}
                  className="border-white text-white hover:bg-white hover:text-blue-600 w-full"
                >
                  Explorer les institutions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Bourses disponibles"
            value={scholarshipsLoading ? '...' : scholarships?.length || 0}
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            title="Institutions partenaires"
            value={institutionsLoading ? '...' : institutions?.length || 0}
            icon={University}
            color="green"
          />
          <StatCard
            title="Pays couverts"
            value={countriesLoading ? '...' : countries?.length || 0}
            icon={Globe}
            color="purple"
          />
          <StatCard
            title="Programmes éducatifs"
            value={programsLoading ? '...' : programs?.length || 0}
            icon={BookOpen}
            color="orange"
          />
        </div>
      </section>

      {/* Featured Scholarships */}
      {featuredScholarships.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bourses à la une
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez nos opportunités les plus populaires et les mieux notées
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredScholarships.map((scholarship) => (
              <Card key={scholarship.id} className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-yellow-600">Recommandée</span>
                    </div>
                    {scholarship.amount && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {scholarship.amount.toLocaleString()} {scholarship.currency || 'EUR'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {scholarship.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 flex-grow">
                    {scholarship.description.substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Deadline: {new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/scholarship/${scholarship.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Voir les détails
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Scholarships */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bourses récentes
            </h2>
            <p className="text-lg text-gray-600">
              Les dernières opportunités ajoutées à notre plateforme
            </p>
          </div>
          <Link 
            to="/scholarships"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir toutes les bourses
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentScholarships.map((scholarship) => (
            <Card key={scholarship.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {scholarship.title}
                  </h3>
                  {scholarship.amount && (
                    <div className="text-sm font-medium text-green-600">
                      {scholarship.amount.toLocaleString()} {scholarship.currency || 'EUR'}
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm">
                  {scholarship.description.substring(0, 120)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(scholarship.application_deadline).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {scholarship.study_level && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {scholarship.study_level}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/scholarship/${scholarship.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Access */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Accès rapide
            </h2>
            <p className="text-lg text-gray-600">
              Explorez nos différentes catégories pour trouver ce qui vous intéresse
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {
              [
                { 
                  title: 'Institutions', 
                  desc: 'Universités et écoles', 
                  icon: University, 
                  href: '/institutions',
                  color: 'bg-blue-500'
                },
                { 
                  title: 'Pays', 
                  desc: 'Destinations d\'études', 
                  icon: Globe, 
                  href: '/countries',
                  color: 'bg-green-500'
                },
                { 
                  title: 'Programmes', 
                  desc: 'Domaines d\'études', 
                  icon: BookOpen, 
                  href: '/programs',
                  color: 'bg-purple-500'
                },
                { 
                  title: 'Profils', 
                  desc: 'Gestion de compte', 
                  icon: Users, 
                  href: '/profile',
                  color: 'bg-orange-500'
                }
              ].map((item) => {
                const IconComponent = item.icon
                return (
                  <Link key={item.href} to={item.href}>
                    <Card className="text-center h-full">
                      <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.desc}
                      </p>
                    </Card>
                  </Link>
                )
              })
            }
          </div>
        </div>
      </section>
    </div>
  )
}
