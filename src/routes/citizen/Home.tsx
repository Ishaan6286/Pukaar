import { useNavigate } from 'react-router-dom'
import { ListChecks, MapPin, Newspaper, Plus, UserCircle } from 'lucide-react'

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
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {firstName}</h1>
          <p className="text-muted-foreground">What did you see today?</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void handleSignOut()
          }}
        >
          Sign out
        </Button>
      </div>

      <hr className="my-4 border-border" />

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full justify-start"
          onClick={() => navigate('/report')}
        >
          <Plus className="mr-2 h-5 w-5" />
          Report something
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/reports')}
        >
          <ListChecks className="mr-2 h-5 w-5" />
          My reports
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/map')}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Help map
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/feed')}
        >
          <Newspaper className="mr-2 h-5 w-5" />
          NGO feed
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/profile')}
        >
          <UserCircle className="mr-2 h-5 w-5" />
          My profile
        </Button>
      </div>

      <div className="flex-1" />

      <p className="text-xs text-muted-foreground text-center mt-8">
        Connecting people, NGOs, and communities.
      </p>
    </div>
  )
}
