import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CitizenLayout } from '@/components/Layout'
import { collections, subscribeToDoc, subscribeToQuery } from '@/lib/firestore'
import { where, orderBy } from 'firebase/firestore'
import type { Report, NgoProfile, TimelineEvent } from '@/types'

export default function ReportStatus() {
  const { reportId } = useParams<{ reportId: string }>()
  
  const [report, setReport] = useState<Report | null>(null)
  const [ngo, setNgo] = useState<NgoProfile | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to Report
  useEffect(() => {
    if (!reportId) return
    const unsub = subscribeToDoc<Report>(
      collections.reports,
      reportId,
      (data) => {
        setReport(data)
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [reportId])

  // Subscribe to NGO if assigned
  useEffect(() => {
    if (!report?.assignedNgoId) return
    const unsub = subscribeToDoc<NgoProfile>(
      collections.ngos,
      report.assignedNgoId,
      (data) => setNgo(data)
    )
    return () => unsub()
  }, [report?.assignedNgoId])

  // Subscribe to Timeline Events
  useEffect(() => {
    if (!reportId) return
    const unsub = subscribeToQuery<TimelineEvent>(
      collections.timelineEvents,
      [
        where('reportId', '==', reportId),
        orderBy('createdAt', 'asc') // Make sure index exists or this falls back gracefully
      ],
      (data) => setTimelineEvents(data)
    )
    return () => unsub()
  }, [reportId])

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now'
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Derive standard phases based on report status
  const currentPhaseIndex = {
    'submitted': 0,
    'under_review': 1,
    'dispatched': 2,
    'resolved': 3,
    'rejected': -1
  }[report?.status || 'submitted']

  const standardSteps = [
    { id: 'submitted', label: 'Report Submitted', icon: 'check_circle' },
    { id: 'under_review', label: 'AI & NGO Review', icon: 'manage_search' },
    { id: 'dispatched', label: 'Response Dispatched', icon: 'local_shipping' },
    { id: 'resolved', label: 'Resolved', icon: 'task_alt' }
  ]

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Syncing Secure Network...</p>
        </div>
      </CitizenLayout>
    )
  }

  if (!report) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <span className="material-icons text-6xl text-muted-foreground mb-4">search_off</span>
          <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">The report you are looking for does not exist or you do not have permission.</p>
          <Link to="/" className="btn-primary">Return Home</Link>
        </div>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center">
              <span className="material-icons text-xl mr-1">arrow_back</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="text-xs text-muted-foreground font-medium ml-auto">Report #{reportId?.slice(0,8)}</div>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Live Status Tracking</h1>
          <p className="text-muted-foreground">Help is on the way. We are actively coordinating with local NGOs to address your report.</p>
        </div>

        {/* ETA card / Live State Card */}
        {report.status === 'dispatched' ? (
          <div className="pukaar-card p-5 mb-6 flex items-center gap-4 bg-primary text-white border-primary shadow-lg shadow-primary/20 animate-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-2xl">directions_run</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white/80">NGO Team En Route</div>
              <div className="font-heading font-bold text-xl">Help is arriving soon</div>
            </div>
            <div className="ml-auto">
              <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            </div>
          </div>
        ) : report.status === 'resolved' ? (
          <div className="pukaar-card p-5 mb-6 flex items-center gap-4 bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20 animate-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-2xl">task_alt</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white/80">Situation Handled</div>
              <div className="font-heading font-bold text-xl">Report Resolved</div>
            </div>
            <div className="ml-auto opacity-50">
              <span className="material-icons text-4xl">verified</span>
            </div>
          </div>
        ) : (
          <div className="pukaar-card p-5 mb-6 flex items-center gap-4 bg-accent/50 border-border animate-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-border shadow-sm">
              <span className="material-icons text-2xl text-primary animate-pulse">satellite_alt</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">System Status</div>
              <div className="font-heading font-bold text-foreground">Analyzing & Routing...</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="pukaar-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-foreground">Resolution Progress</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="space-y-0">
            {standardSteps.map((step, i) => {
              // Find the last event matching this status step
              const relatedEvents = timelineEvents.filter(e => e.status === step.id)
              const latestEvent = relatedEvents[relatedEvents.length - 1]
              
              const isDone = i < currentPhaseIndex || (i === currentPhaseIndex && report.status === 'resolved')
              const isActive = i === currentPhaseIndex && report.status !== 'resolved'
              const isPending = i > currentPhaseIndex

              return (
                <div key={step.id} className="flex gap-4 relative">
                  {/* Connector line */}
                  {i < standardSteps.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${isDone ? 'bg-primary' : 'bg-border'}`} />
                  )}
                  {/* Dot */}
                  <div className={`mt-1 flex-shrink-0 z-10 ${
                    isDone ? 'timeline-dot-done' :
                    isActive ? 'timeline-dot-active' :
                    'timeline-dot-pending'
                  }`} />
                  
                  <div className="pb-8 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-sm font-semibold ${isPending ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                        {step.label}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
                        {latestEvent ? formatTime(latestEvent.createdAt) : '—'}
                      </span>
                    </div>
                    
                    {/* Event Descriptions */}
                    <div className="mt-1 space-y-2">
                      {relatedEvents.length > 0 ? (
                        relatedEvents.map((ev, idx) => (
                          <div key={idx} className="text-xs leading-relaxed text-muted-foreground bg-accent/50 p-2 rounded-lg border border-border/50">
                            {ev.description}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground/40 italic">Waiting for update...</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Responding Org */}
        {ngo && (
          <div className="pukaar-card p-5 mb-6 animate-fade-in-up">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              Responding Organization
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <span className="material-icons text-primary text-2xl">corporate_fare</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-foreground truncate">{ngo.ngoName}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{ngo.address}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="badge-active">Verified Partner</span>
                  {ngo.stats && <span className="badge-tag">{ngo.stats.totalResolved} Resolved</span>}
                </div>
              </div>
              <button 
                onClick={() => window.location.href = `tel:${ngo.contactPhone}`}
                className="btn-secondary text-sm py-2 px-3 flex items-center gap-1 flex-shrink-0"
              >
                <span className="material-icons text-base text-primary">phone</span>
                Contact
              </button>
            </div>
          </div>
        )}

        {/* Privacy note */}
        <div className="pukaar-card p-4 bg-primary/5 border-primary/10 flex items-start gap-3">
          <span className="material-icons text-primary text-lg mt-0.5">lock</span>
          <div>
            <div className="text-sm font-semibold text-foreground mb-0.5">End-to-End Tracking</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your personal details are securely masked. Only real-time event logs and location data are shared with the responding NGO to coordinate rescue efforts.
            </p>
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}
