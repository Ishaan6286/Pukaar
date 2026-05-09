import type { ReactElement } from 'react'
import { AlertTriangle, Clock, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/types'

export interface UrgencyBadgeProps {
  urgency: Urgency
  className?: string
}

export default function UrgencyBadge({ urgency, className }: UrgencyBadgeProps): ReactElement {
  if (urgency === 'high') {
    return (
      <Badge variant="destructive" className={cn('px-2.5 py-1', className)}>
        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        High urgency
      </Badge>
    )
  }
  if (urgency === 'medium') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100',
          className,
        )}
      >
        <Clock className="h-3 w-3 mr-1" />
        Medium urgency
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50',
        className,
      )}
    >
      <Info className="h-3 w-3 mr-1" />
      Low urgency
    </Badge>
  )
}
