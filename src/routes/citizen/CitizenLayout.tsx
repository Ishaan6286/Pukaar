import { Outlet } from 'react-router-dom'

import BottomNav from '@/components/BottomNav'

export default function CitizenLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-app-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/pukaar.jpeg"
              alt=""
              className="w-8 h-8 select-none rounded-lg"
              draggable={false}
            />
            <span className="pukaar-wordmark text-lg">Pukaar</span>
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
