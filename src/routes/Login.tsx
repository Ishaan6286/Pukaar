import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, LogIn } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-soft-lg animate-pop-in border-border/60">
          <CardHeader className="items-center text-center">
            <div className="bg-brand-gradient w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft mb-2">
              <Heart aria-hidden="true" className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="tracking-tight">NGO Connect</CardTitle>
            <CardDescription>
              Connecting people, NGOs, and communities to deliver help where it is
              needed most.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              className="w-full bg-brand-gradient text-white hover:opacity-90"
              onClick={() => {
                void handleSignIn()
              }}
              disabled={submitting}
            >
              <LogIn aria-hidden="true" className="mr-2 h-4 w-4" />
              {submitting ? 'Signing in…' : 'Sign in with Google'}
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-4">
          By signing in, you agree to use this for community good.
        </p>
      </div>
    </div>
  )
}
