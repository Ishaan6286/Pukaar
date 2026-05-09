import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import {
  BadgeCheck,
  Clock,
  FileText,
  Frown,
  Globe,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'

import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CategoryBadge from '@/components/CategoryBadge'
import FeedCard from '@/components/FeedCard'
import type { Ngo, Post } from '@/types'

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number | null | undefined
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">
        {loading ? (
          <span className="skeleton inline-block w-10 h-5 align-middle" />
        ) : value === null || value === undefined ? (
          '—'
        ) : (
          value
        )}
      </p>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function NgoProfile() {
  const { ngoId } = useParams<{ ngoId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ngo, setNgo] = useState<Ngo | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [reportsHandled, setReportsHandled] = useState<number | null>(null)
  const [loadingNgo, setLoadingNgo] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ngoId) return
    let cancelled = false
    setLoadingNgo(true)
    setError(null)
    getDoc(doc(db, 'ngos', ngoId))
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) {
          setError("This NGO doesn't exist or was removed.")
          setLoadingNgo(false)
          return
        }
        setNgo(snap.data() as Ngo)
        setLoadingNgo(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setLoadingNgo(false)
      })
    return () => {
      cancelled = true
    }
  }, [ngoId])

  useEffect(() => {
    if (!ngoId) return
    const q = query(collection(db, 'posts'), where('ngoId', '==', ngoId))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ ...(d.data() as Post), id: d.id }))
        docs.sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() ?? 0
          const bMs = b.createdAt?.toMillis?.() ?? 0
          return bMs - aMs
        })
        setPosts(docs)
        setLoadingPosts(false)
      },
      (err) => {
        setError(err.message)
        setLoadingPosts(false)
      },
    )
    return unsub
  }, [ngoId])

  useEffect(() => {
    if (!ngoId) return
    const ref = collection(db, 'ngos', ngoId, 'incoming_reports')
    const unsub = onSnapshot(
      ref,
      (snap) => setReportsHandled(snap.size),
      () => setReportsHandled(null),
    )
    return unsub
  }, [ngoId])

  if (loadingNgo) {
    return (
      <div className="px-4 py-4 animate-fade-in-up">
        <div className="space-y-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-32" />
          <div className="skeleton h-64" />
        </div>
      </div>
    )
  }

  if (error || !ngo) {
    return (
      <div className="px-4 py-4 animate-fade-in-up">
        <div className="rounded-xl border bg-card shadow-soft p-6 text-center">
          <Frown className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-medium">NGO not found</p>
          {error ? (
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          ) : null}
        </div>
      </div>
    )
  }

  const isOwnAdmin =
    user?.role === 'ngo_admin' && user.ngoId === ngoId

  const showContactCard =
    !!ngo.hours ||
    !!ngo.contactPhone ||
    !!ngo.contactEmail ||
    !!ngo.website ||
    !!ngo.location

  return (
    <div className="px-4 py-4 animate-fade-in-up space-y-4">
      {isOwnAdmin && (
        <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 flex items-center justify-between text-sm">
          <span>You're viewing your own NGO's profile.</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/ngo/dashboard')}
          >
            Go to dashboard
          </Button>
        </div>
      )}

      <Card className="shadow-soft overflow-hidden">
        <div className="bg-brand-gradient h-20" />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end justify-between">
            <img
              src={ngo.logoUrl}
              alt=""
              className="w-20 h-20 rounded-2xl border-4 border-card object-cover bg-card shadow-soft"
            />
            {ngo.verified && (
              <Badge
                variant="secondary"
                className="mb-1 bg-violet-50 text-violet-800 border border-violet-100"
              >
                <BadgeCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-3">{ngo.name}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {ngo.description}
          </p>
          {ngo.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ngo.categories.map((c) => (
                <CategoryBadge key={c} category={c} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Posts" value={posts.length} loading={loadingPosts} />
        <MetricCard
          label="Reports handled"
          value={reportsHandled}
          loading={reportsHandled === null && !error}
        />
        <MetricCard label="Volunteers" value={ngo.volunteerCount} />
        <MetricCard label="Established" value={ngo.establishedYear} />
      </div>

      {showContactCard && (
        <Card className="shadow-soft">
          <CardContent className="pt-5 space-y-3">
            {ngo.hours && <Row icon={<Clock />} label="Hours" value={ngo.hours} />}
            {ngo.contactPhone && (
              <Row
                icon={<Phone />}
                label="Phone"
                value={
                  <a
                    href={`tel:${ngo.contactPhone}`}
                    className="text-primary hover:underline"
                  >
                    {ngo.contactPhone}
                  </a>
                }
              />
            )}
            {ngo.contactEmail && (
              <Row
                icon={<Mail />}
                label="Email"
                value={
                  <a
                    href={`mailto:${ngo.contactEmail}`}
                    className="text-primary hover:underline break-all"
                  >
                    {ngo.contactEmail}
                  </a>
                }
              />
            )}
            {ngo.website && (
              <Row
                icon={<Globe />}
                label="Website"
                value={
                  <a
                    href={ngo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {ngo.website.replace(/^https?:\/\//, '')}
                  </a>
                }
              />
            )}
            {ngo.location && (
              <Row
                icon={<MapPin />}
                label="Location"
                value={
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${ngo.location.lat},${ngo.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open in Maps
                  </a>
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">Posts</h2>
        {loadingPosts && (
          <div className="space-y-4">
            <div className="skeleton h-72" />
            <div className="skeleton h-72" />
          </div>
        )}
        {!loadingPosts && posts.length === 0 && (
          <div className="rounded-xl border bg-card shadow-soft p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium">No posts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ngo.name} hasn't posted yet.
            </p>
          </div>
        )}
        {!loadingPosts && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((p) => (
              <FeedCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
