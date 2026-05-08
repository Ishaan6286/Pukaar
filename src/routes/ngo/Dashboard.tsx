import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NgoLayout } from '@/components/NgoLayout'
import { useAuth } from '@/hooks/useAuth'
import { collections, subscribeToQuery } from '@/lib/db'
import { where } from 'firebase/firestore'
import { acceptReport, resolveReport } from '@/lib/reports'
import type { Report } from '@/types'
import { toast } from 'sonner'

const ACTIVITY = [
  { time: 'Just now', event: 'Dashboard live syncing active', icon: 'sync', color: 'text-teal-400' },
  { time: 'Always', event: 'Monitoring secure AI endpoints', icon: 'security', color: 'text-primary' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. Realtime Firestore Subscription
  useEffect(() => {
    if (!profile?.ngoId) return

    // Subscribe to ALL reports assigned to this NGO to calculate accurate stats
    const unsubscribe = subscribeToQuery<Report>(
      collections.reports,
      [where('assignedNgoId', '==', profile.ngoId)],
      (data) => {
        setReports(data)
        setIsLoading(false)
        
        // Auto-select first active report if none selected
        if (!selectedReportId && data.length > 0) {
          const active = data.filter(r => r.status !== 'resolved')
          if (active.length > 0) setSelectedReportId(active[0].id || null)
        }
      },
      (err) => {
        console.error('Subscription error', err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [profile?.ngoId]) // Omit selectedReportId from deps to prevent overriding user selection

  // 2. Data Processing & Sorting
  const activeReports = useMemo(() => {
    const active = reports.filter(r => r.status !== 'resolved' && r.status !== 'rejected')
    
    // Sort strictly by Urgency (high > medium > low), then Time (newest first)
    const weight = { high: 3, medium: 2, low: 1 }
    
    return active.sort((a, b) => {
      const uDiff = weight[b.urgency] - weight[a.urgency]
      if (uDiff !== 0) return uDiff
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    })
  }, [reports])

  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports])
  
  const selectedReport = useMemo(() => reports.find(r => r.id === selectedReportId), [reports, selectedReportId])

  // 3. Actions
  const handleAccept = async (reportId: string) => {
    if (!profile?.ngoId) return
    setIsProcessing(true)
    const toastId = toast.loading('Dispatching team...')
    try {
      await acceptReport(reportId, profile.ngoId)
      toast.success('Team dispatched successfully', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to dispatch team', { id: toastId })
    }
    setIsProcessing(false)
  }

  const handleResolve = async (reportId: string) => {
    if (!profile?.ngoId) return
    setIsProcessing(true)
    const toastId = toast.loading('Marking report as resolved...')
    try {
      await resolveReport(reportId, profile.ngoId)
      setSelectedReportId(null) // Unselect to prevent actions on resolved
      toast.success('Report resolved', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to resolve report', { id: toastId })
    }
    setIsProcessing(false)
  }

  // Formatting helpers
  const formatTime = (ts: any) => {
    if (!ts) return 'Just now'
    const diffMins = Math.floor((Date.now() - ts.toMillis()) / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${Math.floor(diffMins/60)}h ago`
  }

  const isAudioFile = (url: string) => url.includes('.webm') || url.includes('.mp4') || url.includes('audio')

  return (
    <NgoLayout>
      <div className="space-y-6">
        
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-xl text-white">Operational Overview</h1>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-white/50 text-sm mt-0.5">Real-time incoming intelligence feed.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/ngo/posts/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/80 text-white text-sm font-semibold hover:bg-primary transition-colors">
              <span className="material-icons text-base">add</span>New Post
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Reports', value: activeReports.length.toString(), icon: 'assignment', color: 'text-rose-400' },
            { label: 'Resolved Total', value: resolvedCount.toString(), icon: 'check_circle', color: 'text-teal-400' },
            { label: 'Teams Active', value: activeReports.filter(r => r.status === 'dispatched').length.toString(), icon: 'groups', color: 'text-amber-400' },
            { label: 'System Status', value: 'Nominal', icon: 'speed', color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs font-medium">{s.label}</span>
                <span className={`material-icons text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <div className="font-heading font-bold text-2xl text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Incoming reports */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-white text-sm">Actionable Triage Queue</h2>
              <span className="text-xs text-white/40">{activeReports.length} pending</span>
            </div>
            
            {isLoading && activeReports.length === 0 && (
              <div className="p-8 text-center text-white/30 text-sm">Syncing intelligence data...</div>
            )}

            {!isLoading && activeReports.length === 0 && (
              <div className="p-8 text-center text-white/50 bg-white/5 rounded-xl border border-white/10">
                <span className="material-icons text-4xl text-white/20 mb-2">done_all</span>
                <p className="text-sm font-medium">All clear. No active reports in your sector.</p>
              </div>
            )}

            {activeReports.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedReportId(r.id || null)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${selectedReportId === r.id
                  ? 'border-primary/60 bg-primary/10 shadow-[0_0_20px_rgba(103,80,164,0.15)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.category.includes('medical') || r.category.includes('person') ? 'text-rose-400 bg-rose-500/10' :
                    r.category.includes('water') || r.category.includes('flood') ? 'text-blue-400 bg-blue-500/10' :
                    'text-amber-400 bg-amber-500/10'
                  }`}>
                    <span className="material-icons text-xl">
                      {r.category.includes('medical') || r.category.includes('person') ? 'medical_services' :
                       r.category.includes('water') ? 'water_drop' : 'warning'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="text-xs text-white/40 font-medium">
                        {r.id?.slice(0,8)} · {r.aiClassification?.category || r.category}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'dispatched' ? 'bg-blue-500/20 text-blue-300' :
                          r.urgency === 'high' ? 'bg-rose-500/20 text-rose-300' : 
                          r.urgency === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'
                        }`}>
                          {r.status === 'dispatched' ? '🚚 En Route' :
                           r.urgency === 'high' ? '⚡ High' : 
                           r.urgency === 'medium' ? '● Medium' : 'Low'}
                        </span>
                        <span className="text-xs text-white/30">{formatTime(r.createdAt)}</span>
                      </div>
                    </div>
                    <div className="font-heading font-semibold text-sm text-white mb-1">
                      {r.aiClassification?.summary ? (r.aiClassification.summary.length > 50 ? r.aiClassification.summary.substring(0, 50) + '...' : r.aiClassification.summary) : 'Unclassified Report'}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{r.description || 'See media attachments'}</p>
                    
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] text-white/30 font-mono">📍 {r.location.address}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Action Panel */}
                {selectedReportId === r.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    
                    {/* Media Previews */}
                    {r.mediaUrls && r.mediaUrls.length > 0 && (
                      <div className="flex gap-2">
                        {r.mediaUrls.map((url, idx) => (
                          <div key={idx} className="w-1/2">
                            {isAudioFile(url) ? (
                              <audio controls src={url} className="w-full h-8" />
                            ) : (
                              <a href={url} target="_blank" rel="noreferrer" className="block w-full h-24 bg-black/50 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors">
                                <img src={url} className="w-full h-full object-cover opacity-80 hover:opacity-100" alt="Attachment" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Actionable Output */}
                    {r.aiClassification?.suggestedAction && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">AI Suggested Action</div>
                        <div className="text-xs text-white/80">{r.aiClassification.suggestedAction}</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {r.status === 'dispatched' ? (
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleResolve(r.id!)}
                          className="flex-1 py-2 rounded-lg bg-teal-500/80 text-white text-xs font-semibold hover:bg-teal-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <span className="material-icons text-sm">check_circle</span>Mark as Resolved
                        </button>
                      ) : (
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleAccept(r.id!)}
                          className="flex-1 py-2 rounded-lg bg-primary/80 text-white text-xs font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <span className="material-icons text-sm">local_shipping</span>Dispatch Response Team
                        </button>
                      )}
                      <Link to={`/ngo/reports/${r.id}`} className="flex-[0.5] py-2 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-1">
                        <span className="material-icons text-sm">open_in_new</span>Full Specs
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
 
          {/* Right column */}
          <div className="space-y-4">
            
            {/* Live Activity (Simulated local system events for aesthetic) */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-heading font-semibold text-white text-sm mb-3">System Events</h2>
              <div className="space-y-3">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`material-icons text-base flex-shrink-0 mt-0.5 ${a.color}`}>{a.icon}</span>
                    <div>
                      <div className="text-xs font-medium text-white/80">{a.event}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Logistics Suggestions based on Selected */}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons text-primary text-base">auto_awesome</span>
                <h2 className="font-heading font-semibold text-white text-sm">AI Logistics</h2>
              </div>
              
              {selectedReport ? (
                <>
                  <div className="text-xs text-white/40 mb-3">Required for: {selectedReport.id?.slice(0,8)}</div>
                  {selectedReport.aiClassification?.suggestedSupplies && selectedReport.aiClassification.suggestedSupplies.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReport.aiClassification.suggestedSupplies.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-2.5">
                          <span className="material-icons text-primary text-lg">inventory_2</span>
                          <div className="flex-1 text-xs font-medium text-white/80">{item}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/50 italic">No specific supplies suggested by AI.</div>
                  )}
                </>
              ) : (
                <div className="text-xs text-white/50 italic py-4 text-center">Select a report to view required supplies and logistics.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NgoLayout>
  )
}
