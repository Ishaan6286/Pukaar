import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { signOutCurrentUser, useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import type { Ngo } from '@/types'

export default function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [ngo, setNgo] = useState<{ name: string; logoUrl: string } | null>(null)
  const [reportCount, setReportCount] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role !== 'ngo_admin' || !user.ngoId) return
    const ngoId = user.ngoId
    let cancelled = false
    void getDoc(doc(db, 'ngos', ngoId)).then((snap) => {
      if (cancelled || !snap.exists()) return
      const d = snap.data() as Ngo
      setNgo({ name: d.name, logoUrl: d.logoUrl })
    })
    return () => {
      cancelled = true
    }
  }, [user?.role, user?.ngoId])

  useEffect(() => {
    if (!user) return
    if (user.role === 'citizen') {
      const q = query(collection(db, 'reports'), where('reporterUid', '==', user.uid))
      const unsub = onSnapshot(
        q,
        (snap) => setReportCount(snap.size),
        () => setReportCount(0),
      )
      return unsub
    }
    if (user.role === 'ngo_admin' && user.ngoId) {
      const q = collection(db, 'ngos', user.ngoId, 'incoming_reports')
      const unsub = onSnapshot(
        q,
        (snap) => setReportCount(snap.size),
        () => setReportCount(0),
      )
      return unsub
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  const isAdmin = user.role === 'ngo_admin'
  const initial = user.displayName?.[0]?.toUpperCase() ?? '?'
  const memberSince =
    user.createdAt && typeof user.createdAt.toDate === 'function'
      ? user.createdAt.toDate().toLocaleDateString()
      : '—'

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Profile</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-col items-center gap-3 space-y-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-20 h-20 rounded-full border object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold">
              {initial}
            </div>
          )}
          <p className="text-xl font-semibold">{user.displayName || 'Unnamed'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge variant={isAdmin ? 'default' : 'outline'}>
            {isAdmin ? 'NGO Admin' : 'Citizen'}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center">
            Member since {memberSince}
          </p>
          {isAdmin && ngo ? (
            <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-muted/30">
              <img
                src={ngo.logoUrl}
                alt=""
                className="w-10 h-10 rounded-full border"
              />
              <div>
                <p className="text-xs text-muted-foreground">Affiliated with</p>
                <p className="font-semibold">{ngo.name}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-6">
          <p className="text-3xl font-bold">{reportCount ?? '—'}</p>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'reports handled' : 'reports submitted'}
          </p>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full mt-6"
        onClick={async () => {
          await signOutCurrentUser()
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  )
}
