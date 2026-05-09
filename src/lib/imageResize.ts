/**
 * Resizes an image File to max 800px on the longest side,
 * encodes it as JPEG at quality 0.7, and returns a base64 data URL.
 *
 * Architecture note: We do NOT use Firebase Storage (Spark plan).
 * Photos are stored inline in the Firestore report document as a base64 data URL.
 */
export interface ResizeResult {
  /** Full data URL: "data:image/jpeg;base64,<data>" — safe to write directly to Firestore */
  dataUrl: string
  /** Raw base64 string without the data:... prefix — for passing to Gemini inlineData */
  base64: string
  /** Always "image/jpeg" */
  mimeType: 'image/jpeg'
}

export function resizeImageToBase64(file: File, maxPx = 800, quality = 0.7): Promise<ResizeResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = (evt) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image for resizing'))
      img.onload = () => {
        let { width, height } = img

        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height * maxPx) / width)
            width = maxPx
          } else {
            width = Math.round((width * maxPx) / height)
            height = maxPx
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'))

        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]

        resolve({ dataUrl, base64, mimeType: 'image/jpeg' })
      }
      img.src = evt.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
