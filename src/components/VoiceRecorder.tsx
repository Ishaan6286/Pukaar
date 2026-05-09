import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MAX_AUDIO_BYTES_INLINE } from '@/constants'

export interface VoiceRecording {
  blob: Blob
  mimeType: string
  durationMs: number
  base64: string
}

export interface VoiceRecorderProps {
  onRecorded: (rec: VoiceRecording) => void
  onCleared?: () => void
  disabled?: boolean
}

type Phase = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

function pickMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

function formatMmSs(ms: number): string {
  const totalS = Math.floor(ms / 1000)
  const mm = String(Math.floor(totalS / 60)).padStart(2, '0')
  const ss = String(totalS % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected FileReader result'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.readAsDataURL(blob)
  })
}

export default function VoiceRecorder({
  onRecorded,
  onCleared,
  disabled,
}: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      const rec = recorderRef.current
      if (rec && rec.state === 'recording') {
        try {
          rec.stop()
        } catch {
          /* best-effort */
        }
      }
      const stream = streamRef.current
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
        streamRef.current = null
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [])

  function stopTick() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function stopStream() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
  }

  function revokeUrl() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }

  async function start() {
    if (typeof MediaRecorder === 'undefined') {
      setErrorMsg('Voice recording is not supported in this browser.')
      setPhase('error')
      return
    }
    setErrorMsg(null)
    setElapsedMs(0)
    setPhase('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Microphone unavailable: ${err.message}`
          : 'Microphone unavailable.',
      )
      setPhase('error')
      return
    }
    streamRef.current = stream
    chunksRef.current = []

    const mime = pickMime()
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    } catch (err) {
      stopStream()
      setErrorMsg(
        err instanceof Error
          ? `Could not start recorder: ${err.message}`
          : 'Could not start recorder.',
      )
      setPhase('error')
      return
    }
    recorderRef.current = recorder

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stopTick()
      const durationMs = performance.now() - startTimeRef.current
      const usedMime = recorder.mimeType || mime || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: usedMime })
      stopStream()

      void (async () => {
        try {
          const base64 = await blobToBase64(blob)
          if (blob.size > MAX_AUDIO_BYTES_INLINE) {
            setErrorMsg('Recording too long for this demo. Try under 30 seconds.')
            setPhase('error')
            return
          }
          revokeUrl()
          const url = URL.createObjectURL(blob)
          urlRef.current = url
          setAudioUrl(url)
          setPhase('recorded')
          onRecorded({ blob, mimeType: usedMime, durationMs, base64 })
        } catch (err) {
          setErrorMsg(
            err instanceof Error ? `Recording failed: ${err.message}` : 'Recording failed.',
          )
          setPhase('error')
        }
      })()
    }

    startTimeRef.current = performance.now()
    intervalRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startTimeRef.current)
    }, 250)

    try {
      recorder.start()
    } catch (err) {
      stopTick()
      stopStream()
      setErrorMsg(
        err instanceof Error
          ? `Could not start recorder: ${err.message}`
          : 'Could not start recorder.',
      )
      setPhase('error')
      return
    }
    setPhase('recording')
  }

  function stop() {
    const rec = recorderRef.current
    if (rec && rec.state === 'recording') rec.stop()
  }

  function clear() {
    revokeUrl()
    setAudioUrl(null)
    setElapsedMs(0)
    setErrorMsg(null)
    setPhase('idle')
    onCleared?.()
  }

  if (phase === 'requesting') {
    return (
      <Button type="button" disabled>
        Requesting mic…
      </Button>
    )
  }

  if (phase === 'recording') {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={stop}
        className="ring-2 ring-destructive/20"
      >
        <Square className="mr-2 h-4 w-4" />
        Stop ({formatMmSs(elapsedMs)})
      </Button>
    )
  }

  if (phase === 'recorded' && audioUrl) {
    return (
      <div className="flex flex-col gap-2">
        <audio controls src={audioUrl} className="w-full" />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              clear()
              void start()
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-record
          </Button>
          <Button type="button" variant="ghost" disabled={disabled} onClick={clear}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => void start()}
        className="hover:ring-1 hover:ring-primary/20 transition-shadow"
      >
        <Mic className="mr-2 h-4 w-4" />
        Record voice
      </Button>
      {phase === 'error' && errorMsg && (
        <p className="text-destructive text-sm">{errorMsg}</p>
      )}
    </div>
  )
}
