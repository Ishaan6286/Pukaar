/**
 * ImagePicker — drag/drop + camera capture component.
 *
 * Architecture note: This component does NOT upload to Firebase Storage.
 * It accepts a File, resizes it client-side via resizeImageToBase64(), and
 * emits a base64 data URL via onPickComplete(). Callers write the dataUrl
 * to Firestore as `photoDataUrl`.
 */
import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { resizeImageToBase64 } from '@/lib/imageResize'
import CameraCapture from './CameraCapture'

export interface ImagePickerProps {
  /** Called once the image is resized. dataUrl is safe to store in Firestore. */
  onPickComplete: (dataUrl: string, base64: string) => void
  onCancel?: () => void
  className?: string
}

type PickerMode = 'idle' | 'camera' | 'preview' | 'processing'

export default function ImagePicker({ onPickComplete, onCancel, className = '' }: ImagePickerProps) {
  const [mode, setMode] = useState<PickerMode>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    try {
      setError(null)
      // Show local object URL as instant preview before resize
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setSelectedFile(file)
      setMode('preview')
    } catch (err) {
      console.error('Preview error:', err)
      setError('Failed to preview the image. Please try another.')
    }
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) handleFileSelect(file)
    else setError('Please drop a valid image file (JPEG, PNG).')
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleConfirm = async () => {
    if (!selectedFile) return
    setMode('processing')
    setError(null)
    try {
      const result = await resizeImageToBase64(selectedFile)
      // Revoke the object URL now that we have the dataUrl
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onPickComplete(result.dataUrl, result.base64)
    } catch (err) {
      console.error('Resize error:', err)
      setError('Failed to process image. Please try another.')
      setMode('preview')
    }
  }

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    setMode('idle')
  }

  if (mode === 'camera') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <CameraCapture
          onCapture={(blob) => {
            // Convert Blob → File for consistent handling
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
            handleFileSelect(file)
          }}
          onCancel={() => setMode('idle')}
        />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-colors ${
      isDragging ? 'border-primary shadow-lg shadow-primary/10' : 'border-border shadow-sm'
    } ${className}`}>

      {error && (
        <div className="m-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2">
          <span className="material-icons text-rose-500 text-sm mt-0.5">error_outline</span>
          <span className="text-sm text-rose-700">{error}</span>
        </div>
      )}

      {mode === 'idle' && (
        <div
          className="p-8 flex flex-col items-center justify-center"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-accent/50 hover:bg-accent flex items-center justify-center text-primary transition-colors"
              title="Upload File"
            >
              <span className="material-icons text-3xl">image</span>
            </button>
            <div className="w-px h-16 bg-border mx-2" />
            <button
              onClick={() => setMode('camera')}
              className="w-16 h-16 rounded-full bg-accent/50 hover:bg-accent flex items-center justify-center text-primary transition-colors"
              title="Open Camera"
            >
              <span className="material-icons text-3xl">photo_camera</span>
            </button>
          </div>

          <h3 className="font-semibold text-foreground mb-1">Add a Photo</h3>
          <p className="text-sm text-muted-foreground text-center">
            Drag & drop an image, browse your files, or take a live photo.
          </p>

          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={onFileChange}
          />

          {onCancel && (
            <button onClick={onCancel} className="mt-6 text-sm text-muted-foreground hover:text-foreground font-medium">
              Cancel
            </button>
          )}
        </div>
      )}

      {(mode === 'preview' || mode === 'processing') && previewUrl && (
        <div className="flex flex-col">
          <div className="relative aspect-video sm:aspect-auto sm:h-64 bg-neutral-900 overflow-hidden">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />

            {mode === 'processing' && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-3" />
                <span className="text-white text-sm font-medium">Resizing…</span>
              </div>
            )}
          </div>

          {mode === 'preview' && (
            <div className="p-4 bg-card flex flex-wrap sm:flex-nowrap items-center gap-3">
              <button
                onClick={handleDiscard}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground font-medium hover:bg-accent transition-colors whitespace-nowrap"
              >
                Discard
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
              >
                <span className="material-icons text-sm">check</span>
                Use This Photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
