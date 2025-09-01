import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import DataTable from '@/components/ui/DataTable'
import { Card, StatCard } from '@/components/ui/Card'
import { useApplications } from '@/hooks/useDatabase'
import { useAuth } from '@/hooks/useAuth'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Application = Tables<'applications'>

export default function ApplicationsPage() {
  const { user } = useAuth()
  const { data: applications, isLoading } = useApplications(user?.id)

  const columns = [
    {
      key: 'scholarship_id' as keyof Application,
      label: 'Bourse',
      render: (value: string) => (
        <div className="font-medium text-blue-600">
          Bourse #{value.slice(0, 8)}
        </div>
      )
    },
    {
      key: 'status' as keyof Application,
      label: 'Statut',
      render: (value: string | null) => {
        const statusColors = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'reviewing': 'bg-blue-100 text-blue-800',
          'approved': 'bg-green-100 text-green-800',
          'rejected': 'bg-red-100 text-red-800'
        }
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
          }`}>
            {value || 'Non défini'}
          </span>
        )
      }
    },
    {
      key: 'submitted_at' as keyof Application,
      label: 'Soumise le',
      render: (value: string | null) => (
        value ? new Date(value).toLocaleDateString('fr-FR') : '-'
      )
    },
    {
      key: 'reviewed_at' as keyof Application,
      label: 'Examinée le',
      render: (value: string | null) => (
        value ? new Date(value).toLocaleDateString('fr-FR') : '-'
      )
    }
  ]

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === 'pending').length || 0,
    approved: applications?.filter(a => a.status === 'approved').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mes candidatures
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Suivez l'état de vos candidatures aux différentes bourses d'études.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total candidatures"
            value={stats.total}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="En attente"
            value={stats.pending}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Approuvées"
            value={stats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Rejetées"
            value={stats.rejected}
            icon={XCircle}
            color="red"
          />
        </div>

        <DataTable
          data={applications || []}
          columns={columns}
          searchPlaceholder="Rechercher dans mes candidatures..."
          isLoading={isLoading}
          emptyMessage="Aucune candidature trouvée"
        />
      </div>
    </ProtectedRoute>
  )
}
