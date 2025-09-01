import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Award,
  MapPin,
  Settings,
  Plus,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  BarChart3,
  PieChart,
  Download,
  Send,
  Bell,
  Target,
  Globe,
  Mail,
  Phone
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// Types
interface ScholarshipData {
  id: string
  title: string
  amount: number
  application_deadline: string
  is_active: boolean
  created_at: string
  applications_count?: number
}

interface ApplicationData {
  id: string
  student_id: string
  scholarship_id: string
  status: string
  application_data?: any
  notes?: string
  reviewed_at?: string
  submitted_at?: string
  updated_at: string
  created_at: string
  scholarships?: any
  profiles?: any
}

interface InstitutionStats {
  totalScholarships: number
  activeScholarships: number
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  totalFunding: number
  avgApplicationsPerScholarship: number
  successRate: number
}

export default function InstitutionDashboard() {
  const { user, profile, institutionProfile } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InstitutionStats>({
    totalScholarships: 0,
    activeScholarships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalFunding: 0,
    avgApplicationsPerScholarship: 0,
    successRate: 0
  })
  const [recentScholarships, setRecentScholarships] = useState<ScholarshipData[]>([])
  const [recentApplications, setRecentApplications] = useState<ApplicationData[]>([])
  const [topPerformingScholarships, setTopPerformingScholarships] = useState<ScholarshipData[]>([])

  useEffect(() => {
    if (user && profile && profile.user_type === 'institution') {
      loadDashboardData()
    }
  }, [user, profile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadScholarshipsData(),
        loadApplicationsData(),
        loadPerformanceData()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadScholarshipsData = async () => {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('institution_id', user?.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRecentScholarships(data.slice(0, 5))
        
        const totalScholarships = data.length
        const activeScholarships = data.filter(s => s.is_active).length
        const totalFunding = data.reduce((sum, s) => sum + (s.amount || 0), 0)
        
        setStats(prev => ({
          ...prev,
          totalScholarships,
          activeScholarships,
          totalFunding
        }))
      }
    } catch (error) {
      console.error('Error loading scholarships:', error)
    }
  }

  const loadApplicationsData = async () => {
    try {
      // Get all applications for this institution's scholarships
      const { data: scholarships, error: scholarshipsError } = await supabase
        .from('scholarships')
        .select('id')
        .eq('institution_id', user?.id)

      if (scholarshipsError || !scholarships) {
        throw scholarshipsError
      }

      const scholarshipIds = scholarships.map(s => s.id)
      
      if (scholarshipIds.length === 0) {
        return
      }

      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          scholarships(title, amount),
          profiles(full_name, email)
        `)
        .in('scholarship_id', scholarshipIds)
        .order('created_at', { ascending: false })

      if (!applicationsError && applications) {
        setRecentApplications(applications.slice(0, 5))
        
        // Calculate application stats
        const totalApplications = applications.length
        const pendingApplications = applications.filter(app => app.status === 'pending' || app.status === 'under_review').length
        const acceptedApplications = applications.filter(app => app.status === 'accepted').length
        const rejectedApplications = applications.filter(app => app.status === 'rejected').length
        const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
        const avgApplicationsPerScholarship = stats.totalScholarships > 0 ? totalApplications / stats.totalScholarships : 0
        
        setStats(prev => ({
          ...prev,
          totalApplications,
          pendingApplications,
          acceptedApplications,
          rejectedApplications,
          successRate,
          avgApplicationsPerScholarship
        }))
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const loadPerformanceData = async () => {
    try {
      // Get scholarships with application counts
      const { data, error } = await supabase
        .from('scholarships')
        .select(`
          *,
          applications(*)
        `)
        .eq('institution_id', user?.id)
        .eq('is_active', true)
        .limit(5)

      if (!error && data) {
        // Sort by application count
        const sorted = data.sort((a, b) => {
          const aCount = a.applications?.length || 0
          const bCount = b.applications?.length || 0
          return bCount - aCount
        })
        
        setTopPerformingScholarships(sorted)
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      await invokeEdgeFunction('application-manager', {
        action: 'update_status',
        applicationId,
        statusUpdate: {
          status: newStatus,
          reviewer_notes: notes
        }
      })
      
      toast.success('Statut mis à jour avec succès')
      await loadApplicationsData()
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Erreur lors de la mise à jour')
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
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
              Tableau de bord - {institutionProfile?.institution_name || profile?.full_name} 🏢
            </h1>
            <p className="text-blue-100">
              Gestion de vos programmes de bourses et candidatures
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Total des fonds</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalFunding)}</p>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bourses actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeScholarships}</p>
              <p className="text-xs text-gray-500">sur {stats.totalScholarships} total</p>
            </div>
            <Award className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Candidatures reçues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              <p className="text-xs text-gray-500">{stats.pendingApplications} en attente</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux d'acceptation</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{stats.acceptedApplications} acceptées</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-xs text-gray-500">non lues</p>
            </div>
            <Bell className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Candidatures récentes
            </h2>
            <Link to="/applications">
              <Button variant="outline" size="sm">
                Voir tout
                <Eye className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <div key={application.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {application.profiles?.full_name || 'Candidat anonyme'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {application.scholarships?.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(application.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                      {application.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            className="p-1 h-6 w-6"
                          >
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="p-1 h-6 w-6"
                          >
                            <XCircle className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucune candidature reçue pour le moment</p>
                <Link to="/scholarships/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une bourse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Scholarship Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Mes bourses
            </h2>
            <Link to="/scholarships/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nouvelle bourse
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentScholarships.slice(0, 4).map((scholarship) => (
              <div key={scholarship.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {scholarship.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(scholarship.amount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scholarship.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scholarship.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {formatDate(scholarship.application_deadline)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/scholarship/${scholarship.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Link to={`/scholarship/${scholarship.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {recentScholarships.length === 0 && (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucune bourse créée pour le moment</p>
                <Link to="/scholarships/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ma première bourse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Analytics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Analytics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Bourses les plus populaires
            </h2>
          </div>
          
          <div className="space-y-3">
            {topPerformingScholarships.map((scholarship, index) => {
              const applicationsCount = scholarship.applications_count || 0
              return (
                <div key={scholarship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{scholarship.title}</h3>
                      <p className="text-sm text-gray-600">{formatCurrency(scholarship.amount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{applicationsCount}</p>
                    <p className="text-xs text-gray-500">candidatures</p>
                  </div>
                </div>
              )
            })}
            
            {topPerformingScholarships.length === 0 && (
              <div className="text-center py-6">
                <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune donnée de performance disponible</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions & Institution Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link to="/ai-recommendations/candidates">
              <Button className="w-full" variant="primary">
                <Users className="w-4 h-4 mr-2" />
                Candidats IA
              </Button>
            </Link>
            
            <Link to="/applications">
              <Button className="w-full" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Candidatures
              </Button>
            </Link>
            
            <Link to="/scholarships/create">
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle bourse
              </Button>
            </Link>
            
            <Link to="/profile">
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
            </Link>
          </div>

          {/* Institution Profile Summary */}
          {institutionProfile && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Profil institution</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{institutionProfile.institution_type}</span>
                </div>
                {institutionProfile.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{institutionProfile.country}</span>
                  </div>
                )}
                {institutionProfile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <a 
                      href={institutionProfile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Site web
                    </a>
                  </div>
                )}
                {institutionProfile.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{institutionProfile.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
