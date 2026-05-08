import { Link } from 'react-router-dom'
import { CitizenLayout } from '@/components/Layout'

const MY_REPORTS = [
  { id: 'REP-9021', category: 'Water Supply', title: 'Contamination in tap water', time: '2h ago', status: 'active', statusLabel: 'Resolved', ngo: 'Hope Foundation' },
  { id: 'REP-8923', category: 'Road Safety', title: 'Fallen tree blocking road', time: '1d ago', status: 'pending', statusLabel: 'In Progress', ngo: 'City Works NGO' },
  { id: 'REP-8741', category: 'Medical Aid', title: 'Medical assistance for elderly neighbor', time: '3d ago', status: 'active', statusLabel: 'Resolved', ngo: 'CareFirst' },
]

export default function MyReports() {
  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">My Reports</h1>
          <p className="text-muted-foreground text-sm">Track all the issues you've submitted.</p>
        </div>

        <div className="space-y-3">
          {MY_REPORTS.map(r => (
            <Link key={r.id} to={`/reports/${r.id}`} className="block pukaar-card p-5 hover:border-primary/40 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-primary text-xl">campaign</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="text-xs text-muted-foreground font-medium">{r.id} · {r.category}</div>
                    <span className={r.status === 'active' ? 'badge-active' : r.status === 'urgent' ? 'badge-urgent' : 'badge-pending'}>{r.statusLabel}</span>
                  </div>
                  <div className="font-heading font-semibold text-sm text-foreground mb-1">{r.title}</div>
                  <div className="text-xs text-muted-foreground">Assigned to {r.ngo} · {r.time}</div>
                </div>
                <span className="material-icons text-muted-foreground/40 text-xl flex-shrink-0">chevron_right</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/report" className="btn-primary inline-flex items-center gap-2">
            <span className="material-icons text-lg">add</span>
            New Report
          </Link>
        </div>
      </div>
    </CitizenLayout>
  )
}
