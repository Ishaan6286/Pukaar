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
      <Badge variant="destructive" className={cn(className)}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        High urgency
      </Badge>
    )
  }
  if (urgency === 'medium') {
    return (
      <Badge variant="default" className={cn(className)}>
        <Clock className="h-3 w-3 mr-1" />
        Medium urgency
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className={cn(className)}>
      <Info className="h-3 w-3 mr-1" />
      Low urgency
    </Badge>
  )
}
