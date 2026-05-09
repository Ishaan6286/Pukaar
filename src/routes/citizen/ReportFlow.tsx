import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import CameraCapture from '@/components/CameraCapture'
import type { PhotoCapture } from '@/components/CameraCapture'
import VoiceRecorder from '@/components/VoiceRecorder'
import type { VoiceRecording } from '@/components/VoiceRecorder'
import { useAuth } from '@/lib/auth'
import { createReport } from '@/lib/reports'
import { DEFAULT_DEMO_LOCATION } from '@/constants'
import type { LatLng } from '@/types'

type LocationStatus = 'idle' | 'requesting' | 'ready' | 'error'
type AudioMimeType = 'audio/webm' | 'audio/mp4' | 'audio/wav' | 'audio/mpeg'

export default function ReportFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [photo, setPhoto] = useState<PhotoCapture | null>(null)
  const [voice, setVoice] = useState<VoiceRecording | null>(null)
  const [description, setDescription] = useState('')
  const hasGeolocation =
    typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [location, setLocation] = useState<LatLng | null>(() =>
    hasGeolocation ? null : DEFAULT_DEMO_LOCATION,
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() =>
    hasGeolocation ? 'requesting' : 'error',
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasGeolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('ready')
      },
      () => {
        setLocation(DEFAULT_DEMO_LOCATION)
        setLocationStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [hasGeolocation])

  if (!user) return null

  async function handleSubmit() {
    if (!user || !location) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const baseAudioMimeType = (voice?.mimeType.split(';')[0] ||
        'audio/webm') as AudioMimeType
      const reportId = await createReport({
        reporterUid: user.uid,
        description: description.trim() || undefined,
        photoDataUrl: photo?.dataUrl,
        audioBase64: voice?.base64,
        audioMimeType: voice ? baseAudioMimeType : undefined,
        location,
      })
      navigate(`/reports/${reportId}`, { replace: true })
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Submission failed. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const hasInput = Boolean(photo) || Boolean(voice) || description.trim().length > 0
  const submitDisabled = submitting || location === null || !hasInput

  let locationPill: string | null = null
  if (locationStatus === 'requesting') locationPill = 'Locating you…'
  else if (locationStatus === 'ready') locationPill = 'Location ready'
  else if (locationStatus === 'error') locationPill = 'Using demo location (Bengaluru)'

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <h1 className="text-2xl font-semibold mt-2">Report something</h1>
      <p className="text-muted-foreground text-sm">
        Use any combination — voice, photo, or text. We'll route it.
      </p>

      {locationPill && (
        <div className="mt-3 inline-flex self-start rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          {locationPill}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <CameraCapture
              onCaptured={setPhoto}
              onCleared={() => setPhoto(null)}
              disabled={submitting}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voice</CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceRecorder
              onRecorded={setVoice}
              onCleared={() => setVoice(null)}
              disabled={submitting}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Describe</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Optional — what did you see?"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button
          size="lg"
          className="w-full"
          disabled={submitDisabled}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Submit report
            </>
          )}
        </Button>
        {submitError && (
          <p className="text-destructive text-sm mt-2">{submitError}</p>
        )}
      </div>
    </div>
  )
}
