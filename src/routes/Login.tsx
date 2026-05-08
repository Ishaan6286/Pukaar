import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { signInWithGoogle } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const { isAuthenticated, profile, isLoading } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated && profile) {
    // If they have a saved 'from' location, send them there
    const from = (location.state as any)?.from?.pathname
    
    if (profile.role === 'ngo') {
      return <Navigate to={from && from.startsWith('/ngo') ? from : '/ngo/dashboard'} replace />
    } else {
      return <Navigate to={from && !from.startsWith('/ngo') ? from : '/'} replace />
    }
  }

  const handleLogin = async () => {
    setIsSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to sign in')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-xl p-8 relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <span className="material-icons text-white text-3xl">favorite</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Welcome to Pukaar</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to connect with your community and report civic issues.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2">
            <span className="material-icons text-rose-500 text-sm mt-0.5">error_outline</span>
            <span className="text-sm text-rose-700">{error}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isSigningIn || isLoading}
          className="w-full h-12 rounded-xl border border-border bg-white hover:bg-accent text-foreground font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSigningIn ? (
            <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our <a href="#" className="underline hover:text-foreground">Terms of Service</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
