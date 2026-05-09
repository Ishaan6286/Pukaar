import { ChefHat, Home, Navigation, PawPrint, UtensilsCrossed } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { HelpLocation, HelpLocationType } from '@/types'

export interface HelpLocationPinProps {
  location: HelpLocation
  onDirections: () => void
}

interface TypeMeta {
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  badgeClass: string
}

const TYPE_META: Record<HelpLocationType, TypeMeta> = {
  food_bank: {
    label: 'Food bank',
    Icon: UtensilsCrossed,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50',
  },
  shelter: {
    label: 'Shelter',
    Icon: Home,
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-50',
  },
  animal_rescue: {
    label: 'Animal rescue',
    Icon: PawPrint,
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-50',
  },
  community_kitchen: {
    label: 'Community kitchen',
    Icon: ChefHat,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-50',
  },
}

export default function HelpLocationPin({ location, onDirections }: HelpLocationPinProps) {
  const meta = TYPE_META[location.type]
  const Icon = meta.Icon

  return (
    <div className="w-64">
      <Badge variant="outline" className={cn('gap-1', meta.badgeClass)}>
        <Icon className="h-3 w-3" />
        {meta.label}
      </Badge>
      <h3 className="font-semibold mt-1">{location.name}</h3>
      <p className="text-xs text-muted-foreground">{location.address}</p>
      <p className="text-xs">
        <span className="font-medium">Hours:</span> {location.hours}
      </p>
      <p className="text-xs">
        <span className="font-medium">Phone:</span> {location.phone}
      </p>
      <Button
        size="sm"
        className="mt-2 w-full bg-brand-gradient text-white hover:opacity-90"
        onClick={onDirections}
      >
        <Navigation className="mr-2 h-3 w-3" />
        Get directions
      </Button>
    </div>
  )
}
