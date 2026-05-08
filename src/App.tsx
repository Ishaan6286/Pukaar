// TODO(person 4): wrap with auth provider + RoleGate so route access is gated
// by the signed-in user's role. For now this is just a layout shell so all
// routes are publicly accessible during dev.
import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  )
}
