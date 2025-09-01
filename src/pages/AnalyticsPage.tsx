import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RealTimeIndicator from '@/components/ui/RealTimeIndicator'
import AdvancedFilters from '@/components/ui/AdvancedFilters'
import {
  ScholarshipsByCountryChart,
  ApplicationStatusChart,
  ScholarshipTrendsChart,
  TopInstitutionsChart
} from '@/components/ui/Charts'
import {
  useScholarships,
  useApplications,
  useCountries,
  useInstitutions,
  useAnalyticsEvents
} from '@/hooks/useDatabase'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { generateMockData, formatCurrency, formatNumber } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Building,
  DollarSign,
  Calendar,
  Target,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Clock,
  Award,
  BookOpen
} from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  uniqueUsers: number
  conversionRate: number
  avgSessionTime: number
  topPages: Array<{ page: string; views: number }>
  userEngagement: Array<{ metric: string; value: number; change: number }>
  scholarshipPerformance: Array<{ name: string; applications: number; views: number }>
  geographicData: Array<{ country: string; users: number; scholarships: number }>
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 45670,
    uniqueUsers: 12340,
    conversionRate: 8.7,
    avgSessionTime: 285,
    topPages: [
      { page: '/scholarships', views: 15420 },
      { page: '/institutions', views: 8930 },
      { page: '/countries', views: 6750 },
      { page: '/dashboard', views: 5620 }
    ],
    userEngagement: [
      { metric: 'Pages vues', value: 45670, change: 12.5 },
      { metric: 'Sessions', value: 12340, change: 8.7 },
      { metric: 'Taux de rebond', value: 32.1, change: -5.2 },
      { metric: 'Temps moyen', value: 285, change: 15.3 }
    ],
    scholarshipPerformance: [
      { name: 'Bourses Erasmus', applications: 450, views: 2890 },
      { name: 'Bourses MIT', applications: 230, views: 1560 },
      { name: 'Bourses Oxford', applications: 180, views: 1240 },
      { name: 'Bourses Sorbonne', applications: 160, views: 980 }
    ],
    geographicData: [
      { country: 'France', users: 4560, scholarships: 234 },
      { country: 'Allemagne', users: 2340, scholarships: 189 },
      { country: 'Royaume-Uni', users: 1890, scholarships: 156 },
      { country: 'Espagne', users: 1560, scholarships: 123 }
    ]
  })

  const [filters, setFilters] = useState({
    dateRange: '30d',
    userType: '',
    trafficSource: '',
    country: ''
  })

  const { data: scholarships, isLoading: loadingScholarships } = useScholarships()
  const { data: applications, isLoading: loadingApplications } = useApplications()
  const { data: countries } = useCountries()
  const { data: institutions } = useInstitutions()
  const { data: analyticsEvents } = useAnalyticsEvents()

  // Real-time subscription for analytics
  const { isConnected } = useRealtimeSubscription({
    table: 'analytics_events',
    onChange: () => {
      setLastUpdate(new Date())
      // Update analytics data
      setAnalyticsData(prev => ({
        ...prev,
        totalViews: prev.totalViews + Math.floor(Math.random() * 10),
        uniqueUsers: prev.uniqueUsers + Math.floor(Math.random() * 3)
      }))
    }
  })

  const dashboardData = generateMockData()
  const isLoading = loadingScholarships || loadingApplications

  const filterFields = [
    {
      key: 'dateRange',
      label: 'Période',
      type: 'select' as const,
      options: [
        { label: '7 derniers jours', value: '7d' },
        { label: '30 derniers jours', value: '30d' },
        { label: '90 derniers jours', value: '90d' },
        { label: 'Cette année', value: '1y' }
      ]
    },
    {
      key: 'userType',
      label: 'Type d\'utilisateur',
      type: 'select' as const,
      options: [
        { label: 'Étudiants', value: 'student' },
        { label: 'Institutions', value: 'institution' },
        { label: 'Administrateurs', value: 'admin' }
      ]
    },
    {
      key: 'trafficSource',
      label: 'Source de trafic',
      type: 'select' as const,
      options: [
        { label: 'Recherche organique', value: 'organic' },
        { label: 'Réseaux sociaux', value: 'social' },
        { label: 'Référence', value: 'referral' },
        { label: 'Direct', value: 'direct' }
      ]
    },
    {
      key: 'country',
      label: 'Pays',
      type: 'select' as const,
      options: countries?.map(c => ({ label: `${c.flag_emoji} ${c.name}`, value: c.id })) || []
    }
  ]

  const handleExportData = () => {
    // Export analytics data to CSV
    const csvData = analyticsData.userEngagement.map(item => 
      `${item.metric},${item.value},${item.change}`
    ).join('\n')
    
    const blob = new Blob([`Métrique,Valeur,Changement\n${csvData}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Analytics avancées
          </h1>
          <p className="text-lg text-gray-600">
            Analyse détaillée des performances et de l'engagement des utilisateurs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <RealTimeIndicator isConnected={isConnected} lastUpdate={lastUpdate} />
          <Button variant="outline" icon={Download} onClick={handleExportData}>
            Exporter
          </Button>
          <Button variant="outline" icon={RefreshCw} onClick={() => setLastUpdate(new Date())}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        showCounts={false}
        className="mb-8"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vues totales</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalViews)}
              </p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12.5%</span>
                <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs uniques</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analyticsData.uniqueUsers)}
              </p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8.7%</span>
                <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyticsData.conversionRate}%
              </p>
              <div className="flex items-center mt-2 text-red-600">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">-2.1%</span>
                <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps moyen</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.floor(analyticsData.avgSessionTime / 60)}m{analyticsData.avgSessionTime % 60}s
              </p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+15.3%</span>
                <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Trends */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Tendances du trafic</h3>
            <Badge variant="info">30 derniers jours</Badge>
          </div>
          <ScholarshipTrendsChart data={dashboardData.scholarshipTrends} />
        </Card>

        {/* User Engagement */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Engagement utilisateur</h3>
            <Badge variant="success">Temps réel</Badge>
          </div>
          <div className="space-y-4">
            {analyticsData.userEngagement.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.metric}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {item.metric.includes('Temps') ? `${Math.floor(item.value / 60)}m${item.value % 60}s` :
                     item.metric.includes('Taux') ? `${item.value}%` : formatNumber(item.value)}
                  </p>
                </div>
                <div className={`flex items-center ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Pages */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Pages populaires</h3>
            <Badge variant="default">{analyticsData.totalViews} vues totales</Badge>
          </div>
          <div className="space-y-4">
            {analyticsData.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{page.page}</p>
                    <p className="text-sm text-gray-500">{formatNumber(page.views)} vues</p>
                  </div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(page.views / analyticsData.topPages[0].views) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <Badge variant="info" size="sm">
                  {((page.views / analyticsData.totalViews) * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Répartition géographique</h3>
            <Badge variant="default">{countries?.length || 0} pays</Badge>
          </div>
          <ScholarshipsByCountryChart data={dashboardData.scholarshipsByCountry} />
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scholarship Performance */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Performance des bourses</h3>
            <Button variant="outline" size="sm">Voir détails</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Bourse</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Vues</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Candidatures</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Taux</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.scholarshipPerformance.map((scholarship, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{scholarship.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {formatNumber(scholarship.views)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {formatNumber(scholarship.applications)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="success" size="sm">
                        {((scholarship.applications / scholarship.views) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Geographic Performance */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Performance géographique</h3>
            <Button variant="outline" size="sm">Voir carte</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pays</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Utilisateurs</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Bourses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.geographicData.map((country, index) => {
                  const engagement = (country.scholarships / country.users * 100)
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{country.country}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {formatNumber(country.users)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {formatNumber(country.scholarships)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge 
                          variant={engagement > 15 ? 'success' : engagement > 8 ? 'warning' : 'default'} 
                          size="sm"
                        >
                          {engagement.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}