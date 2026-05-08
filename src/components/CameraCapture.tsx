import { useState, useRef, useEffect, useCallback } from 'react'

export interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onCancel: () => void
  className?: string
}

export default function CameraCapture({ onCapture, onCancel, className = '' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      
      setStream(newStream)
      setError(null)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access the camera. Please check permissions.')
    }
  }, [stream])

  // Initialize camera on mount
  useEffect(() => {
    startCamera(facingMode)
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentional: only run on mount, handle facing mode changes manually

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    startCamera(newMode)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video source
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob)
        setCapturedUrl(URL.createObjectURL(blob))
        
        // Stop the live feed to save battery while previewing
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }, 'image/jpeg', 0.9)
  }

  const retakePhoto = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedUrl(null)
    setCapturedBlob(null)
    startCamera(facingMode)
  }

  const confirmPhoto = () => {
    if (capturedBlob) {
      onCapture(capturedBlob)
    }
  }

  return (
    <div className={`relative w-full max-w-lg mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* Viewfinder / Preview Area */}
      <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full bg-neutral-900 flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center">
            <span className="material-icons text-rose-500 text-4xl mb-2">videocam_off</span>
            <p className="text-white text-sm">{error}</p>
          </div>
        ) : capturedUrl ? (
          <img src={capturedUrl} alt="Captured preview" className="w-full h-full object-contain" />
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Hidden Canvas for extracting the frame */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black flex items-center justify-between">
        {capturedUrl ? (
          <>
            <button 
              onClick={retakePhoto}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-icons text-sm">refresh</span>
              Retake
            </button>
            <button 
              onClick={confirmPhoto}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              Use Photo
              <span className="material-icons text-sm">check</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onCancel}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-icons">close</span>
            </button>

            <button 
              onClick={capturePhoto}
              disabled={!!error}
              className="w-16 h-16 rounded-full border-4 border-white/50 flex items-center justify-center focus:outline-none hover:border-white transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-white transition-transform active:scale-90"></div>
            </button>

            <button 
              onClick={toggleCamera}
              disabled={!!error}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              <span className="material-icons">flip_camera_ios</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
