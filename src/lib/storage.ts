import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { storage } from './firebase'

type UploadProgressCallback = (progress: number) => void

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * 
 * @param file The file to upload
 * @param path The path in storage (e.g., 'reports/images/')
 * @param onProgress Optional callback to track upload progress (0-100)
 * @returns The download URL of the uploaded file
 */
export async function uploadFile(
  file: File, 
  path: string, 
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Create a unique filename
  const timestamp = Date.now()
  const uniqueFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const fullPath = `${path}${uniqueFilename}`
  
  const storageRef = ref(storage, fullPath)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(progress)
        }
      },
      (error) => {
        console.error('Error uploading file:', error)
        reject(error)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (error) {
          console.error('Error getting download URL:', error)
          reject(error)
        }
      }
    )
  })
}

/**
 * Deletes a file from Firebase Storage given its download URL or path
 * 
 * @param fileUrlOrPath The download URL or storage path of the file
 */
export async function deleteFile(fileUrlOrPath: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrlOrPath)
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}
