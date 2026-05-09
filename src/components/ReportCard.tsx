import type { KeyboardEvent, MouseEvent, ReactElement } from 'react'

import CategoryBadge from '@/components/CategoryBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Report, ReportStatus } from '@/types'

export interface ReportCardProps {
  report: Report
  variant: 'ngo' | 'citizen'
  onClick?: () => void
  onAccept?: () => void
  onResolve?: () => void
  busy?: boolean
  className?: string
}

interface StatusPill {
  variant: 'default' | 'secondary' | 'outline'
  label: string
}

function statusPill(status: ReportStatus, variant: 'ngo' | 'citizen', ngoName?: string): StatusPill {
  switch (status) {
    case 'pending':
      return { variant: 'outline', label: 'Submitting…' }
    case 'submitted':
      return { variant: 'default', label: 'Submitted' }
    case 'accepted':
      return {
        variant: 'default',
        label: variant === 'citizen' && ngoName ? `Accepted by ${ngoName}` : 'Accepted',
      }
    case 'resolved':
      return { variant: 'secondary', label: 'Resolved' }
  }
}

export default function ReportCard({
  report,
  variant,
  onClick,
  onAccept,
  onResolve,
  busy,
  className,
}: ReportCardProps): ReactElement {
  const pill = statusPill(report.status, variant, report.ngoName)
  const clickable = Boolean(onClick)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const stop = (handler?: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    handler?.()
  }

  const showAccept = variant === 'ngo' && report.status === 'submitted'
  const showResolve = variant === 'ngo' && report.status === 'accepted'
  const showFooter = showAccept || showResolve

  return (
    <Card
      className={cn(clickable && 'cursor-pointer hover:bg-accent/30 transition-colors', className)}
      onClick={onClick}
      onKeyDown={clickable ? handleKeyDown : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          {report.ai ? (
            <>
              <UrgencyBadge urgency={report.ai.urgency} />
              <CategoryBadge category={report.ai.category} />
            </>
          ) : null}
        </div>
        <Badge variant={pill.variant}>{pill.label}</Badge>
      </CardHeader>
      <CardContent>
        {report.photoDataUrl ? (
          <img
            src={report.photoDataUrl}
            alt=""
            className="rounded-lg border w-full max-h-40 object-cover mb-3"
          />
        ) : null}
        {report.audioUrl ? (
          <audio controls src={report.audioUrl} className="w-full mb-3" />
        ) : null}
        {report.ai?.summary ? (
          <p className="text-sm font-medium">{report.ai.summary}</p>
        ) : report.description ? (
          <p className="text-sm text-muted-foreground">{report.description}</p>
        ) : null}
        {variant === 'ngo' && report.ai ? (
          <>
            <p className="text-sm mt-2">
              <span className="font-semibold">Suggested action:</span> {report.ai.suggestedAction}
            </p>
            {report.ai.suppliesNeeded.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Supplies:</span>
                {report.ai.suppliesNeeded.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground mt-2">From {report.reporterAnonHandle}</p>
          </>
        ) : null}
        {variant === 'citizen' && report.ngoName ? (
          <p className="text-xs text-muted-foreground mt-2">Routed to {report.ngoName}</p>
        ) : null}
      </CardContent>
      {showFooter ? (
        <CardFooter>
          {showAccept ? (
            <Button onClick={stop(onAccept)} disabled={busy} className="w-full">
              Accept
            </Button>
          ) : null}
          {showResolve ? (
            <Button onClick={stop(onResolve)} disabled={busy} variant="default" className="w-full">
              Resolve
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  )
}
