import { ChefHat, Home, Navigation, PawPrint, UtensilsCrossed } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { HelpLocation, HelpLocationType } from '@/types'

export interface HelpLocationPinProps {
  location: HelpLocation
  onDirections: () => void
}

interface TypeMeta {
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const TYPE_META: Record<HelpLocationType, TypeMeta> = {
  food_bank: { label: 'Food bank', Icon: UtensilsCrossed },
  shelter: { label: 'Shelter', Icon: Home },
  animal_rescue: { label: 'Animal rescue', Icon: PawPrint },
  community_kitchen: { label: 'Community kitchen', Icon: ChefHat },
}

export default function HelpLocationPin({ location, onDirections }: HelpLocationPinProps) {
  const meta = TYPE_META[location.type]
  const Icon = meta.Icon

  return (
    <div className="w-64">
      <Badge variant="outline" className="gap-1">
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
      <Button size="sm" variant="default" className="mt-2 w-full" onClick={onDirections}>
        <Navigation className="mr-2 h-3 w-3" />
        Get directions
      </Button>
    </div>
  )
}
