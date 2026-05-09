import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'

import FeedCard from '@/components/FeedCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">NGO Feed</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-4 ml-12">
        Drives, donation calls, and updates from local NGOs.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading feed…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <p className="text-muted-foreground">No posts yet. Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <FeedCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
