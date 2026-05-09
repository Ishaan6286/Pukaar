import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
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
  label: string
  isLast?: boolean
}

function Step({ done, label, isLast }: StepProps) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full shrink-0',
            done ? 'bg-primary text-primary-foreground' : 'border border-border',
          )}
        >
          {done ? <CheckCircle2 className="h-3 w-3" /> : null}
        </div>
        {!isLast ? <div className="w-px flex-1 bg-border" /> : null}
      </div>
      <div className={cn('pb-6 pt-0.5', done ? 'font-medium' : 'text-muted-foreground')}>
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
        <h1 className="text-2xl font-semibold">Report status</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
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

  return (
    <>
      <ol className="space-y-0">
        <Step done={submitted} label="Submitted" />
        <Step done={aiDone} label="AI classified" />
        <Step done={accepted} label={acceptedLabel} />
        <Step done={resolved} label="Resolved" isLast />
      </ol>

      {report.ai ? (
        <Card className="mt-4">
          <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
            <UrgencyBadge urgency={report.ai.urgency} />
            <CategoryBadge category={report.ai.category} />
          </CardHeader>
          <CardContent>
            <p className="font-medium">{report.ai.summary}</p>
            {report.photoDataUrl ? (
              <img
                src={report.photoDataUrl}
                alt=""
                className="rounded-lg border w-full max-h-60 object-cover mt-3"
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
    </>
  )
}
