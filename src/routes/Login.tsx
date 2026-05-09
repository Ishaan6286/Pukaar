import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signInWithGoogle, useAuth } from '@/lib/auth'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    navigate(user.role === 'ngo_admin' ? '/ngo/dashboard' : '/', { replace: true })
  }, [user, navigate])

  async function handleSignIn() {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-app-canvas">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-brand-wash pointer-events-none" />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <img
          src="/pukaar.jpeg"
          alt="Pukaar"
          className="w-28 h-28 mb-4 drop-shadow-md select-none rounded-2xl"
          draggable={false}
        />
        <h1 className="pukaar-wordmark text-3xl mb-2">Pukaar</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
          Connecting people, NGOs, and communities to deliver help where it's needed most.
        </p>

        <Card className="w-full max-w-sm shadow-soft-lg animate-pop-in">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Use your Google account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-brand-gradient text-white hover:opacity-90"
              disabled={submitting}
              onClick={() => {
                void handleSignIn()
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in with Google
                </>
              )}
            </Button>
            {error && <p className="text-destructive text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
          By signing in you agree to use Pukaar for community good.
        </p>
      </div>
    </div>
  )
}
