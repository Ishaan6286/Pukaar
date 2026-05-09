import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, RotateCcw, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resizeImageToBase64 } from '@/lib/imageResize'
import { MAX_PHOTO_BASE64_BYTES } from '@/constants'

export interface PhotoCapture {
  dataUrl: string
  base64: string
  mimeType: 'image/jpeg'
  sizeBytes: number
}

export interface CameraCaptureProps {
  onCaptured: (photo: PhotoCapture) => void
  onCleared?: () => void
  disabled?: boolean
}

type Phase = 'idle' | 'processing' | 'captured' | 'error'

export default function CameraCapture({
  onCaptured,
  onCleared,
  disabled,
}: CameraCaptureProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [photo, setPhoto] = useState<PhotoCapture | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function trigger() {
    inputRef.current?.click()
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) {
      input.value = ''
      return
    }
    setErrorMsg(null)
    setPhase('processing')
    try {
      const result = await resizeImageToBase64(file)
      if (result.sizeBytes > MAX_PHOTO_BASE64_BYTES) {
        setErrorMsg('Photo too large after resize. Try a less detailed scene.')
        setPhase('error')
      } else {
        const captured: PhotoCapture = {
          dataUrl: result.dataUrl,
          base64: result.base64,
          mimeType: 'image/jpeg',
          sizeBytes: result.sizeBytes,
        }
        setPhoto(captured)
        setPhase('captured')
        onCaptured(captured)
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Could not process photo: ${err.message}`
          : 'Could not process photo.',
      )
      setPhase('error')
    } finally {
      input.value = ''
    }
  }

  function clear() {
    setPhoto(null)
    setErrorMsg(null)
    setPhase('idle')
    onCleared?.()
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleChange(e)}
      />

      {phase === 'processing' && (
        <Button type="button" disabled>
          Processing photo…
        </Button>
      )}

      {(phase === 'idle' || phase === 'error') && (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={trigger}
            className="hover:ring-1 hover:ring-primary/20 transition-shadow"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take photo
          </Button>
          {phase === 'error' && errorMsg && (
            <p className="text-destructive text-sm">{errorMsg}</p>
          )}
        </>
      )}

      {phase === 'captured' && photo && (
        <div className="flex flex-col gap-2">
          <img
            src={photo.dataUrl}
            alt="Captured"
            className="rounded-xl border max-h-48 shadow-soft"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={disabled} onClick={trigger}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button type="button" variant="ghost" disabled={disabled} onClick={clear}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
