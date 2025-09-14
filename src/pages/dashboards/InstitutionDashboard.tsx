import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { 
  useScholarships, 
  useApplications, 
  useInstitutions,
  useCountries,
  useAnalyticsEvents 
} from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Chart from '@/components/ui/Charts'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
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
  Phone,
  MessageSquare,
  UserCheck,
  UserX,
  Zap,
  TrendingDown,
  Activity,
  Search,
  RefreshCw,
  Archive,
  Star,
  BookOpen,
  GraduationCap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { Tables } from '@/types/supabase'

type Scholarship = Tables<'scholarships'>
type Application = Tables<'applications'>

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
  monthlyApplications: number
  weeklyViews: number
  conversionRate: number
}

interface ScholarshipPerformance {
  scholarship: Scholarship
  applicationsCount: number
  acceptedCount: number
  rejectedCount: number
  pendingCount: number
  viewCount: number
  conversionRate: number
  avgProcessingTime: number
}

export default function InstitutionDashboard() {
  const { user, profile, institutionProfile } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedView, setSelectedView] = useState<'overview' | 'scholarships' | 'applications' | 'analytics'>('overview')
  
  // États pour les données
  const [stats, setStats] = useState<InstitutionStats>({
    totalScholarships: 0,
    activeScholarships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalFunding: 0,
    avgApplicationsPerScholarship: 0,
    successRate: 0,
    monthlyApplications: 0,
    weeklyViews: 0,
    conversionRate: 0
  })
  
  const [institutionScholarships, setInstitutionScholarships] = useState<Scholarship[]>([])
  const [institutionApplications, setInstitutionApplications] = useState<ApplicationWithRelationsForDashboard[]>([])
  const [scholarshipPerformance, setScholarshipPerformance] = useState<ScholarshipPerformance[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Hooks pour les données en temps réel
  const { data: allScholarships, refetch: refetchScholarships } = useScholarships()
  const { data: allApplications, refetch: refetchApplications } = useApplications()
  const { data: analyticsEvents } = useAnalyticsEvents()

  // Synchronisation temps réel
  const { isConnected: scholarshipsConnected } = useRealtimeSubscription({
    table: 'scholarships',
    filter: `institution_id=eq.${user?.id}`,
    onChange: () => {
      setLastUpdate(new Date())
      loadInstitutionData()
    }
  })

  const { isConnected: applicationsConnected } = useRealtimeSubscription({
    table: 'applications',
    onChange: () => {
      setLastUpdate(new Date())
      loadApplicationsData()
    }
  })

  const isConnected = scholarshipsConnected && applicationsConnected

  useEffect(() => {
    if (user && profile && profile.user_type === 'institution') {
      loadDashboardData()
    }
  }, [user, profile, selectedTimeframe])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadInstitutionData(),
        loadApplicationsData(),
        loadPerformanceData(),
        loadAnalyticsData()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadInstitutionData = async () => {
    try {
      const { data: scholarships, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('institution_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInstitutionScholarships(scholarships || [])
      
      const totalScholarships = scholarships?.length || 0
      const activeScholarships = scholarships?.filter(s => s.is_active).length || 0
      const totalFunding = scholarships?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0
      
      setStats(prev => ({
        ...prev,
        totalScholarships,
        activeScholarships,
        totalFunding
      }))
    } catch (error) {
      console.error('Error loading institution data:', error)
    }
  }

  const loadApplicationsData = async () => {
    try {
      // Récupérer toutes les candidatures pour les bourses de cette institution
      const { data: scholarshipIds } = await supabase
        .from('scholarships')
        .select('id')
        .eq('institution_id', user?.id)

      if (!scholarshipIds || scholarshipIds.length === 0) {
        setInstitutionApplications([])
        return
      }

      const ids = scholarshipIds.map(s => s.id)
      
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          scholarships!inner(title, amount, application_deadline),
          profiles!inner(full_name, email, phone)
        `)
        .in('scholarship_id', ids)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInstitutionApplications(applications as ApplicationWithRelationsForDashboard[] || [])
      
      // Calculer les statistiques des candidatures
      const totalApplications = applications?.length || 0
      const pendingApplications = applications?.filter(app => 
        app.status === 'pending' || app.status === 'under_review'
      ).length || 0
      const acceptedApplications = applications?.filter(app => app.status === 'accepted').length || 0
      const rejectedApplications = applications?.filter(app => app.status === 'rejected').length || 0
      const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
      const avgApplicationsPerScholarship = stats.totalScholarships > 0 ? totalApplications / stats.totalScholarships : 0
      
      // Calculer les candidatures du mois
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      const monthlyApplications = applications?.filter(app => 
        new Date(app.created_at!) > oneMonthAgo
      ).length || 0

      setStats(prev => ({
        ...prev,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        successRate,
        avgApplicationsPerScholarship,
        monthlyApplications
      }))
    } catch (error) {
      console.error('Error loading applications data:', error)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const performance: ScholarshipPerformance[] = []
      
      for (const scholarship of institutionScholarships) {
        const applications = institutionApplications.filter(app => app.scholarship_id === scholarship.id)
        const acceptedCount = applications.filter(app => app.status === 'accepted').length
        const rejectedCount = applications.filter(app => app.status === 'rejected').length
        const pendingCount = applications.filter(app => 
          app.status === 'pending' || app.status === 'under_review'
        ).length
        
        // Calculer le temps de traitement moyen
        const processedApps = applications.filter(app => app.reviewed_at)
        const avgProcessingTime = processedApps.length > 0 
          ? processedApps.reduce((sum, app) => {
              const submitted = new Date(app.submitted_at || app.created_at!)
              const reviewed = new Date(app.reviewed_at!)
              return sum + (reviewed.getTime() - submitted.getTime())
            }, 0) / processedApps.length / (1000 * 60 * 60 * 24) // en jours
          : 0

        performance.push({
          scholarship,
          applicationsCount: applications.length,
          acceptedCount,
          rejectedCount,
          pendingCount,
          viewCount: scholarship.view_count || 0,
          conversionRate: scholarship.view_count ? (applications.length / scholarship.view_count) * 100 : 0,
          avgProcessingTime
        })
      }
      
      setScholarshipPerformance(performance.sort((a, b) => b.applicationsCount - a.applicationsCount))
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      // Charger les événements d'analyse pour cette institution
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', getTimeframeDate(selectedTimeframe))
        .order('created_at', { ascending: false })

      // Calculer les vues hebdomadaires
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const weeklyViews = events?.filter(e => 
        e.event_type === 'scholarship_view' && new Date(e.created_at!) > oneWeekAgo
      ).length || 0

      // Calculer le taux de conversion
      const totalViews = events?.filter(e => e.event_type === 'scholarship_view').length || 0
      const conversionRate = totalViews > 0 ? (stats.totalApplications / totalViews) * 100 : 0

      setStats(prev => ({
        ...prev,
        weeklyViews,
        conversionRate
      }))

      // Activité récente
      const activity = events?.slice(0, 10).map(event => ({
        id: event.id,
        type: event.event_type,
        description: getEventDescription(event),
        timestamp: event.created_at,
        metadata: event.event_data
      })) || []

      setRecentActivity(activity)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
  }

  const getTimeframeDate = (timeframe: string): string => {
    const date = new Date()
    switch (timeframe) {
      case '7d':
        date.setDate(date.getDate() - 7)
        break
      case '30d':
        date.setDate(date.getDate() - 30)
        break
      case '90d':
        date.setDate(date.getDate() - 90)
        break
      case '1y':
        date.setFullYear(date.getFullYear() - 1)
        break
    }
    return date.toISOString()
  }

  const getEventDescription = (event: any): string => {
    switch (event.event_type) {
      case 'scholarship_view':
        return 'Bourse consultée'
      case 'application_submitted':
        return 'Nouvelle candidature'
      case 'application_reviewed':
        return 'Candidature examinée'
      case 'scholarship_created':
        return 'Bourse créée'
      case 'scholarship_updated':
        return 'Bourse mise à jour'
      default:
        return event.event_type
    }
  }

  // Workflows pour la gestion des candidatures
  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          notes: notes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error

      // Créer une notification pour l'étudiant
      const application = institutionApplications.find(app => app.id === applicationId)
      if (application) {
        await createNotificationForStudent(application, newStatus)
      }

      toast.success('Statut mis à jour avec succès')
      await loadApplicationsData()
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const createNotificationForStudent = async (application: any, status: string) => {
    try {
      const notificationData = {
        user_id: application.student_id,
        title: `Mise à jour de votre candidature`,
        message: `Votre candidature pour "${application.scholarships?.title}" a été ${
          status === 'accepted' ? 'acceptée' : 
          status === 'rejected' ? 'refusée' : 
          'mise à jour'
        }.`,
        type: 'application_status',
        priority: status === 'accepted' ? 'high' : 'medium',
        related_application_id: application.id,
        related_scholarship_id: application.scholarship_id
      }

      await supabase.from('notifications').insert(notificationData)
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  const sendBulkNotifications = async (applicationIds: string[], message: string) => {
    try {
      const notifications = applicationIds.map(appId => {
        const application = institutionApplications.find(app => app.id === appId)
        return {
          user_id: application?.student_id,
          title: 'Message de votre institution',
          message: message,
          type: 'institution_message',
          priority: 'medium',
          related_application_id: appId
        }
      }).filter(n => n.user_id)

      await supabase.from('notifications').insert(notifications)
      toast.success(`${notifications.length} notifications envoyées`)
    } catch (error) {
      console.error('Error sending bulk notifications:', error)
      toast.error('Erreur lors de l\'envoi des notifications')
    }
  }

  const publishScholarshipResults = async (scholarshipId: string) => {
    try {
      const applications = institutionApplications.filter(app => app.scholarship_id === scholarshipId)
      const acceptedApps = applications.filter(app => app.status === 'accepted')
      const rejectedApps = applications.filter(app => app.status === 'rejected')

      // Envoyer des notifications aux candidats acceptés
      for (const app of acceptedApps) {
        await supabase.from('notifications').insert({
          user_id: app.student_id,
          title: '🎉 Félicitations ! Candidature acceptée',
          message: `Votre candidature pour "${app.scholarships?.title}" a été acceptée. Consultez votre espace pour les prochaines étapes.`,
          type: 'application_accepted',
          priority: 'high',
          related_application_id: app.id,
          related_scholarship_id: scholarshipId,
          action_url: `/applications/${app.id}`
        })
      }

      // Envoyer des notifications aux candidats refusés
      for (const app of rejectedApps) {
        await supabase.from('notifications').insert({
          user_id: app.student_id,
          title: 'Résultat de votre candidature',
          message: `Nous vous remercions pour votre candidature à "${app.scholarships?.title}". Malheureusement, nous ne pouvons pas donner suite à votre demande cette fois-ci.`,
          type: 'application_rejected',
          priority: 'medium',
          related_application_id: app.id,
          related_scholarship_id: scholarshipId
        })
      }

      toast.success(`Résultats publiés : ${acceptedApps.length} acceptés, ${rejectedApps.length} refusés`)
    } catch (error) {
      console.error('Error publishing results:', error)
      toast.error('Erreur lors de la publication des résultats')
    }
  }

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!institutionApplications.length) return {
      applicationsByMonth: [],
      applicationsByStatus: [],
      scholarshipsByPerformance: [],
      applicationTrends: []
    }

    // Applications par mois (6 derniers mois)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7)
      const count = institutionApplications.filter(app => 
        app.created_at?.startsWith(monthKey)
      ).length
      
      monthlyData.push({
        name: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        value: count
      })
    }

    // Applications par statut
    const statusData = [
      { name: 'En attente', value: stats.pendingApplications },
      { name: 'Acceptées', value: stats.acceptedApplications },
      { name: 'Refusées', value: stats.rejectedApplications }
    ].filter(item => item.value > 0)

    // Performance des bourses (top 10)
    const performanceData = scholarshipPerformance.slice(0, 10).map(perf => ({
      name: perf.scholarship.title.substring(0, 20) + (perf.scholarship.title.length > 20 ? '...' : ''),
      value: perf.applicationsCount
    }))

    // Tendances des candidatures (7 derniers jours)
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toISOString().slice(0, 10)
      const count = institutionApplications.filter(app => 
        app.created_at?.startsWith(dayKey)
      ).length
      
      trendData.push({
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: count
      })
    }

    return {
      applicationsByMonth: monthlyData,
      applicationsByStatus: statusData,
      scholarshipsByPerformance: performanceData,
      applicationTrends: trendData
    }
  }, [institutionApplications, scholarshipPerformance, stats])

  // Colonnes pour le tableau des candidatures
  const applicationColumns = [
    {
      key: 'profiles' as keyof ApplicationWithRelationsForDashboard,
      label: 'Candidat',
      render: (value: any, row: ApplicationWithRelationsForDashboard) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {(value as any)?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{(value as any)?.full_name || 'Nom inconnu'}</div>
            <div className="text-sm text-gray-500">{(value as any)?.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'scholarships' as keyof ApplicationWithRelationsForDashboard,
      label: 'Bourse',
      render: (value: any) => (
        <div>
          <div className="font-medium text-gray-900">{(value as any)?.title}</div>
          <div className="text-sm text-green-600">
            {(value as any)?.amount ? `${(value as any).amount.toLocaleString()}€` : 'Montant non spécifié'}
          </div>
        </div>
      )
    },
    {
      key: 'status' as keyof ApplicationWithRelationsForDashboard,
      label: 'Statut',
      render: (value: string | null) => {
        const statusConfig = {
          'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
          'under_review': { color: 'bg-blue-100 text-blue-800', icon: Eye },
          'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
          'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
        }
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending
        const IconComponent = config.icon
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {value === 'pending' ? 'En attente' :
             value === 'under_review' ? 'En examen' :
             value === 'accepted' ? 'Acceptée' :
             value === 'rejected' ? 'Refusée' : value}
          </span>
        )
      }
    },
    {
      key: 'created_at' as keyof ApplicationWithRelationsForDashboard,
      label: 'Date de candidature',
      sortable: true,
      render: (value: string | null) => (
        value ? new Date(value).toLocaleDateString('fr-FR') : '-'
      )
    },
    {
      key: 'actions' as keyof ApplicationWithRelationsForDashboard,
      label: 'Actions',
      render: (_, row: ApplicationWithRelationsForDashboard) => (
        <div className="flex items-center space-x-2">
          {(row.status === 'pending' || row.status === 'under_review') && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateApplicationStatus(row.id, 'accepted')}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateApplicationStatus(row.id, 'rejected')}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/application/${row.id}`, '_blank')}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  // Colonnes pour le tableau des bourses
  const scholarshipColumns = [
    {
      key: 'title' as keyof Scholarship,
      label: 'Titre',
      sortable: true,
      render: (value: string, row: Scholarship) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{value}</div>
          <div className="flex items-center space-x-2">
            {row.is_featured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Recommandée
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {row.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'amount' as keyof Scholarship,
      label: 'Montant',
      sortable: true,
      render: (value: number | null, row: Scholarship) => (
        <div className="text-right">
          {value ? (
            <div className="font-semibold text-green-600">
              {value.toLocaleString()}€
            </div>
          ) : (
            <span className="text-gray-400">Non spécifié</span>
          )}
        </div>
      )
    },
    {
      key: 'application_deadline' as keyof Scholarship,
      label: 'Date limite',
      sortable: true,
      render: (value: string) => {
        const deadline = new Date(value)
        const now = new Date()
        const isExpired = deadline < now
        const isExpiringSoon = (deadline.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000)
        
        return (
          <div className={`text-sm ${
            isExpired ? 'text-red-600' : 
            isExpiringSoon ? 'text-orange-600' : 
            'text-gray-600'
          }`}>
            {deadline.toLocaleDateString('fr-FR')}
            {isExpired && <div className="text-xs">Expirée</div>}
            {isExpiringSoon && !isExpired && <div className="text-xs">Bientôt</div>}
          </div>
        )
      }
    },
    {
      key: 'application_count' as keyof Scholarship,
      label: 'Candidatures',
      sortable: true,
      render: (value: number | null, row: Scholarship) => {
        const appCount = institutionApplications.filter(app => app.scholarship_id === row.id).length
        return (
          <div className="text-center">
            <span className="font-medium">{appCount}</span>
          </div>
        )
      }
    },
    {
      key: 'actions' as keyof Scholarship,
      label: 'Actions',
      render: (_, row: Scholarship) => (
        <div className="flex items-center space-x-2">
          <Link to={`/scholarship/${row.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => publishScholarshipResults(row.id)}
            disabled={!institutionApplications.some(app => 
              app.scholarship_id === row.id && app.status !== 'pending'
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Bourses actives"
          value={stats.activeScholarships}
          icon={Award}
          color="blue"
          subtitle={`sur ${stats.totalScholarships} total`}
        />
        <StatCard
          title="Candidatures reçues"
          value={stats.totalApplications}
          icon={FileText}
          color="green"
          subtitle={`${stats.monthlyApplications} ce mois`}
        />
        <StatCard
          title="Taux d'acceptation"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
          subtitle={`${stats.acceptedApplications} acceptées`}
        />
        <StatCard
          title="Budget total"
          value={`${(stats.totalFunding / 1000).toFixed(0)}K€`}
          icon={DollarSign}
          color="orange"
          subtitle="Financement disponible"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidatures par mois</h3>
          <Chart
            type="bar"
            data={chartData.applicationsByMonth}
            height={300}
            colors={['#3B82F6']}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par statut</h3>
          <Chart
            type="pie"
            data={chartData.applicationsByStatus}
            height={300}
            colors={['#F59E0B', '#10B981', '#EF4444']}
          />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
        <div className="space-y-3">
          {recentActivity.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-center py-6">
              <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucune activité récente</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  const renderScholarshipsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des bourses</h2>
        <div className="flex items-center space-x-2">
          <Link to="/scholarships/create">
            <Button icon={Plus}>
              Nouvelle bourse
            </Button>
          </Link>
          <Button variant="outline" icon={Download}>
            Exporter
          </Button>
        </div>
      </div>

      {/* Performance des bourses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top bourses (candidatures)</h3>
          <Chart
            type="bar"
            data={chartData.scholarshipsByPerformance}
            height={250}
            colors={['#10B981']}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance détaillée</h3>
          <div className="space-y-3">
            {scholarshipPerformance.slice(0, 5).map((perf, index) => (
              <div key={perf.scholarship.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                      {perf.scholarship.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {perf.applicationsCount} candidatures
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {perf.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">conversion</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                const pendingApps = institutionApplications.filter(app => app.status === 'pending')
                if (pendingApps.length > 0) {
                  const message = prompt('Message à envoyer aux candidats en attente:')
                  if (message) {
                    sendBulkNotifications(pendingApps.map(app => app.id), message)
                  }
                }
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Notifier candidats en attente ({stats.pendingApplications})
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                const expiredScholarships = institutionScholarships.filter(s => 
                  new Date(s.application_deadline) < new Date() && s.is_active
                )
                if (expiredScholarships.length > 0) {
                  toast.info(`${expiredScholarships.length} bourses expirées à archiver`)
                }
              }}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archiver bourses expirées
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open('/analytics', '_blank')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics détaillées
            </Button>
          </div>
        </Card>
      </div>

      {/* Table des bourses */}
      <DataTable
        data={institutionScholarships}
        columns={scholarshipColumns}
        searchPlaceholder="Rechercher une bourse..."
        isLoading={loading}
        emptyMessage="Aucune bourse créée"
      />
    </div>
  )

  const renderApplicationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des candidatures</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            icon={UserCheck}
            onClick={() => {
              const acceptedApps = institutionApplications.filter(app => app.status === 'accepted')
              if (acceptedApps.length > 0) {
                const message = prompt('Message de félicitations aux candidats acceptés:')
                if (message) {
                  sendBulkNotifications(acceptedApps.map(app => app.id), message)
                }
              }
            }}
          >
            Notifier acceptés ({stats.acceptedApplications})
          </Button>
          <Button variant="outline" icon={Download}>
            Exporter candidatures
          </Button>
        </div>
      </div>

      {/* Statistiques des candidatures */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
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
              <p className="text-sm text-gray-600">Refusées</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-2xl font-bold text-blue-600">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Tendances des candidatures */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances des candidatures (7 derniers jours)</h3>
        <Chart
          type="bar"
          data={chartData.applicationTrends}
          height={200}
          colors={['#3B82F6']}
        />
      </Card>

      {/* Table des candidatures */}
      <DataTable
        data={institutionApplications}
        columns={applicationColumns}
        searchPlaceholder="Rechercher une candidature..."
        isLoading={loading}
        emptyMessage="Aucune candidature reçue"
      />
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics avancées</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">Cette année</option>
          </select>
          <Button variant="outline" icon={RefreshCw} onClick={loadDashboardData}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement des candidats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vues hebdomadaires</span>
              <span className="font-semibold">{stats.weeklyViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taux de conversion</span>
              <span className="font-semibold text-green-600">{stats.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Candidatures/bourse</span>
              <span className="font-semibold">{stats.avgApplicationsPerScholarship.toFixed(1)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance temporelle</h3>
          <div className="space-y-4">
            {scholarshipPerformance.slice(0, 3).map((perf, index) => (
              <div key={perf.scholarship.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {perf.scholarship.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Traitement: {perf.avgProcessingTime.toFixed(1)} jours
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">
                    {perf.applicationsCount}
                  </p>
                  <p className="text-xs text-gray-500">candidatures</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions recommandées</h3>
          <div className="space-y-3">
            {stats.pendingApplications > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pendingApplications} candidatures en attente
                </p>
                <p className="text-xs text-yellow-600">Action requise</p>
              </div>
            )}
            {institutionScholarships.filter(s => 
              new Date(s.application_deadline) < new Date() && s.is_active
            ).length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  Bourses expirées à archiver
                </p>
                <p className="text-xs text-red-600">Maintenance requise</p>
              </div>
            )}
            {stats.successRate < 10 && stats.totalApplications > 10 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Taux d'acceptation faible
                </p>
                <p className="text-xs text-blue-600">Révision des critères suggérée</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des candidatures</h3>
          <Chart
            type="bar"
            data={chartData.applicationTrends}
            height={300}
            colors={['#6366F1']}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition géographique</h3>
          <div className="space-y-3">
            {/* Analyse géographique des candidats */}
            {(() => {
              const countryStats = institutionApplications.reduce((acc, app) => {
                // Note: Nous aurions besoin d'une jointure avec les profils étudiants pour obtenir la nationalité
                const country = 'France' // Placeholder - à remplacer par les vraies données
                acc[country] = (acc[country] || 0) + 1
                return acc
              }, {} as Record<string, number>)

              return Object.entries(countryStats).slice(0, 5).map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{country}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            })()}
          </div>
        </Card>
      </div>
    </div>
  )

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
      {/* Header avec indicateur temps réel */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {institutionProfile?.institution_name || profile?.full_name}
            </h1>
            <p className="text-blue-100">
              Tableau de bord institution - Gestion complète de vos programmes
            </p>
          </div>
          <div className="text-right">
            <RealTimeIndicator 
              isConnected={isConnected} 
              lastUpdate={lastUpdate}
              className="mb-2"
            />
            <p className="text-blue-100 text-sm">Budget total</p>
            <p className="text-2xl font-bold">{(stats.totalFunding / 1000).toFixed(0)}K€</p>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { key: 'scholarships', label: 'Bourses', icon: Award },
          { key: 'applications', label: 'Candidatures', icon: FileText },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedView === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {selectedView === 'overview' && renderOverviewTab()}
      {selectedView === 'scholarships' && renderScholarshipsTab()}
      {selectedView === 'applications' && renderApplicationsTab()}
      {selectedView === 'analytics' && renderAnalyticsTab()}
    </div>
  )
}