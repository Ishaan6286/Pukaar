import { useParams, Link } from 'react-router-dom'
import { NgoLayout } from '@/components/NgoLayout'

const TIMELINE = [
  { label: 'Report Received', desc: 'Submitted via Pukaar citizen portal.', done: true, time: '10:23 AM' },
  { label: 'Under Review', desc: 'Matched with your NGO based on category and location.', done: true, time: '10:25 AM' },
  { label: 'Team Dispatched', desc: 'Field team of 3 dispatched with water testing kits.', done: false, active: true, time: '10:42 AM' },
  { label: 'Resolved', desc: 'Awaiting field confirmation.', done: false, active: false, time: '—' },
]

export default function ReportDetail() {
  const { reportId } = useParams()
  return (
    <NgoLayout>
      <div className="max-w-3xl">
        {/* Back */}
        <Link to="/ngo/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <span className="material-icons text-base">arrow_back</span>Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-white/40 font-medium mb-1">Report ID: {reportId}</div>
            <h1 className="font-heading font-bold text-xl text-white">Water Supply Contamination</h1>
            <p className="text-white/50 text-sm mt-1">Sector 4, Downtown · Submitted 2 hours ago</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/20">⚡ High Urgency</span>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Details */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-heading font-semibold text-white text-sm mb-4">Situation Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: 'description', label: 'Description', value: 'Residents reporting unusual color and smell in tap water affecting approx 50 households in Sector 4. Immediate investigation required.' },
                { icon: 'category', label: 'Category', value: 'Water Supply Contamination' },
                { icon: 'location_on', label: 'Location', value: 'Sector 4, Block C, Downtown' },
                { icon: 'people', label: 'Affected', value: '~50 households' },
              ].map(row => (
                <div key={row.label} className="flex gap-3">
                  <span className="material-icons text-white/30 text-base mt-0.5">{row.icon}</span>
                  <div><div className="text-[10px] text-white/30 font-medium mb-0.5">{row.label}</div><div className="text-white/80 text-xs leading-relaxed">{row.value}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-heading font-semibold text-white text-sm mb-4">Progress</h2>
            <div className="space-y-0">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i < TIMELINE.length - 1 && (
                    <div className={`absolute left-[9px] top-5 bottom-0 w-0.5 ${t.done ? 'bg-teal-500/50' : 'bg-white/10'}`} />
                  )}
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 z-10 flex items-center justify-center ${
                    t.done ? 'bg-teal-500' : t.active ? 'bg-primary ring-4 ring-primary/20' : 'bg-white/10'
                  }`}>
                    {t.done && <span className="material-icons text-white text-xs">check</span>}
                    {t.active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex justify-between items-center">
                      <div className={`text-xs font-semibold ${t.done || t.active ? 'text-white/90' : 'text-white/30'}`}>{t.label}</div>
                      <span className="text-[10px] text-white/30">{t.time}</span>
                    </div>
                    <div className={`text-[11px] leading-relaxed mt-0.5 ${t.done || t.active ? 'text-white/50' : 'text-white/20'}`}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/80 text-white text-sm font-semibold hover:bg-primary transition-colors">
            <span className="material-icons text-base">local_shipping</span>Dispatch Field Team
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-semibold hover:bg-teal-500/30 transition-colors">
            <span className="material-icons text-base">task_alt</span>Mark Resolved
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors">
            <span className="material-icons text-base">arrow_forward</span>Reassign
          </button>
        </div>
      </div>
    </NgoLayout>
  )
}
