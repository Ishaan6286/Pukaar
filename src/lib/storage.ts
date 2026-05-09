// We do NOT use Firebase Storage in this build (Spark plan, no Blaze).
// Photos are stored as base64 data URLs directly in the Firestore report doc.
// Audio is consumed by Gemini and discarded — never persisted.
//
// This file exists only as a placeholder so existing imports don't break.
// All actual photo handling goes through src/lib/imageResize.ts (resize)
// and src/lib/reports.ts (write to Firestore).

export {}
