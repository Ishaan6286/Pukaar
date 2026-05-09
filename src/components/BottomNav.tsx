import { Link, useLocation } from 'react-router-dom'
import {
  ClipboardList,
  Home,
  MapPin,
  Megaphone,
  UserCircle,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { cn } from '@/lib/utils'

interface TabSpec {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const SIDE_TABS_LEFT: TabSpec[] = [
  { to: '/', label: 'Feed', Icon: Home },
  { to: '/map', label: 'Map', Icon: MapPin },
]

const SIDE_TABS_RIGHT: TabSpec[] = [
  { to: '/reports', label: 'My reports', Icon: ClipboardList },
  { to: '/profile', label: 'Profile', Icon: UserCircle },
]

function isActive(pathname: string, target: string): boolean {
  if (target === '/') return pathname === '/'
  return pathname === target || pathname.startsWith(`${target}/`)
}

function SideTab({ tab, active }: { tab: TabSpec; active: boolean }) {
  const { Icon } = tab
  return (
    <Link
      to={tab.to}
      className="flex flex-col items-center gap-0.5 px-3 py-1"
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'h-5 w-5 transition-colors',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <span
        className={cn(
          'text-[10px] tracking-wide transition-colors',
          active ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
      >
        {tab.label}
      </span>
    </Link>
  )
}

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="max-w-md mx-auto flex items-center justify-around pt-2 pb-2">
        {SIDE_TABS_LEFT.map((tab) => (
          <SideTab key={tab.to} tab={tab} active={isActive(pathname, tab.to)} />
        ))}

        <Link
          to="/report"
          className="relative flex flex-col items-center"
          aria-label="Report"
        >
          <div className="w-12 h-12 -mt-4 rounded-full bg-brand-gradient text-white shadow-soft flex items-center justify-center">
            <Megaphone className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-wide text-muted-foreground mt-0.5">
            Report
          </span>
        </Link>

        {SIDE_TABS_RIGHT.map((tab) => (
          <SideTab key={tab.to} tab={tab} active={isActive(pathname, tab.to)} />
        ))}
      </div>
    </nav>
  )
}
