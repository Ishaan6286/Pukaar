import type { ReactElement } from 'react'
import { HeartHandshake, PawPrint, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ReportCategory } from '@/types'

export interface CategoryBadgeProps {
  category: ReportCategory
  className?: string
}

export default function CategoryBadge({ category, className }: CategoryBadgeProps): ReactElement {
  if (category === 'animal_welfare') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-orange-50 text-orange-800 border-orange-100 hover:bg-orange-50',
          className,
        )}
      >
        <PawPrint className="h-3 w-3 mr-1" />
        Animal welfare
      </Badge>
    )
  }
  if (category === 'person_welfare') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-50',
          className,
        )}
      >
        <HeartHandshake className="h-3 w-3 mr-1" />
        Person welfare
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-sky-50 text-sky-800 border-sky-100 hover:bg-sky-50',
        className,
      )}
    >
      <Users className="h-3 w-3 mr-1" />
      Community need
    </Badge>
  )
}
