import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CitizenLayout } from '@/components/Layout'
import VoiceRecorder from '@/components/VoiceRecorder'
import ImageUploader from '@/components/ImageUploader'
import { submitReport } from '@/lib/reports'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

type Step = 'method' | 'details' | 'location' | 'confirm'

const steps = [
  { id: 'method', label: 'Choose Method' },
  { id: 'details', label: 'Add Details' },
  { id: 'location', label: 'Location' },
  { id: 'confirm', label: 'Confirm' },
] as const

export default function ReportFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<'voice' | 'photo' | 'text' | null>(null)
  
  // Form State
  const [description, setDescription] = useState('')
  const [base64Audio, setBase64Audio] = useState<string | undefined>(undefined)
  const [base64Image, setBase64Image] = useState<string | undefined>(undefined)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  
  // Geolocation
  const [location, setLocation] = useState<{ lat: number, lng: number, address: string } | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const stepIdx = steps.findIndex(s => s.id === step)

  useEffect(() => {
    if (step === 'location' && !location && !isLocating) {
      handleGetLocation()
    }
  }, [step])

  const handleGetLocation = () => {
    setIsLocating(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Approximate Location (Resolved via GPS)'
          })
          setIsLocating(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          // Fallback location for demo purposes
          setLocation({ lat: 28.6139, lng: 77.2090, address: 'Sector 4, Downtown (Fallback)' })
          setIsLocating(false)
        }
      )
    } else {
      setLocation({ lat: 28.6139, lng: 77.2090, address: 'Sector 4, Downtown (Fallback)' })
      setIsLocating(false)
    }
  }

  const handleUploadComplete = (storageUrl: string, base64: string, type: 'voice' | 'photo') => {
    if (type === 'voice') setBase64Audio(base64)
    if (type === 'photo') setBase64Image(base64)
    
    setMediaUrls(prev => [...prev, storageUrl])
    setStep('details')
    toast.success('Media successfully processed')
  }

  const handleSubmit = async () => {
    if (!user || !location) {
      setError('Missing user session or location data.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await submitReport({
        userId: user.uid,
        description,
        location,
        base64Audio,
        base64Image,
        mediaUrls,
        onProgress: (status) => setProgressText(status)
      })

      toast.success('Report successfully submitted')

      // Ensure we see the success state briefly
      setTimeout(() => {
        navigate(`/reports/${result.reportId}`)
      }, 800)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Submission failed.')
      toast.error('Submission failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        
        {!isSubmitting && (
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Report an Issue</h1>
            <p className="text-muted-foreground">Your voice helps build a better community.</p>
          </div>
        )}

        {/* Stepper */}
        {!isSubmitting && (
          <div className="flex items-center mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-1.5 ${i <= stepIdx ? 'text-primary' : 'text-muted-foreground/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < stepIdx ? 'bg-primary border-primary text-white' :
                    i === stepIdx ? 'border-primary text-primary' : 'border-border text-muted-foreground/40'
                  }`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && !isSubmitting && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
            <span className="material-icons text-rose-500 mt-0.5">error_outline</span>
            <span className="text-sm text-rose-800 font-medium">{error}</span>
          </div>
        )}

        {/* --- STEP 1: METHOD --- */}
        {step === 'method' && !isSubmitting && (
          <div className="space-y-4 animate-fade-in-up">
            {method === 'voice' ? (
              <VoiceRecorder 
                onUploadComplete={(url, b64) => handleUploadComplete(url, b64, 'voice')} 
                onCancel={() => setMethod(null)} 
              />
            ) : method === 'photo' ? (
              <ImageUploader 
                onUploadComplete={(url, b64) => handleUploadComplete(url, b64, 'photo')}
                onCancel={() => setMethod(null)} 
              />
            ) : (
              <>
                {[
                  { id: 'voice' as const, icon: 'mic', title: 'Record Voice', desc: 'Speak naturally to describe the situation. AI transcribes and categorizes it.' },
                  { id: 'photo' as const, icon: 'camera_alt', title: 'Upload Photo', desc: 'Drag & drop or tap to capture visual evidence.' },
                  { id: 'text' as const, icon: 'edit_note', title: 'Describe Situation', desc: 'Type out the details clearly for faster routing.' },
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setMethod(m.id)
                      if (m.id === 'text') setStep('details') // Skip straight to details for text
                    }}
                    className="pukaar-card p-5 cursor-pointer flex items-start gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent group-hover:bg-primary/10">
                      <span className="material-icons text-2xl text-muted-foreground">{m.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground mb-1">{m.title}</h3>
                      <p className="text-muted-foreground text-sm">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* --- STEP 2: DETAILS --- */}
        {step === 'details' && !isSubmitting && (
          <div className="space-y-6 animate-fade-in-up pukaar-card p-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
              <textarea 
                className="pukaar-input resize-none min-h-[120px]" 
                placeholder="Describe the situation in detail..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>
            
            {(base64Audio || base64Image) && (
              <div className="p-4 bg-accent/50 rounded-xl flex items-center gap-3">
                <span className="material-icons text-primary">
                  {base64Audio ? 'mic' : 'image'}
                </span>
                <div className="text-sm text-foreground font-medium">
                  {base64Audio ? 'Voice note attached' : 'Photo attached'}
                </div>
                <span className="material-icons text-teal-500 ml-auto">check_circle</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <button className="btn-ghost" onClick={() => setStep('method')}>← Back</button>
              <button 
                className="btn-primary" 
                disabled={!description && !base64Audio && !base64Image} 
                onClick={() => setStep('location')}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: LOCATION --- */}
        {step === 'location' && !isSubmitting && (
          <div className="space-y-5 animate-fade-in-up">
            <p className="text-muted-foreground text-sm">We need your location to route the report to the nearest NGO.</p>
            
            <div className="pukaar-card overflow-hidden">
              <div className="map-bg h-48 relative flex items-center justify-center bg-accent/30">
                {isLocating ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-muted-foreground font-medium">Acquiring GPS Signal...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary shadow-[0_0_20px_rgba(79,55,138,0.4)] flex items-center justify-center z-10 relative animate-pulse">
                        <span className="material-icons text-white text-base">my_location</span>
                      </div>
                    </div>
                    {location && (
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-medium shadow-md border border-border">
                        📍 {location.address}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <button className="btn-ghost" onClick={() => setStep('details')}>← Back</button>
              <button 
                className="btn-primary" 
                onClick={() => setStep('confirm')}
                disabled={!location || isLocating}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: CONFIRM --- */}
        {step === 'confirm' && !isSubmitting && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="pukaar-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg">Report Summary</h3>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-3 text-sm">
                  <span className="material-icons text-muted-foreground text-lg mt-0.5">description</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Details</div>
                    <div className="font-medium text-foreground">{description || 'Provided via media upload'}</div>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <span className="material-icons text-muted-foreground text-lg mt-0.5">location_on</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Location</div>
                    <div className="font-medium text-foreground">{location?.address || 'GPS Coordinates Provided'}</div>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <span className="material-icons text-muted-foreground text-lg mt-0.5">attachment</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Attachments</div>
                    <div className="font-medium text-foreground">
                      {mediaUrls.length > 0 ? `${mediaUrls.length} File(s) Uploaded` : 'None'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pukaar-card p-4 bg-primary/5 border-primary/20 flex items-start gap-3">
              <span className="material-icons text-primary mt-0.5">auto_awesome</span>
              <p className="text-xs text-foreground leading-relaxed">
                <strong>Gemini AI Integration</strong><br/>
                Upon submission, Firebase AI Logic will instantly classify your issue, assign priority, and ping the nearest responsive NGO.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button className="btn-ghost" onClick={() => setStep('location')}>← Back</button>
              <button className="btn-primary py-3 px-8 shadow-lg shadow-primary/20" onClick={handleSubmit}>
                <span className="flex items-center gap-2 font-bold text-sm">
                  <span className="material-icons text-lg">send</span>
                  Submit to Pukaar
                </span>
              </button>
            </div>
          </div>
        )}

        {/* --- SUBMISSION LOADING STATE --- */}
        {isSubmitting && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center animate-fade-in-up">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <span className="material-icons text-primary text-4xl">auto_awesome</span>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90 text-primary animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100 200" strokeLinecap="round" />
              </svg>
            </div>
            
            <h2 className="font-heading text-xl font-bold text-foreground mb-3 text-center">
              Processing Report
            </h2>
            
            <div className="h-6 overflow-hidden relative w-64 text-center">
              <p className="text-sm text-muted-foreground font-medium absolute w-full transition-all animate-fade-in-up">
                {progressText || 'Initializing...'}
              </p>
            </div>

            <div className="w-64 h-1.5 bg-accent rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/2 origin-left"></div>
            </div>
          </div>
        )}

      </div>
    </CitizenLayout>
  )
}
