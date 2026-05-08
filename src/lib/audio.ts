/**
 * Determines the best supported MIME type for audio recording in the current browser.
 * Falls back to basic types if specific codecs aren't supported.
 */
export function getSupportedMimeType(): string {
  const possibleTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/aac',
  ]

  for (const type of possibleTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  // Fallback (some browsers might not explicitly report support but still work with an empty string)
  return ''
}

/**
 * Converts a Blob to a Base64 encoded string.
 * Useful for sending audio data directly to AI services like Gemini.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Formats a given time in seconds to an MM:SS string format.
 */
export function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
