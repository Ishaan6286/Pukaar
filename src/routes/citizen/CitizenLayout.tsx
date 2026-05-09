import { Outlet } from 'react-router-dom'
import { Heart } from 'lucide-react'

import BottomNav from '@/components/BottomNav'

export default function CitizenLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-app-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">NGO Connect</span>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <div className="max-w-md mx-auto">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
