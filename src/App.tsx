import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    </AuthProvider>
  )
}
