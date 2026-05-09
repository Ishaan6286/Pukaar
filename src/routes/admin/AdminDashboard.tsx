import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { toast } from 'sonner'
import type { NgoProfile, AdminProfile } from '@/types'

// Using the same config as the main app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [ngos, setNgos] = useState<NgoProfile[]>([])
  const [loading, setLoading] = useState(true)

  // Registration Form State
  const [ngoName, setNgoName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [categories, setCategories] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    async function fetchNgos() {
      const snap = await getDocs(collection(db, 'ngos'))
      const list = snap.docs.map(d => d.data() as NgoProfile)
      setNgos(list)
      setLoading(false)
    }
    fetchNgos()
  }, [])

  const handleRegisterNgo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)

    try {
      // Create a secondary app to avoid logging out the admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp_" + Date.now())
      const secondaryAuth = getAuth(secondaryApp)

      // Generate NGO Credentials in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const ngoId = userCredential.user.uid

      // Create NGO Profile in Firestore
      const newNgo: NgoProfile = {
        ngoId,
        ngoName,
        email,
        passwordHash: 'managed_by_firebase_auth', // Using Firebase Auth securely handles this
        role: 'ngo',
        categories: categories.split(',').map(c => c.trim()),
        verified: true, // Auto-verified since admin creates it
        createdByAdmin: (profile as AdminProfile)?.adminId || 'unknown',
        createdAt: Date.now(),
        status: 'active',
        adminNotes: 'Registered via Admin Portal'
      }

      await setDoc(doc(db, 'ngos', ngoId), newNgo)
      await firebaseSignOut(secondaryAuth)

      setNgos([newNgo, ...ngos])
      toast.success('NGO registered successfully!')
      
      // Reset form
      setNgoName('')
      setEmail('')
      setPassword('')
      setCategories('')

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to register NGO')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e17] text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-[#18171f]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Pukaar Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading font-bold text-lg">Pukaar Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden sm:block">
            {profile?.email}
          </div>
          <button onClick={signOut} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: NGO Registration Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#18171f] border border-border rounded-xl p-5">
            <h2 className="font-heading font-bold text-lg mb-1">Register New NGO</h2>
            <p className="text-xs text-muted-foreground mb-5">Create a secure portal account for an NGO.</p>

            <form onSubmit={handleRegisterNgo} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">NGO Name</label>
                <input 
                  type="text" required
                  value={ngoName} onChange={e => setNgoName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="e.g. Robin Hood Army"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Email (Login ID)</label>
                <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="contact@ngo.org"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Password</label>
                <input 
                  type="password" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Categories (comma separated)</label>
                <input 
                  type="text" required
                  value={categories} onChange={e => setCategories(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="food, medical, shelter"
                />
              </div>
              <button 
                type="submit" 
                disabled={isRegistering}
                className="w-full h-10 rounded-lg bg-primary text-white font-medium text-sm mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isRegistering ? 'Generating Credentials...' : 'Create NGO Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Registered NGOs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#18171f] border border-border rounded-xl p-5 min-h-[500px]">
            <h2 className="font-heading font-bold text-lg mb-1">Managed NGOs</h2>
            <p className="text-xs text-muted-foreground mb-5">Overview of all active NGO accounts on Pukaar.</p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : ngos.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No NGOs registered yet. Use the panel to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {ngos.map(ngo => (
                  <div key={ngo.ngoId} className="p-4 rounded-lg border border-white/5 bg-black/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-white">{ngo.ngoName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ngo.email}</div>
                      <div className="flex gap-2 mt-2">
                        {ngo.categories.map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium">
                        {ngo.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Verified by: {ngo.createdByAdmin.slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
