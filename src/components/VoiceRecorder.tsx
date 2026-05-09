import { useState, useRef, useEffect } from 'react'
import { getSupportedMimeType, blobToBase64, formatRecordingTime } from '@/lib/audio'

export interface VoiceRecorderProps {
  /** Called when the user confirms their recording. base64Audio is raw base64 (no data: prefix). */
  onRecordComplete?: (base64Audio: string) => void
  onCancel?: () => void
  className?: string
}

export default function VoiceRecorder({ onRecordComplete, onCancel, className = '' }: VoiceRecorderProps) {
  // State
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  
  // Audio Analysis Refs (for waveform)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      cleanup() // Ensure clean state
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
      audioChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Setup Audio Context for Waveform
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextCtor()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream)
      sourceNodeRef.current.connect(analyserRef.current)

      // Setup MediaRecorder
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined
      
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mime = getSupportedMimeType() || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mime })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(100) // Collect data in 100ms chunks
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Start drawing waveform
      drawWaveform()

    } catch (err: any) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      drawWaveform()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleConfirmAudio = async () => {
    if (!audioBlob) return
    setError(null)
    try {
      // Convert to base64 for Gemini — audio is NOT stored, just passed to AI
      const base64Audio = await blobToBase64(audioBlob)
      if (onRecordComplete) {
        onRecordComplete(base64Audio)
      }
    } catch (err) {
      console.error('Audio conversion failed:', err)
      setError('Failed to process audio. Please try again.')
    }
  }

  const discardRecording = () => {
    cleanup()
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || isPaused) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(dataArray)

      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0)' // Transparent background
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = '#4f378a' // Primary color

      canvasCtx.beginPath()

      const sliceWidth = canvas.width * 1.0 / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * canvas.height / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2">
          <span className="material-icons text-rose-500 text-sm mt-0.5">error_outline</span>
          <span className="text-sm text-rose-700">{error}</span>
        </div>
      )}

      {!isRecording && !audioBlob && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-icons text-primary text-3xl">mic</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Record Voice Report</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
            Describe the situation clearly. You can pause and resume the recording.
          </p>
          <button 
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            <span className="material-icons text-lg">fiber_manual_record</span>
            Start Recording
          </button>
        </div>
      )}

      {isRecording && !audioBlob && (
        <div className="flex flex-col items-center py-4">
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full bg-rose-500 ${!isPaused && 'animate-pulse'}`}></div>
            <span className="text-2xl font-mono font-medium text-foreground tracking-wider">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>

          <div className="w-full max-w-sm h-16 bg-accent/50 rounded-xl mb-8 overflow-hidden relative border border-border">
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full"
              width={400} 
              height={64}
            />
          </div>

          <div className="flex items-center gap-4">
            {isPaused ? (
              <button 
                onClick={resumeRecording}
                className="w-12 h-12 rounded-full bg-accent text-foreground flex items-center justify-center hover:bg-accent/80 transition-colors"
                title="Resume"
              >
                <span className="material-icons text-xl">play_arrow</span>
              </button>
            ) : (
              <button 
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full bg-accent text-foreground flex items-center justify-center hover:bg-accent/80 transition-colors"
                title="Pause"
              >
                <span className="material-icons text-xl">pause</span>
              </button>
            )}

            <button 
              onClick={stopRecording}
              className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all active:scale-95 shadow-md shadow-rose-500/20"
              title="Stop & Save"
            >
              <span className="material-icons text-2xl">stop</span>
            </button>
          </div>
        </div>
      )}

      {audioBlob && audioUrl && (
        <div className="flex flex-col py-2">
          <h3 className="font-semibold text-foreground mb-4">Preview Recording</h3>
          
          <audio 
            src={audioUrl} 
            controls 
            className="w-full mb-6 outline-none" 
          />


          <div className="flex items-center gap-3">
              <button
                onClick={discardRecording}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white text-muted-foreground font-medium hover:bg-accent transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmAudio}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
              >
                <span className="material-icons text-base">check</span>
                Use this Recording
              </button>
            </div>
        </div>
      )}

      {/* Footer controls if needed (Cancel button exposed from props) */}
      {!isRecording && !audioBlob && onCancel && (
        <div className="mt-4 pt-4 border-t border-border flex justify-center">
          <button 
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

    </div>
  )
}
