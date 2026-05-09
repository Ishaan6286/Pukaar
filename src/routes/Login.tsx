import { useState, useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { signInCitizen, signInNgo, signInAdmin } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

// Live impact stats displayed on the hero panel
const STATS = [
  { value: '12,400+', label: 'Reports Filed' },
  { value: '340+',    label: 'NGOs Connected' },
  { value: '8 min',   label: 'Avg Response' },
]

// Floating activity feed on the hero side
const LIVE_FEED = [
  { icon: 'water_drop',         color: 'bg-blue-500/20 text-blue-300',   text: 'Water leak reported · Koramangala', time: '2m ago' },
  { icon: 'volunteer_activism', color: 'bg-teal-500/20 text-teal-300',   text: 'NGO dispatched · Whitefield',       time: '5m ago' },
  { icon: 'medical_services',   color: 'bg-rose-500/20 text-rose-300',   text: 'Medical aid resolved · Indiranagar', time: '9m ago' },
  { icon: 'home',               color: 'bg-amber-500/20 text-amber-300', text: 'Shelter request accepted · HSR',     time: '14m ago' },
]

export default function Login() {
  const { roleType = 'user' } = useParams<{ roleType: string }>()
  const { isAuthenticated, profile, isLoading } = useAuth()
  const location = useLocation()
  
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [feedIdx, setFeedIdx] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Cycle through live-feed items
  useEffect(() => {
    const id = setInterval(() => setFeedIdx(i => (i + 1) % LIVE_FEED.length), 3000)
    return () => clearInterval(id)
  }, [])

  // --- Auth redirect ---
  if (!isLoading && isAuthenticated && profile) {
    const from = (location.state as any)?.from?.pathname
    if (from) return <Navigate to={from} replace />
    return <Navigate to={`/dashboard/${profile.role}`} replace />
  }

  const handleGoogleLogin = async () => {
    setIsSigningIn(true)
    setError(null)
    try {
      await signInCitizen()
    } catch (err: any) {
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled. Please try again.'
        : err?.message || 'Unable to sign in. Try again shortly.'
      setError(msg)
      setIsSigningIn(false)
    }
  }

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    setError(null)
    try {
      if (roleType === 'ngo') {
        await signInNgo(email, password)
      } else if (roleType === 'admin') {
        await signInAdmin(email, password)
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden bg-[#0f0e17]">

      {/* ── LEFT HERO PANEL ─────────────────────────────────── */}
      <div className="relative lg:w-[55%] flex flex-col justify-between p-10 lg:p-14 overflow-hidden min-h-[42vh] lg:min-h-full">

        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[80px] animate-orb" />
          <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px] animate-orb" style={{ animationDelay: '-4s' }} />
          <div className="absolute -bottom-40 left-1/3 w-[350px] h-[350px] rounded-full bg-teal-500/10 blur-[90px] animate-orb" style={{ animationDelay: '-8s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        {/* Logo */}
        <div className={`relative z-10 flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <img src="/logo.png" alt="Pukaar Logo" className="w-14 h-14 object-contain" />
        </div>

        {/* Hero copy */}
        <div className={`relative z-10 space-y-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-medium text-white/70">Live across Bengaluru</span>
          </div>

          <h1 className="font-heading text-4xl lg:text-[3.25rem] font-bold text-white leading-[1.1] tracking-tight">
            Community response<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-teal-300">
              begins with one report.
            </span>
          </h1>

          <p className="text-white/50 text-base lg:text-lg leading-relaxed max-w-md">
            Pukaar connects citizens, NGOs, and volunteers in realtime — turning urgent reports into coordinated action.
          </p>

          {/* Impact stats */}
          <div className="flex gap-6 pt-2">
            {STATS.map((s, i) => (
              <div key={s.label} className="space-y-0.5" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="font-heading font-bold text-xl text-white">{s.value}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live activity feed card */}
        <div className={`relative z-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Live Activity</span>
            </div>
            {LIVE_FEED.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${i === feedIdx ? 'opacity-100' : 'opacity-30'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <span className="material-icons text-base">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 font-medium truncate">{item.text}</div>
                </div>
                <div className="text-[10px] text-white/30 flex-shrink-0">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ────────────────────────────────── */}
      <div className="lg:w-[45%] flex items-center justify-center p-8 lg:p-14 bg-white dark:bg-[#18171f]">
        <div className={`w-full max-w-[380px] transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/logo.png" alt="Pukaar Logo" className="w-10 h-10 object-contain" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-heading text-[1.75rem] font-bold text-foreground tracking-tight leading-snug">
              {roleType === 'admin' ? 'Admin Portal' : roleType === 'ngo' ? 'NGO Portal' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {roleType === 'admin' ? 'Sign in to manage Pukaar.' : roleType === 'ngo' ? 'Sign in to manage your operations.' : 'Sign in to your account to continue.'}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-start gap-2.5 animate-fade-in-up">
              <span className="material-icons text-rose-500 text-[18px] mt-0.5 flex-shrink-0">error_outline</span>
              <span className="text-sm text-rose-700 dark:text-rose-400 leading-snug">{error}</span>
            </div>
          )}

          {roleType === 'user' ? (
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn || isLoading}
              className="group w-full h-[52px] rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/5 hover:bg-accent dark:hover:bg-white/10 text-foreground font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)' }}
              />
              {isSigningIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Signing you in…</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm">Continue with Google</span>
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Email address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[52px] rounded-xl border border-border dark:border-white/10 bg-transparent px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="admin@ngo.org"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[52px] rounded-xl border border-border dark:border-white/10 bg-transparent px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn || isLoading}
                className="w-full h-[52px] mt-2 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 hover:bg-primary/90"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Signing in...</span>
                  </>
                ) : (
                  <span className="text-sm">Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-border dark:bg-white/10" />
            <span className="text-xs text-muted-foreground">secure sign-in</span>
            <div className="flex-1 h-px bg-border dark:bg-white/10" />
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'lock',           label: 'End-to-end encrypted' },
              { icon: 'verified_user',  label: 'NGO verified data' },
              { icon: 'privacy_tip',    label: 'No data sold' },
            ].map(t => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent/50 dark:bg-white/5">
                <span className="material-icons text-primary dark:text-purple-400 text-lg">{t.icon}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{t.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
            By signing in, you agree to our{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>

          {/* NGO registration CTA */}
          {roleType === 'user' && (
            <div className="mt-6 p-4 rounded-xl border border-dashed border-border dark:border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-primary text-lg">business</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-foreground">Are you an NGO?</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Contact us to get your organisation onboarded.</div>
              </div>
              <span className="material-icons text-muted-foreground text-base">arrow_forward</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
