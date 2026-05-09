import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'

import CategoryBadge from '@/components/CategoryBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { Report } from '@/types'

interface StepProps {
  done: boolean
  active: boolean
  label: string
  isLast?: boolean
  nextDone?: boolean
}

function Step({ done, active, label, isLast, nextDone }: StepProps) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition-colors',
            done
              ? 'bg-brand-gradient text-white shadow-soft'
              : 'bg-card border border-border',
            active && !done && 'ring-4 ring-primary/15',
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : null}
        </div>
        {!isLast ? (
          <div
            className={cn(
              'w-px flex-1',
              nextDone ? 'bg-brand-gradient' : 'bg-border',
            )}
          />
        ) : null}
      </div>
      <div className={cn('pb-6 pt-1', done ? 'font-medium' : 'text-muted-foreground')}>
        {label}
      </div>
    </li>
  )
}

export default function ReportStatus() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId) return
    const unsub = onSnapshot(
      doc(db, 'reports', reportId),
      (snap) => {
        if (!snap.exists()) {
          setReport(null)
          setError('Report not found.')
          setLoading(false)
          return
        }
        setReport(snap.data() as Report)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [reportId])

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/reports')}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Report status</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-32 rounded-lg" />
        </div>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : !report ? (
        <p className="text-muted-foreground">Report not found.</p>
      ) : (
        <Body report={report} />
      )}
    </div>
  )
}

function Body({ report }: { report: Report }) {
  const submitted = report.status !== 'pending'
  const aiDone = report.ai != null
  const accepted = report.status === 'accepted' || report.status === 'resolved'
  const resolved = report.status === 'resolved'
  const acceptedLabel = report.ngoName ? `Accepted by ${report.ngoName}` : 'Accepted'

  const states = [submitted, aiDone, accepted, resolved]
  const activeIndex = states.findIndex((s) => !s)

  return (
    <div className="animate-fade-in-up">
      <ol className="space-y-0">
        <Step
          done={submitted}
          active={activeIndex === 0}
          label="Submitted"
          nextDone={aiDone}
        />
        <Step
          done={aiDone}
          active={activeIndex === 1}
          label="AI classified"
          nextDone={accepted}
        />
        <Step
          done={accepted}
          active={activeIndex === 2}
          label={acceptedLabel}
          nextDone={resolved}
        />
        <Step done={resolved} active={activeIndex === 3} label="Resolved" isLast />
      </ol>

      {report.ai ? (
        <Card className="mt-4 shadow-soft">
          <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
            <UrgencyBadge urgency={report.ai.urgency} />
            <CategoryBadge category={report.ai.category} />
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium leading-snug">{report.ai.summary}</p>
            {report.photoDataUrl ? (
              <img
                src={report.photoDataUrl}
                alt=""
                className="rounded-xl border w-full max-h-60 object-cover mt-3 shadow-soft"
              />
            ) : null}
            {report.ngoName ? (
              <p className="text-sm text-muted-foreground mt-3">
                Routed to {report.ngoName}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
