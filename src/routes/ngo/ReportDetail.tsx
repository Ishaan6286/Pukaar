import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'

import CategoryBadge from '@/components/CategoryBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { acceptReport, resolveReport } from '@/lib/reports'
import type { Report, ReportStatus } from '@/types'

interface StatusPill {
  variant: 'default' | 'secondary' | 'outline'
  label: string
}

function statusPill(status: ReportStatus): StatusPill {
  switch (status) {
    case 'pending':
      return { variant: 'outline', label: 'Submitting…' }
    case 'submitted':
      return { variant: 'default', label: 'Submitted' }
    case 'accepted':
      return { variant: 'default', label: 'Accepted' }
    case 'resolved':
      return { variant: 'secondary', label: 'Resolved' }
  }
}

export default function ReportDetail(): ReactElement {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { reportId } = useParams<{ reportId: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user?.ngoId || !reportId) return
    const ref = doc(db, 'ngos', user.ngoId, 'incoming_reports', reportId)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setError('Report not found in your inbox.')
          setLoading(false)
          return
        }
        setReport(snap.data() as Report)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user?.ngoId, reportId])

  if (!user || !user.ngoId) {
    return (
      <p className="p-4 text-destructive">No NGO is associated with this admin account.</p>
    )
  }

  const ngoId = user.ngoId

  const onAccept = async (): Promise<void> => {
    if (!report) return
    setBusy(true)
    try {
      await acceptReport(report.id, ngoId, report.ngoName ?? 'Your NGO')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const onResolve = async (): Promise<void> => {
    if (!report) return
    setBusy(true)
    try {
      await resolveReport(report.id, ngoId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ngo/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Report detail</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : !report ? (
        <p className="text-sm text-muted-foreground">Report not found.</p>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              {report.ai ? (
                <>
                  <UrgencyBadge urgency={report.ai.urgency} />
                  <CategoryBadge category={report.ai.category} />
                </>
              ) : null}
            </div>
            <Badge variant={statusPill(report.status).variant}>
              {statusPill(report.status).label}
            </Badge>
          </CardHeader>
          <CardContent>
            {report.photoDataUrl ? (
              <img
                src={report.photoDataUrl}
                alt=""
                className="rounded-lg border w-full max-h-72 object-cover mb-3"
              />
            ) : null}
            {report.ai?.summary ? (
              <p className="font-medium">{report.ai.summary}</p>
            ) : null}
            {report.ai?.suggestedAction ? (
              <p className="text-sm mt-2">
                <span className="font-semibold">Suggested action:</span> {report.ai.suggestedAction}
              </p>
            ) : null}
            {report.ai && report.ai.suppliesNeeded.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Supplies:</span>
                {report.ai.suppliesNeeded.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
            {report.description ? (
              <p className="text-sm text-muted-foreground mt-3">{report.description}</p>
            ) : null}
            <p className="text-xs text-muted-foreground mt-3">
              From {report.reporterAnonHandle}
            </p>
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground">
                Lat: {report.location.lat.toFixed(5)}, Lng: {report.location.lng.toFixed(5)}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${report.location.lat},${report.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Open in Google Maps
              </a>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            {report.status === 'submitted' ? (
              <Button onClick={() => void onAccept()} disabled={busy}>
                Accept
              </Button>
            ) : null}
            {report.status === 'accepted' ? (
              <Button onClick={() => void onResolve()} disabled={busy}>
                Resolve
              </Button>
            ) : null}
            {report.status === 'resolved' ? (
              <Badge variant="secondary">Resolved</Badge>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
