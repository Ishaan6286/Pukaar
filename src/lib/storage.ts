// TODO(person 1, me): no-op storage layer.
// We do NOT use Firebase Storage in this build (no Blaze plan).
// Photos are stored as base64 data URLs directly in the Firestore report doc.
// Audio is consumed by Gemini and discarded — never persisted.
//
// This file exists as a placeholder so future imports don't break.
// All actual photo/audio handling happens in src/lib/reports.ts (next prompt).

export {};
