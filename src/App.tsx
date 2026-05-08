import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { initAuthListener } from '@/lib/auth'
import { Toaster } from 'sonner'

export default function App() {
  useEffect(() => {
    const unsubscribe = initAuthListener()
    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#1c1b1f', color: '#fff', border: 'none' },
        className: 'font-sans'
      }} />
    </div>
  )
}
