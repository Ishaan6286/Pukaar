import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarHeart,
  CalendarPlus,
  Check,
  Heart,
  HeartHandshake,
  MapPin,
  Megaphone,
  Share2,
} from 'lucide-react'
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

const TYPE_BADGE_CLASS: Record<PostType, string> = {
  drive: 'bg-violet-50 text-violet-800 border-violet-100 hover:bg-violet-50',
  donation: 'bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-50',
  update: 'bg-sky-50 text-sky-800 border-sky-100 hover:bg-sky-50',
}

const READ_MORE_THRESHOLD = 240

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

function relativeEventLabel(eventDate: Date): string {
  const now = Date.now()
  const diff = eventDate.getTime() - now
  const day = 24 * 60 * 60 * 1000
  if (diff < -day) return 'Event ended'
  if (diff < 0) return 'Happening today'
  const days = Math.round(diff / day)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `In ${days} days`
  return `In ${Math.round(days / 7)} weeks`
}

function googleCalendarUrl(post: Post, eventDate: Date): string {
  const start = new Date(eventDate.getTime())
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: post.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: post.body,
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
}

function labelForCount(type: PostType): string {
  if (type === 'drive') return 'going'
  if (type === 'donation') return 'pledged'
  return ''
}

function TypeBadge({ type }: { type: PostType }) {
  const className = cn('gap-0', TYPE_BADGE_CLASS[type])
  if (type === 'drive') {
    return (
      <Badge variant="outline" className={className}>
        <CalendarHeart className="h-3 w-3 mr-1" />
        {TYPE_LABELS[type]}
      </Badge>
    )
  }
  if (type === 'donation') {
    return (
      <Badge variant="outline" className={className}>
        <Heart className="h-3 w-3 mr-1" />
        {TYPE_LABELS[type]}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={className}>
      <Megaphone className="h-3 w-3 mr-1" />
      {TYPE_LABELS[type]}
    </Badge>
  )
}

export default function FeedCard({ post, className }: FeedCardProps) {
  const { user } = useAuth()
  const [hasRsvped, setHasRsvped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)

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

  async function onTogglePrimary() {
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

  async function onShare() {
    const url = `${window.location.origin}/ngos/${post.ngoId}`
    const shareData = {
      title: post.title,
      text: `${post.ngoName}: ${post.title}`,
      url,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast('Link copied to clipboard')
        setTimeout(() => setShareToast(null), 2000)
      }
    } catch {
      /* user cancelled native share — silent */
    }
  }

  const mapsUrl = post.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${post.location.lat},${post.location.lng}`
    : null

  const eventDate = post.eventDate ? post.eventDate.toDate() : null

  const showReadMore = post.body.length > READ_MORE_THRESHOLD
  const bodyClass = cn(
    'text-sm text-foreground/85 leading-relaxed mt-1 whitespace-pre-line',
    showReadMore && !expanded && 'line-clamp-3',
  )

  function renderPrimaryAction() {
    if (post.type === 'update') {
      return (
        <span className="text-xs text-muted-foreground">{post.ngoName} update</span>
      )
    }
    if (post.type === 'donation') {
      return hasRsvped ? (
        <Button
          variant="secondary"
          onClick={() => void onTogglePrimary()}
          disabled={busy}
        >
          <Check className="mr-2 h-4 w-4" />
          Pledged
        </Button>
      ) : (
        <Button
          onClick={() => void onTogglePrimary()}
          disabled={busy || !user}
          className="bg-brand-gradient text-white hover:opacity-90"
        >
          <HeartHandshake className="mr-2 h-4 w-4" />
          Donate
        </Button>
      )
    }
    return hasRsvped ? (
      <Button
        variant="secondary"
        onClick={() => void onTogglePrimary()}
        disabled={busy}
      >
        <Check className="mr-2 h-4 w-4" />
        Going
      </Button>
    ) : (
      <Button
        onClick={() => void onTogglePrimary()}
        disabled={busy || !user}
        className="bg-brand-gradient text-white hover:opacity-90"
      >
        <CalendarPlus className="mr-2 h-4 w-4" />
        RSVP
      </Button>
    )
  }

  const countSuffix = labelForCount(post.type)
  const showCount = post.type !== 'update' && post.rsvpCount > 0 && countSuffix

  return (
    <Card
      className={cn(
        'overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow',
        className,
      )}
    >
      <CardHeader className="space-y-0">
        <div className="flex flex-row items-center gap-3">
          <Link
            to={`/ngos/${post.ngoId}`}
            className="flex flex-1 items-center gap-3 hover:bg-muted/40 -m-3 p-3 rounded-t-lg transition-colors min-w-0"
          >
            {post.ngoLogoUrl ? (
              <img
                src={post.ngoLogoUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {post.ngoName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight truncate">{post.ngoName}</p>
              <p className="text-xs text-muted-foreground">
                {relativeTime(post.createdAt)} · {TYPE_LABELS[post.type]}
              </p>
            </div>
          </Link>
          <TypeBadge type={post.type} />
        </div>
      </CardHeader>

      {post.photoUrl ? (
        <img
          src={post.photoUrl}
          alt=""
          className="w-full aspect-[4/5] object-cover"
        />
      ) : null}

      <CardContent className="pt-3">
        <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
        <p className={bodyClass}>{post.body}</p>
        {showReadMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {post.type === 'drive' && eventDate ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/60 p-3">
            <div className="w-10 h-10 rounded-lg bg-brand-gradient text-white flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {eventDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {relativeEventLabel(eventDate)}
              </p>
            </div>
            <a
              href={googleCalendarUrl(post, eventDate)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              Add to calendar
            </a>
          </div>
        ) : null}

        {mapsUrl ? (
          <a
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href={mapsUrl}
          >
            <MapPin className="h-3.5 w-3.5" />
            View location
          </a>
        ) : null}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">{renderPrimaryAction()}</div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onShare()}
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {showCount ? (
              <span className="text-xs text-muted-foreground">
                {post.rsvpCount} {countSuffix}
              </span>
            ) : null}
          </div>
        </div>
        {shareToast ? (
          <p className="text-xs text-muted-foreground text-center">{shareToast}</p>
        ) : null}
      </CardFooter>
    </Card>
  )
}
