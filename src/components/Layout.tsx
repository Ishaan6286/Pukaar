import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'

const citizenNavItems = [
  { icon: 'home', label: 'Home', to: '/dashboard/user' },
  { icon: 'add_circle', label: 'Report', to: '/dashboard/user/report' },
  { icon: 'explore', label: 'Map', to: '/dashboard/user/map' },
  { icon: 'forum', label: 'Feed', to: '/dashboard/user/feed' },
  { icon: 'person', label: 'Profile', to: '/dashboard/user/profile' },
]

export function TopNav() {
  const loc = useLocation()
  const { profile } = useAuth()
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard/user" className="flex items-center gap-2">
          <img src="/logo.png" alt="Pukaar Logo" className="w-8 h-8 object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Home', to: '/dashboard/user' },
            { label: 'Reporting', to: '/dashboard/user/report' },
            { label: 'Impact', to: '/dashboard/user/feed' },
            { label: 'Map', to: '/dashboard/user/map' },
          ].map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                loc.pathname === n.to
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {profile?.role === 'ngo' && (
            <Link to="/dashboard/ngo" className="btn-ghost text-xs">
              NGO Portal →
            </Link>
          )}
          <button onClick={signOut} className="btn-ghost text-xs flex items-center gap-1 text-muted-foreground hover:text-rose-600">
            <span className="material-icons text-sm">logout</span>
            Sign Out
          </button>
          <Link to="/dashboard/user/report" className="btn-primary text-xs">
            <span className="flex items-center gap-1">
              <span className="material-icons text-sm">add</span>
              Report Issue
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const loc = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {citizenNavItems.map(item => {
          const isActive = loc.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
