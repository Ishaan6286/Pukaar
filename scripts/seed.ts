import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json')

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log("Firebase Admin initialized via serviceAccountKey.json")
  } else {
    // Fallback to default application credentials if running in GCP
    admin.initializeApp()
    console.log("Firebase Admin initialized via Application Default Credentials")
  }
} catch (err) {
  console.error("Failed to initialize Firebase Admin. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set or serviceAccountKey.json exists.")
  process.exit(1)
}

const db = admin.firestore()

async function seed() {
  console.log('Starting Pukaar Database Seed...')

  const dataPath = path.join(__dirname, 'seed-data.json')
  const rawData = fs.readFileSync(dataPath, 'utf8')
  const data = JSON.parse(rawData)

  const collections = ['ngos', 'users', 'help_locations', 'posts', 'reports']

  for (const collection of collections) {
    const items = data[collection === 'help_locations' ? 'helpLocations' : collection]
    if (!items || items.length === 0) continue

    console.log(`Seeding collection: [${collection}]...`)
    
    // Use batches for better performance
    let batch = db.batch()
    let count = 0

    for (const item of items) {
      // Add server timestamps
      const now = admin.firestore.FieldValue.serverTimestamp()
      const docData = {
        ...item,
        createdAt: now,
        updatedAt: now
      }

      // Determine document ID
      const id = item.id || item.uid
      
      const ref = id ? db.collection(collection).doc(id) : db.collection(collection).doc()
      batch.set(ref, docData)

      count++
      if (count === 499) { // Firestore batch limit is 500
        await batch.commit()
        batch = db.batch()
        count = 0
      }
    }

    if (count > 0) {
      await batch.commit()
    }
    console.log(`✅ Seeded ${items.length} items to ${collection}`)
  }

  // Generate initial timeline events for the seeded reports to ensure dashboard tracking works
  console.log("Generating tracking timeline events...")
  const reportSnap = await db.collection('reports').get()
  let timelineBatch = db.batch()
  
  for (const doc of reportSnap.docs) {
    const reportData = doc.data()
    const timelineRef = db.collection('timeline_events').doc()
    
    timelineBatch.set(timelineRef, {
      reportId: doc.id,
      status: 'submitted',
      description: 'Report successfully processed and stored.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      actorId: reportData.userId
    })

    if (reportData.status === 'under_review') {
      const timelineRef2 = db.collection('timeline_events').doc()
      timelineBatch.set(timelineRef2, {
        reportId: doc.id,
        status: 'under_review',
        description: 'NGO has begun analyzing the situation and planning response.',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        actorId: reportData.assignedNgoId || 'system'
      })
    }
  }
  
  await timelineBatch.commit()
  console.log(`✅ Seeded timeline events`)

  console.log('🎉 Seeding complete! The Pukaar platform is ready.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
