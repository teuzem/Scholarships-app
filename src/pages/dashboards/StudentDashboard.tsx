import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  GraduationCap, 
  FileText, 
  Heart, 
  Bell, 
  Search, 
  TrendingUp,
  Calendar,
  Award,
  MapPin,
  User,
  BookOpen,
  Target,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Filter
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// Types
interface Application {
  id: string
  scholarship_id: string
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
  created_at: string
  scholarship?: any
}

interface Scholarship {
  id: string
  title: string
  amount: number
  application_deadline: string
  description: string
  country?: string
  institution_name?: string
  deadline?: string
}

interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  savedScholarships: number
  unreadNotifications: number
  profileCompletion: number
}

export default function StudentDashboard() {
  const { user, profile, studentProfile } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    savedScholarships: 0,
    unreadNotifications: 0,
    profileCompletion: 0
  })
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [recommendedScholarships, setRecommendedScholarships] = useState<Scholarship[]>([])
  const [deadlineAlerts, setDeadlineAlerts] = useState<Scholarship[]>([])

  useEffect(() => {
    if (user && profile) {
      loadDashboardData()
    }
  }, [user, profile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadApplicationsData(),
        loadSavedScholarships(),
        loadRecommendedScholarships(),
        loadDeadlineAlerts(),
        calculateProfileCompletion()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadApplicationsData = async () => {
    try {
      const response = await invokeEdgeFunction('application-manager', {
        action: 'get_applications'
      })

      if (response.data) {
        const applications = response.data
        setRecentApplications(applications.slice(0, 5))
        
        // Calculate stats
        const pending = applications.filter(app => app.status === 'pending' || app.status === 'under_review').length
        const accepted = applications.filter(app => app.status === 'accepted').length
        const rejected = applications.filter(app => app.status === 'rejected').length
        
        setStats(prev => ({
          ...prev,
          totalApplications: applications.length,
          pendingApplications: pending,
          acceptedApplications: accepted,
          rejectedApplications: rejected
        }))
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const loadSavedScholarships = async () => {
    try {
      // Using any to bypass TypeScript inference issues
      const result: any = await (supabase as any)
        .from('favorites')
        .select('id')
        .eq('student_id', user?.id)

      if (!result.error && result.data) {
        setStats(prev => ({
          ...prev,
          savedScholarships: result.data.length
        }))
      }
    } catch (error) {
      console.error('Error loading saved scholarships:', error)
    }
  }

  const loadRecommendedScholarships = async () => {
    try {
      // Get recommendations based on student profile
      const { data, error } = await supabase
        .from('scholarships')
        .select('id, title, amount, application_deadline, description')
        .eq('is_active', true)
        .gte('application_deadline', new Date().toISOString())
        .limit(6)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRecommendedScholarships(data)
      }
    } catch (error) {
      console.error('Error loading recommended scholarships:', error)
    }
  }

  const loadDeadlineAlerts = async () => {
    try {
      // Get scholarships with deadlines in the next 30 days
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data, error } = await supabase
        .from('scholarships')
        .select('id, title, amount, application_deadline, description')
        .eq('is_active', true)
        .gte('application_deadline', new Date().toISOString())
        .lte('application_deadline', thirtyDaysFromNow.toISOString())
        .limit(5)
        .order('application_deadline', { ascending: true })

      if (!error && data) {
        setDeadlineAlerts(data)
      }
    } catch (error) {
      console.error('Error loading deadline alerts:', error)
    }
  }

  const calculateProfileCompletion = () => {
    let completionScore = 0
    const maxScore = 100

    // Basic profile info (30 points)
    if (profile?.full_name) completionScore += 10
    if (profile?.email) completionScore += 10
    if (profile?.phone) completionScore += 5
    if (profile?.bio) completionScore += 5

    // Student-specific info (70 points)
    if (studentProfile) {
      if (studentProfile.field_of_study) completionScore += 15
      if (studentProfile.current_education_level) completionScore += 10
      if (studentProfile.gpa) completionScore += 10
      if (studentProfile.languages && studentProfile.languages.length > 0) completionScore += 10
      if (studentProfile.preferred_study_countries && studentProfile.preferred_study_countries.length > 0) completionScore += 10
      if (studentProfile.career_goals) completionScore += 10
      if (studentProfile.academic_achievements && studentProfile.academic_achievements.length > 0) completionScore += 5
    }

    setStats(prev => ({
      ...prev,
      profileCompletion: Math.min(completionScore, maxScore),
      unreadNotifications: unreadCount
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'under_review':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Acceptée'
      case 'rejected':
        return 'Refusée'
      case 'under_review':
        return 'En examen'
      default:
        return 'En attente'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Bonjour, {profile?.full_name?.split(' ')[0] || 'Étudiant'} 🎓
            </h1>
            <p className="text-blue-100">
              Voici un aperçu de vos activités et opportunités
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Profil complet à</p>
            <p className="text-2xl font-bold">{stats.profileCompletion}%</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Candidatures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bourses sauvegardées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.savedScholarships}</p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acceptées</p>
              <p className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
            </div>
            <Bell className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Candidatures récentes
            </h2>
            <Link to="/applications">
              <Button variant="outline" size="sm">
                Voir tout
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {application.scholarship?.title || 'Bourse inconnue'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(application.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(application.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(application.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucune candidature pour le moment</p>
                <Link to="/scholarships">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Postuler à une bourse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Recommended Scholarships */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Bourses recommandées
            </h2>
            <Link to="/search">
              <Button variant="outline" size="sm">
                Rechercher
                <Search className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recommendedScholarships.slice(0, 3).map((scholarship) => (
              <div key={scholarship.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {scholarship.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {formatCurrency(scholarship.amount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {scholarship.country}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {formatDate(scholarship.application_deadline)}
                    </p>
                  </div>
                  <Link to={`/scholarship/${scholarship.id}`}>
                    <Button size="sm" variant="outline">
                      Détails
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {recommendedScholarships.length === 0 && (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Complétez votre profil pour recevoir des recommandations personnalisées</p>
                <Link to="/profile">
                  <Button>
                    <User className="w-4 h-4 mr-2" />
                    Compléter mon profil
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Deadline Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadline Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Deadlines proches
            </h2>
          </div>
          
          <div className="space-y-3">
            {deadlineAlerts.map((scholarship) => {
              const daysLeft = getDaysUntilDeadline(scholarship.application_deadline)
              return (
                <div key={scholarship.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {scholarship.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {scholarship.institution_name || 'Institution'} • {scholarship.country || 'Pays non spécifié'}
                      </p>
                      <p className="text-xs font-medium text-orange-700">
                        {daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Deadline passée'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(scholarship.amount)}
                      </p>
                      <Link to={`/scholarship/${scholarship.id}`}>
                        <Button size="sm" variant="outline" className="mt-1">
                          Postuler
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {deadlineAlerts.length === 0 && (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune deadline imminente</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/ai-recommendations/scholarships">
              <Button className="w-full" variant="primary">
                <Award className="w-4 h-4 mr-2" />
                Bourses IA
              </Button>
            </Link>
            
            <Link to="/search">
              <Button className="w-full" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </Link>
            
            <Link to="/favorites">
              <Button className="w-full" variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Mes favoris
              </Button>
            </Link>
            
            <Link to="/applications">
              <Button className="w-full" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Candidatures
              </Button>
            </Link>
          </div>

          {/* Profile Completion Progress */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-900">Profil étudiant</h3>
              <span className="text-sm text-blue-700">{stats.profileCompletion}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.profileCompletion}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700">
              {stats.profileCompletion < 100 
                ? 'Complétez votre profil pour de meilleures recommandations'
                : 'Profil complet ! Vous recevrez les meilleures recommandations.'
              }
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
