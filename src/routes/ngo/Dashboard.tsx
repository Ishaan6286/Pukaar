import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

import ReportCard from '@/components/ReportCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { signOutCurrentUser, useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { acceptReport, resolveReport } from '@/lib/reports'
import type { Report, Urgency } from '@/types'

const URGENCY_RANK: Record<Urgency, number> = { high: 3, medium: 2, low: 1 }

function sortByUrgencyAndRecency(reports: Report[]): Report[] {
  return [...reports].sort((a, b) => {
    const ra = a.ai ? URGENCY_RANK[a.ai.urgency] : 0
    const rb = b.ai ? URGENCY_RANK[b.ai.urgency] : 0
    if (rb !== ra) return rb - ra
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export default function Dashboard(): ReactElement {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.ngoId) return
    const q = query(
      collection(db, 'ngos', user.ngoId, 'incoming_reports'),
      where('status', 'in', ['submitted', 'accepted']),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as Report)
        setReports(sortByUrgencyAndRecency(docs))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user?.ngoId])

  if (!user || !user.ngoId) {
    return (
      <p className="p-4 text-destructive">No NGO is associated with this admin account.</p>
    )
  }

  const ngoId = user.ngoId

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">NGO Inbox</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ngo/posts/new')}>
            + New post
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void signOutCurrentUser()}>
            Sign out
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading inbox…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Inbox is empty. New reports will appear here in real time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              variant="ngo"
              busy={busyId === r.id}
              onClick={() => navigate(`/ngo/reports/${r.id}`)}
              onAccept={async () => {
                setBusyId(r.id)
                try {
                  await acceptReport(r.id, ngoId, r.ngoName ?? 'Your NGO')
                } finally {
                  setBusyId(null)
                }
              }}
              onResolve={async () => {
                setBusyId(r.id)
                try {
                  await resolveReport(r.id, ngoId)
                } finally {
                  setBusyId(null)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
