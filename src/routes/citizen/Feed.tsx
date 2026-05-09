import { useState, useEffect, useMemo } from 'react'
import { CitizenLayout } from '@/components/Layout'
import { collections, subscribeToQuery, getDocument } from '@/lib/firestore'
import type { CommunityPost, NgoProfile, PostType } from '@/types'
import { togglePostRsvp } from '@/lib/feed'
import { useAuth } from '@/hooks/useAuth'
import { orderBy, limit, query, where, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'

const FILTERS = ['All', 'Events', 'Success Stories', 'Urgent Needs', 'Volunteer']

export default function Feed() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [ngoDict, setNgoDict] = useState<{ [id: string]: NgoProfile }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeRsvps, setActiveRsvps] = useState<{ [postId: string]: boolean }>({})

  // Fetch User's RSVPs
  useEffect(() => {
    if (!user) {
      setActiveRsvps({})
      return
    }
    const q = query(collections.rsvps, where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const rsvpMap: { [postId: string]: boolean } = {}
      snap.forEach(doc => {
        rsvpMap[doc.data().postId] = true
      })
      setActiveRsvps(rsvpMap)
    })
    return () => unsub()
  }, [user])

  // 1. Live Feed Subscription
  useEffect(() => {
    const unsub = subscribeToQuery<CommunityPost>(
      collections.posts,
      [orderBy('createdAt', 'desc'), limit(50)],
      (data) => {
        setPosts(data)
        setIsLoading(false)
      },
      (err) => {
        console.error(err)
        toast.error('Failed to connect to live feed.')
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // 2. Resolve NGO Metadata
  useEffect(() => {
    const resolveNgos = async () => {
      const uniqueNgoIds = Array.from(new Set(posts.map(p => p.ngoId)))
      const newDict = { ...ngoDict }
      
      let updated = false
      for (const id of uniqueNgoIds) {
        if (!newDict[id]) {
          const ngo = await getDocument<NgoProfile>(collections.ngos, id)
          if (ngo) {
            newDict[id] = ngo
            updated = true
          }
        }
      }
      if (updated) setNgoDict(newDict)
    }
    
    if (posts.length > 0) resolveNgos()
  }, [posts])

  // 3. Filter processing
  const visiblePosts = useMemo(() => {
    return posts.filter(post => {
      if (filter === 'All') return true
      if (filter === 'Events') return post.type === 'event'
      if (filter === 'Success Stories') return post.type === 'success'
      if (filter === 'Urgent Needs') return post.type === 'urgent'
      if (filter === 'Volunteer') return post.type === 'volunteer'
      return true
    })
  }, [posts, filter])

  // Handlers
  const handleRsvp = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to respond to posts.')
      return
    }
    
    // Optimistic UI toggle
    const isCurrentlyActive = !!activeRsvps[postId]
    setActiveRsvps(prev => ({ ...prev, [postId]: !isCurrentlyActive }))

    try {
      await togglePostRsvp(postId, user.uid, 'attending')
      toast.success(isCurrentlyActive ? 'RSVP Cancelled' : 'RSVP Confirmed')
    } catch (err) {
      console.error(err)
      // Revert on failure
      setActiveRsvps(prev => ({ ...prev, [postId]: isCurrentlyActive }))
      toast.error('Network error. Failed to update status.')
    }
  }

  const getPostStyles = (type: PostType) => {
    switch (type) {
      case 'event': return { tag: 'Local Event', tagClass: 'badge-active', icon: 'event' }
      case 'success': return { tag: 'Success Story', tagClass: 'badge-active', icon: 'star' }
      case 'urgent': return { tag: 'Urgent Need', tagClass: 'badge-urgent', icon: 'priority_high' }
      case 'volunteer': return { tag: 'Volunteer', tagClass: 'badge-pending', icon: 'volunteer_activism' }
      case 'announcement': return { tag: 'Announcement', tagClass: 'badge-tag', icon: 'campaign' }
      default: return { tag: 'Update', tagClass: 'badge-tag', icon: 'article' }
    }
  }

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now'
    // Handle both Timestamp and number
    const timestampMillis = typeof ts === 'number' ? ts : ts.toMillis()
    const diffMins = Math.floor((Date.now() - timestampMillis) / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`
    return `${Math.floor(diffMins/1440)}d ago`
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Community Feed</h1>
              {!isLoading && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-wider ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>Live
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">Stories of impact and upcoming events from your local NGOs.</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${filter === t ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-border text-muted-foreground hover:border-primary/40'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="pukaar-card p-0 overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-border/60 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent animate-pulse" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-accent rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-accent rounded w-1/4 animate-pulse" />
                  </div>
                </div>
                <div className="w-full h-48 bg-accent/50 animate-pulse" />
                <div className="px-5 py-4 space-y-2">
                  <div className="h-4 bg-accent rounded w-full animate-pulse" />
                  <div className="h-4 bg-accent rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && visiblePosts.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <span className="material-icons text-4xl mb-2 opacity-50">article</span>
            <p className="font-medium">No posts available in this category.</p>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-6">
          {visiblePosts.map((post, idx) => {
            const ngo = ngoDict[post.ngoId]
            const styles = getPostStyles(post.type)
            const isSupported = activeRsvps[post.id!]

            return (
              <article key={post.id} className="pukaar-card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 border-b border-border/60">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-primary text-xl">{styles.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="font-heading font-bold text-sm text-foreground truncate">
                          {ngo ? ngo.ngoName : 'Verified NGO'}
                        </div>
                        {ngo && <span className="material-icons text-primary text-[14px]" title="Verified Partner">verified</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatTime(post.createdAt)}</div>
                    </div>
                    <span className={styles.tagClass}>{styles.tag}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground leading-snug">{post.title}</h3>
                </div>

                {/* Media — base64 data URL stored inline in Firestore */}
                {post.photoDataUrl && (
                  <div className="w-full h-48 bg-muted/30 border-b border-border/60">
                    <img src={post.photoDataUrl} alt="Post attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Body */}
                <div className="px-5 py-4">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
                </div>

                {/* Metrics / Progress */}
                {(post.metrics || post.fundedPercentage !== undefined) && (
                  <div className="px-5 pb-4">
                    {post.metrics && (
                      <div className="pukaar-card p-3 bg-teal-50 border-teal-100 flex items-center gap-2">
                        <span className="material-icons text-teal-600 text-lg">insights</span>
                        <span className="text-sm font-semibold text-teal-800">{post.metrics}</span>
                      </div>
                    )}
                    {post.fundedPercentage !== undefined && (
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-muted-foreground">Community Goal</span>
                          <span className="text-primary font-bold">{post.fundedPercentage}% Funded</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(post.fundedPercentage, 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 pb-5 flex items-center gap-3 border-t border-border/60 pt-4 bg-muted/10">
                  <button 
                    onClick={() => handleRsvp(post.id!)}
                    className={`btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 transition-all ${isSupported ? 'text-rose-500 bg-rose-50' : 'text-muted-foreground'}`}
                  >
                    <span className="material-icons text-[18px]">
                      {isSupported ? 'favorite' : 'favorite_border'}
                    </span>
                    <span className="font-medium">
                      {isSupported ? 'Supported' : 'Support'}
                      {post.engagementCount && post.engagementCount > 0 ? ` (${post.engagementCount})` : ''}
                    </span>
                  </button>
                  <button className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground">
                    <span className="material-icons text-[18px]">share</span>
                    <span className="font-medium">Share</span>
                  </button>
                  <button 
                    onClick={() => handleRsvp(post.id!)}
                    className={`ml-auto text-xs py-2 px-4 rounded-lg font-bold shadow-sm transition-all ${
                      isSupported ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary text-white border border-transparent'
                    }`}
                  >
                    {post.type === 'event' || post.type === 'volunteer' ? (isSupported ? 'RSVP Confirmed' : 'Join Action') : 
                     post.type === 'urgent' ? 'Donate Now' : 'Show Support'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </CitizenLayout>
  )
}
