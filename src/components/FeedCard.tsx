import { useEffect, useState } from 'react'
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { Post, PostType } from '@/types'

export interface FeedCardProps {
  post: Post
  className?: string
}

const TYPE_LABELS: Record<PostType, string> = {
  drive: 'Drive',
  donation: 'Donation',
  update: 'Update',
}

function relativeTime(ts: Timestamp): string {
  const date = ts.toDate()
  const diff = Date.now() - date.getTime()
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return 'just now'
  if (diff < hour) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 2 * day) return 'Yesterday'
  return date.toLocaleDateString()
}

export default function FeedCard({ post, className }: FeedCardProps) {
  const { user } = useAuth()
  const [hasRsvped, setHasRsvped] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!user) {
        if (!cancelled) setHasRsvped(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'posts', post.id, 'rsvps', user.uid))
        if (!cancelled) setHasRsvped(snap.exists())
      } catch (e) {
        console.error('rsvp lookup failed', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, post.id])

  async function onToggleRsvp() {
    if (!user) return
    setBusy(true)
    try {
      const rsvpRef = doc(db, 'posts', post.id, 'rsvps', user.uid)
      const postRef = doc(db, 'posts', post.id)
      const batch = writeBatch(db)
      if (hasRsvped) {
        batch.delete(rsvpRef)
        batch.update(postRef, { rsvpCount: increment(-1) })
      } else {
        batch.set(rsvpRef, {
          uid: user.uid,
          displayName: user.displayName ?? '',
          status: 'going',
          createdAt: serverTimestamp(),
        })
        batch.update(postRef, { rsvpCount: increment(1) })
      }
      await batch.commit()
      setHasRsvped(!hasRsvped)
    } catch (e) {
      console.error('rsvp failed', e)
    } finally {
      setBusy(false)
    }
  }

  const directionsHref = post.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${post.location.lat},${post.location.lng}`
    : null

  function renderAction() {
    if (post.type === 'update') return <span />
    if (post.type === 'donation') {
      return hasRsvped ? (
        <Button variant="secondary" onClick={() => void onToggleRsvp()} disabled={busy}>
          Pledged ✓
        </Button>
      ) : (
        <Button
          onClick={() => void onToggleRsvp()}
          disabled={busy || !user}
          className="bg-brand-gradient text-white hover:opacity-90"
        >
          Pledge
        </Button>
      )
    }
    return hasRsvped ? (
      <Button variant="secondary" onClick={() => void onToggleRsvp()} disabled={busy}>
        Going ✓
      </Button>
    ) : (
      <Button
        onClick={() => void onToggleRsvp()}
        disabled={busy || !user}
        className="bg-brand-gradient text-white hover:opacity-90"
      >
        RSVP
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        'overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        {post.ngoLogoUrl ? (
          <img
            src={post.ngoLogoUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center text-sm font-semibold">
            {post.ngoName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">{post.ngoName}</p>
          <p className="text-xs text-muted-foreground">
            {relativeTime(post.createdAt)} · {TYPE_LABELS[post.type]}
          </p>
        </div>
        <Badge variant="outline">{TYPE_LABELS[post.type]}</Badge>
      </CardHeader>

      {post.photoUrl ? (
        <img src={post.photoUrl} alt="" className="w-full max-h-80 object-cover" />
      ) : null}

      <CardContent className="pt-3">
        <h3 className="font-semibold">{post.title}</h3>
        <p className="text-sm whitespace-pre-line">{post.body}</p>
        {post.eventDate ? (
          <p className="text-xs text-muted-foreground mt-2">
            📅 {post.eventDate.toDate().toLocaleString()}
          </p>
        ) : null}
        {directionsHref ? (
          <a
            className="text-xs text-primary underline mt-1 inline-block"
            target="_blank"
            rel="noopener noreferrer"
            href={directionsHref}
          >
            📍 Open in Maps
          </a>
        ) : null}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{post.rsvpCount} going</span>
        {renderAction()}
      </CardFooter>
    </Card>
  )
}
