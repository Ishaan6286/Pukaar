// TODO(person 1, me): client-side image resize before AI call + Firestore write.
// Target: max 800px on the longest edge, JPEG quality 0.7.
// Output: base64 data URL string, suitable for both Gemini inline data and a Firestore doc field.

const MAX_DIMENSION_PX = 800;
const JPEG_QUALITY = 0.7;

export async function resizeImageToBase64(file: File): Promise<{
  dataUrl: string;
  base64: string;     // without the "data:image/jpeg;base64," prefix — for Gemini
  mimeType: 'image/jpeg';
  sizeBytes: number;
}> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1];
  // Approximate byte size of the decoded base64 payload
  const sizeBytes = Math.floor((base64.length * 3) / 4);
  return { dataUrl, base64, mimeType: 'image/jpeg', sizeBytes };
}
