import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'

const sidebarItems = [
  { icon: 'dashboard', label: 'NGO Dashboard', to: '/ngo/dashboard' },
  { icon: 'assignment', label: 'Reports', to: '/ngo/reports' },
  { icon: 'location_on', label: 'Help Map', to: '/map' },
  { icon: 'groups', label: 'Community Feed', to: '/feed' },
  { icon: 'monitoring', label: 'Analytics', to: '/ngo/analytics' },
  { icon: 'help_outline', label: 'Support', to: '/ngo/support' },
  { icon: 'settings', label: 'Settings', to: '/ngo/settings' },
]

export function NgoLayout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const { profile } = useAuth()
  
  return (
    <div className="min-h-screen bg-[#0f0d14] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#12101a]">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/80 flex items-center justify-center">
              <span className="material-icons text-white text-base">favorite</span>
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-white">NGO Portal</div>
              <div className="text-[10px] text-white/50 leading-none">Operation Center</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {sidebarItems.map(item => {
            const isActive = loc.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="material-icons text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors py-1.5">
            <span className="material-icons text-sm">arrow_back</span>
            Back to Citizen View
          </Link>
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-white/40 hover:text-rose-400 transition-colors py-1.5 w-full text-left">
            <span className="material-icons text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0f0d14]">
          <div>
            <h1 className="font-heading font-bold text-base text-white">Pukaar</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors">
              <span className="material-icons text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-white">{profile?.displayName || 'Admin'}</div>
                <div className="text-[10px] text-white/40">NGO Role</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || 'N'
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
