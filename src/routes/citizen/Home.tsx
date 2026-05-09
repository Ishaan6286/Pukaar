import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Heart,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  Newspaper,
  UserCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { signOutCurrentUser, useAuth } from '@/lib/auth'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  async function handleSignOut() {
    await signOutCurrentUser()
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-brand-gradient w-8 h-8 rounded-xl flex items-center justify-center shadow-soft">
            <Heart aria-hidden="true" className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">NGO Connect</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={() => {
            void handleSignOut()
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Hi, {firstName}</h1>
        <p className="text-muted-foreground text-base mt-1">
          What did you see today?
        </p>
      </div>

      <hr className="my-6 border-border" />

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full justify-start bg-brand-gradient text-white hover:opacity-90"
          onClick={() => navigate('/report')}
        >
          <Megaphone className="mr-2 h-5 w-5" />
          Report something
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start bg-card shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigate('/reports')}
        >
          <ListChecks className="mr-2 h-5 w-5" />
          My reports
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start bg-card shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigate('/map')}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Help map
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start bg-card shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigate('/feed')}
        >
          <Newspaper className="mr-2 h-5 w-5" />
          NGO feed
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start bg-card shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigate('/profile')}
        >
          <UserCircle className="mr-2 h-5 w-5" />
          My profile
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </div>

      <div className="flex-1" />

      <p className="text-xs text-muted-foreground text-center mt-8">
        Connecting people, NGOs, and communities.
      </p>
    </div>
  )
}
