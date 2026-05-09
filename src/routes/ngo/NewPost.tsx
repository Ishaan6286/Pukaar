import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'

import CameraCapture from '@/components/CameraCapture'
import type { PhotoCapture } from '@/components/CameraCapture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { Ngo, PostType } from '@/types'

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'drive', label: 'Drive' },
  { value: 'donation', label: 'Donation' },
  { value: 'update', label: 'Update' },
]

type NgoLookup =
  | { status: 'loading' }
  | { status: 'missing'; ngoId: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; name: string; logoUrl: string }

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ngoLookup, setNgoLookup] = useState<NgoLookup>({ status: 'loading' })
  const [type, setType] = useState<PostType>('drive')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState<PhotoCapture | null>(null)
  const [eventDate, setEventDate] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ngoId = user?.ngoId
    if (!ngoId) return
    let cancelled = false
    setNgoLookup({ status: 'loading' })
    getDoc(doc(db, 'ngos', ngoId))
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) {
          setNgoLookup({ status: 'missing', ngoId })
          return
        }
        const d = snap.data() as Ngo
        setNgoLookup({ status: 'ready', name: d.name, logoUrl: d.logoUrl })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setNgoLookup({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [user?.ngoId])

  if (!user) return null
  if (!user.ngoId) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <p>No NGO associated.</p>
      </div>
    )
  }

  const disabledReason: string | null = submitting
    ? 'Publishing…'
    : !user
      ? 'You must be signed in to publish.'
      : ngoLookup.status === 'loading'
        ? 'Loading your NGO details…'
        : ngoLookup.status === 'missing'
          ? `No NGO found with id "${ngoLookup.ngoId}". Check NGO_ADMIN_EMAIL_TO_NGO_ID in src/constants.ts and confirm the id matches a seeded NGO in scripts/seed-data.json.`
          : ngoLookup.status === 'error'
            ? `Couldn't load your NGO: ${ngoLookup.message}`
            : !title.trim()
              ? 'Add a title before publishing.'
              : !body.trim()
                ? 'Add a description before publishing.'
                : null

  async function handleSubmit() {
    if (disabledReason !== null) return
    if (!user?.ngoId || ngoLookup.status !== 'ready') return
    setSubmitting(true)
    setError(null)
    try {
      const postRef = doc(collection(db, 'posts'))
      await setDoc(postRef, {
        id: postRef.id,
        ngoId: user.ngoId,
        ngoName: ngoLookup.name,
        ngoLogoUrl: ngoLookup.logoUrl,
        type,
        title: title.trim(),
        body: body.trim(),
        photoUrl: photo?.dataUrl ?? null,
        eventDate:
          type === 'drive' && eventDate
            ? Timestamp.fromDate(new Date(eventDate))
            : null,
        location: null,
        rsvpCount: 0,
        createdAt: serverTimestamp(),
      })
      navigate('/ngo/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ngo/dashboard')}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium block mb-2">Post type</span>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={type === opt.value ? 'default' : 'outline'}
                className={cn(
                  'w-full',
                  type === opt.value &&
                    'bg-brand-gradient text-white shadow-soft hover:opacity-90',
                )}
                onClick={() => setType(opt.value)}
                disabled={submitting}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2" htmlFor="post-title">
            Title
          </label>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Spay & neuter drive"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2" htmlFor="post-body">
            Body
          </label>
          <Textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's happening?"
            rows={5}
            disabled={submitting}
          />
        </div>

        <div>
          <span className="text-sm font-medium block mb-2">Photo (optional)</span>
          <CameraCapture
            onCaptured={setPhoto}
            onCleared={() => setPhoto(null)}
            disabled={submitting}
          />
        </div>

        {type === 'drive' ? (
          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="post-eventdate">
              Event date
            </label>
            <Input
              id="post-eventdate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={submitting}
            />
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full mt-2 bg-brand-gradient text-white hover:opacity-90"
          disabled={disabledReason !== null}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </>
          )}
        </Button>

        {disabledReason && !submitting && (
          <p
            className={cn(
              'text-xs text-center mt-2',
              ngoLookup.status === 'missing' || ngoLookup.status === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground',
            )}
            role="status"
          >
            {disabledReason}
          </p>
        )}

        {error && (
          <p className="text-destructive text-sm mt-2 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
