import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'

import FeedCard from '@/components/FeedCard'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import type { Post } from '@/types'

export default function Feed() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map((d) => ({ ...(d.data() as Post), id: d.id })))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  return (
    <>
      <div className="px-4 py-3 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight">Your community</h1>
        <p className="text-sm text-muted-foreground">
          Drives, donations, and updates from NGOs near you.
        </p>
      </div>

      <div className="px-4 pb-6">
        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-72" />
            <div className="skeleton h-72" />
            <div className="skeleton h-72" />
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-xl border bg-card shadow-soft p-6 text-center animate-fade-in-up">
            <Newspaper className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When NGOs post drives or updates, they'll show up here.
            </p>
            <Button
              onClick={() => navigate('/report')}
              className="mt-4 bg-brand-gradient text-white hover:opacity-90"
            >
              Report something
            </Button>
          </div>
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
