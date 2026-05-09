import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CitizenLayout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { collections, subscribeToQuery } from '@/lib/firestore'
import { where, orderBy } from 'firebase/firestore'
import type { Report } from '@/types'

export default function MyReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const unsub = subscribeToQuery<Report>(
      collections.reports,
      [
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ],
      (data) => {
        setReports(data)
        setIsLoading(false)
      },
      (err) => {
        console.error('Failed to fetch reports:', err)
        setIsLoading(false)
      }
    )

    return () => unsub()
  }, [user])

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now'
    // Handle both Timestamp and number
    const timestampMillis = typeof ts === 'number' ? ts : ts.toMillis()
    const diffMins = Math.floor((Date.now() - timestampMillis) / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`
    return `${Math.floor(diffMins/1440)}d ago`
  }

  const getStatusBadge = (status: Report['status'], urgency: Report['urgency']) => {
    if (status === 'resolved') return { label: 'Resolved', class: 'badge-active' }
    if (status === 'rejected') return { label: 'Rejected', class: 'badge-tag bg-gray-100 text-gray-500' }
    if (status === 'dispatched') return { label: 'Dispatched', class: 'badge-tag bg-blue-100 text-blue-700' }
    if (urgency === 'high') return { label: 'Under Review', class: 'badge-urgent' }
    return { label: 'Under Review', class: 'badge-pending' }
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-1">My Reports</h1>
            {!isLoading && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-wider ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>Live
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Track all the issues you've submitted.</p>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="pukaar-card p-5 border-border animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-1/4 bg-accent rounded" />
                    <div className="h-4 w-16 bg-accent rounded-full" />
                  </div>
                  <div className="h-4 w-1/2 bg-accent rounded" />
                  <div className="h-3 w-1/3 bg-accent rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && reports.length === 0 && (
          <div className="py-20 text-center text-muted-foreground bg-accent/30 rounded-xl border border-dashed border-border mt-4">
            <span className="material-icons text-4xl mb-2 opacity-50">search_off</span>
            <p className="font-medium text-sm text-foreground">No reports found.</p>
            <p className="text-xs mb-4">You haven't submitted any civic issues yet.</p>
            <Link to="/report" className="btn-primary inline-flex items-center gap-2">
              <span className="material-icons text-lg">add</span>
              Submit a Report
            </Link>
          </div>
        )}

        {/* List */}
        {!isLoading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map(r => {
              const badge = getStatusBadge(r.status, r.urgency)
              return (
                <Link key={r.id} to={`/reports/${r.id}`} className="block pukaar-card p-5 hover:border-primary/40 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-primary text-xl">campaign</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="text-xs text-muted-foreground font-medium">
                          {r.id?.slice(0, 8).toUpperCase()} · {r.aiClassification?.category || r.category}
                        </div>
                        <span className={badge.class}>{badge.label}</span>
                      </div>
                      <div className="font-heading font-semibold text-sm text-foreground mb-1">
                        {r.aiClassification?.summary ? (r.aiClassification.summary.length > 40 ? r.aiClassification.summary.substring(0, 40) + '...' : r.aiClassification.summary) : 'Unclassified Civic Issue'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.assignedNgoId ? 'Assigned to NGO' : 'Awaiting NGO pickup'} · {formatTime(r.createdAt)}
                      </div>
                    </div>
                    <span className="material-icons text-muted-foreground/40 text-xl flex-shrink-0 mt-2">chevron_right</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!isLoading && reports.length > 0 && (
          <div className="mt-8 text-center">
            <Link to="/report" className="btn-primary inline-flex items-center gap-2">
              <span className="material-icons text-lg">add</span>
              New Report
            </Link>
          </div>
        )}
      </div>
    </CitizenLayout>
  )
}
