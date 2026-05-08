import { Link } from 'react-router-dom'
import { CitizenLayout } from '@/components/Layout'

const stats = [
  { value: '14,200+', label: 'Issues Resolved', icon: 'check_circle' },
  { value: '340+', label: 'NGO Partners', icon: 'handshake' },
  { value: '52', label: 'Cities Active', icon: 'location_city' },
  { value: '98%', label: 'Response Rate', icon: 'speed' },
]

const features = [
  {
    icon: 'record_voice_over',
    title: 'Voice-First Reporting',
    desc: 'Speak your situation naturally. Our AI transcribes and routes it to the right partners in seconds.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: 'location_on',
    title: 'Live Help Map',
    desc: 'Discover verified NGOs, shelters, clinics, and food banks near you — available in real time.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: 'track_changes',
    title: 'Real-Time Tracking',
    desc: 'Follow every step of your report from submission to resolution with live status updates.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: 'groups',
    title: 'Community Feed',
    desc: 'Stay informed. Read impact stories, volunteer for events, and see what NGOs are doing for your city.',
    color: 'bg-rose-50 text-rose-600',
  },
]

const recentActivity = [
  { category: 'Water Supply', title: 'Contamination in Sector 4 resolved', time: '2h ago', badge: 'badge-active', badgeLabel: 'Resolved' },
  { category: 'Road Safety', title: 'Fallen tree cleared from main road', time: '5h ago', badge: 'badge-active', badgeLabel: 'Resolved' },
  { category: 'Medical Aid', title: 'Emergency food distribution, East Block', time: '1d ago', badge: 'badge-pending', badgeLabel: 'Ongoing' },
  { category: 'Flood Warning', title: 'Shelter allocation for 200 families', time: '2d ago', badge: 'badge-urgent', badgeLabel: 'Urgent' },
]

export default function Home() {
  return (
    <CitizenLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="badge-tag mb-4 inline-flex">
              <span className="material-icons text-xs mr-1">bolt</span>
              Civic-tech for a connected community
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mt-3 mb-5">
              A call for help,<br />
              <span className="text-primary">a community that answers.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
              A premium civic-tech platform bridging the gap between critical situations and rapid response.
              Speak your need, and let our intelligent network route it to the right hands, instantly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/report" className="btn-primary text-sm py-3 px-6 flex items-center gap-2">
                <span className="material-icons text-lg">add_circle</span>
                Report an Issue
              </Link>
              <Link to="/map" className="btn-secondary text-sm py-3 px-6 flex items-center gap-2">
                <span className="material-icons text-lg">explore</span>
                Find Help Near You
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="material-icons text-primary text-2xl">{s.icon}</span>
                </div>
                <div className="font-heading font-bold text-2xl md:text-3xl text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-gap">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              How Pukaar Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From reporting to resolution — every step is designed for speed, clarity, and dignity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="pukaar-card p-6 group" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <span className="material-icons text-xl">{f.icon}</span>
                </div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="pb-20 bg-[var(--surface-container,#f2ecf4)]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Recent Activity</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Live updates from your community</p>
            </div>
            <Link to="/feed" className="btn-ghost text-sm">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="pukaar-card p-4 flex items-center gap-4 bg-white">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-primary text-lg">campaign</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.category}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                </div>
                <span className={item.badge}>{item.badgeLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 text-sm">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <span className="material-icons text-white text-sm">favorite</span>
            </div>
            <span className="text-white font-semibold font-heading">Pukaar</span>
            <span className="text-white/30">|</span>
            <span>Community Care Infrastructure</span>
          </div>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'NGO Partnership', 'Contact Us'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </CitizenLayout>
  )
}
