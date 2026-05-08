import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NgoLayout } from '@/components/NgoLayout'
import { createCommunityPost } from '@/lib/feed'
import { useAuth } from '@/hooks/useAuth'
import { PostType } from '@/types'
import ImageUploader from '@/components/ImageUploader'

const POST_TYPES: { id: PostType; icon: string; label: string }[] = [
  { id: 'event', icon: 'event', label: 'Local Event' },
  { id: 'success', icon: 'star', label: 'Success Story' },
  { id: 'urgent', icon: 'priority_high', label: 'Urgent Need' },
  { id: 'volunteer', icon: 'volunteer_activism', label: 'Volunteer Call' },
]

export default function NewPost() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [postType, setPostType] = useState<PostType>('event')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  
  // Optional fields
  const [metrics, setMetrics] = useState('')
  const [fundedPercentage, setFundedPercentage] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUploader, setShowUploader] = useState(false)

  const handlePublish = async () => {
    if (!user?.ngoId || !title || !body) return
    setIsSubmitting(true)
    try {
      await createCommunityPost(
        user.ngoId,
        postType,
        title,
        body,
        mediaUrls,
        metrics || undefined,
        fundedPercentage ? parseInt(fundedPercentage) : undefined
      )
      // Navigate to dashboard or feed after success
      navigate('/ngo/dashboard')
    } catch (err) {
      console.error(err)
      alert("Failed to publish post.")
      setIsSubmitting(false)
    }
  }

  return (
    <NgoLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-xl text-white mb-1">Create Community Post</h1>
          <p className="text-white/50 text-sm">Share updates, events, and urgent needs with the community.</p>
        </div>

        <div className="space-y-5">
          {/* Post type */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <label className="block text-sm font-semibold text-white mb-3">Post Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POST_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPostType(t.id)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    postType === t.id ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70'}`}
                >
                  <span className="material-icons text-xl">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Title</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Give your post a clear, descriptive title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Body</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                rows={5}
                placeholder="Share the full details. The more specific, the better the community can respond…"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>

            {/* Optional Fields based on Type */}
            {(postType === 'success' || postType === 'volunteer') && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-semibold text-white mb-2">Impact Metrics (Optional)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. '120 volunteers · 400kg waste removed'"
                  value={metrics}
                  onChange={e => setMetrics(e.target.value)}
                />
              </div>
            )}

            {postType === 'urgent' && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-semibold text-white mb-2">Funding Goal % (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 84 (do not include %)"
                  value={fundedPercentage}
                  onChange={e => setFundedPercentage(e.target.value)}
                />
              </div>
            )}

            {/* Image upload */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Attach Media (optional)</label>
              
              {mediaUrls.length > 0 ? (
                <div className="flex gap-2 mb-3">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                      <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                    </div>
                  ))}
                  <button onClick={() => setShowUploader(true)} className="w-24 h-24 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:bg-white/5 hover:text-white/80 transition-colors">
                    <span className="material-icons">add</span>
                    <span className="text-[10px] mt-1">Add More</span>
                  </button>
                </div>
              ) : !showUploader ? (
                <div 
                  onClick={() => setShowUploader(true)}
                  className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer bg-white/5"
                >
                  <span className="material-icons text-3xl text-white/20 mb-2">cloud_upload</span>
                  <div className="text-xs text-white/40">Click to upload an image</div>
                </div>
              ) : null}

              {showUploader && (
                <div className="mt-2">
                  <ImageUploader 
                    storagePath={`posts/${user?.ngoId}/`}
                    onCancel={() => setShowUploader(false)}
                    onUploadComplete={(url) => {
                      setMediaUrls(prev => [...prev, url])
                      setShowUploader(false)
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button 
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white/50 hover:bg-white/10 transition-colors disabled:opacity-50" 
              onClick={() => navigate('/ngo/dashboard')}
            >
              Cancel
            </button>
            <button
              disabled={!title || !body || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/80 text-white text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-40"
              onClick={handlePublish}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-icons text-base">publish</span>
              )}
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </NgoLayout>
  )
}
