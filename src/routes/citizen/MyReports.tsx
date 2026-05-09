import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import ReportCard from '@/components/ReportCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import type { Report } from '@/types'

export default function MyReports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'reports'),
      where('reporterUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReports(snap.docs.map((d) => ({ ...(d.data() as Report), id: d.id })))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">My reports</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-4 ml-12">
        {reports.length} {reports.length === 1 ? 'report' : 'reports'}
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-32 rounded-lg" />
          <div className="skeleton h-32 rounded-lg" />
          <div className="skeleton h-32 rounded-lg" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : reports.length === 0 ? (
        <Card className="shadow-soft animate-fade-in-up">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground">
              Spotted something that needs help? Send your first report.
            </p>
            <Button
              type="button"
              className="bg-brand-gradient text-white hover:opacity-90 mt-2"
              onClick={() => navigate('/report')}
            >
              Report something
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              variant="citizen"
              report={r}
              onClick={() => navigate(`/reports/${r.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
