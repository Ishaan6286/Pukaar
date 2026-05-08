import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { compressImage, fileToBase64 } from '@/lib/image'
import { uploadFile } from '@/lib/storage'
import CameraCapture from './CameraCapture'

export interface ImageUploaderProps {
  onUploadComplete?: (storageUrl: string, base64Image: string) => void
  onCancel?: () => void
  className?: string
  storagePath?: string // e.g. 'reports/images/'
}

type UploaderMode = 'idle' | 'camera' | 'preview' | 'uploading'

export default function ImageUploader({ 
  onUploadComplete, 
  onCancel, 
  className = '',
  storagePath = 'reports/images/'
}: ImageUploaderProps) {
  
  const [mode, setMode] = useState<UploaderMode>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File | Blob) => {
    try {
      setError(null)
      // Preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Compress
      const compressedBlob = await compressImage(file, 1920, 0.8)
      setSelectedFile(compressedBlob)
      setMode('preview')
    } catch (err) {
      console.error('Compression error:', err)
      setError('Failed to process the image. Please try another one.')
    }
  }

  // --- Drag and Drop Handlers ---
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        handleFileSelect(file)
      } else {
        setError('Please upload a valid image file (JPEG, PNG).')
      }
    }
  }

  // --- Click Handlers ---
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setMode('uploading')
    setError(null)

    try {
      // 1. Convert to Base64 for Gemini
      const base64Image = await fileToBase64(selectedFile)

      // 2. Upload to Firebase
      // Convert Blob to File to ensure correct metadata
      const fileExt = selectedFile.type === 'image/png' ? 'png' : 'jpg'
      const fileObj = new File([selectedFile], `capture_${Date.now()}.${fileExt}`, { type: selectedFile.type })
      
      const storageUrl = await uploadFile(fileObj, storagePath, (progress) => {
        setUploadProgress(progress)
      })

      if (onUploadComplete) {
        onUploadComplete(storageUrl, base64Image)
      }
      
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Please check your connection and try again.')
      setMode('preview')
    }
  }

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
    setMode('idle')
  }

  // --- Render logic based on mode ---
  
  if (mode === 'camera') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <CameraCapture 
          onCapture={(blob) => {
            handleFileSelect(blob)
            setMode('preview') // The handleFileSelect sets preview, this ensures UI updates
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
            <div className="w-px h-16 bg-border mx-2"></div>
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

      {(mode === 'preview' || mode === 'uploading') && previewUrl && (
        <div className="flex flex-col">
          <div className="relative aspect-video sm:aspect-auto sm:h-64 bg-neutral-900 overflow-hidden">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            
            {mode === 'uploading' && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-white text-xs font-medium">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
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
                onClick={handleUpload}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
              >
                <span className="material-icons text-sm">cloud_upload</span>
                Upload Image
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
