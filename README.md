# NGO Connect

Citizen welfare reports, routed to nearby NGOs by Gemini multimodal AI. PWA built with React, Vite, Firebase, and MapLibre.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in Firebase web app config
npm run dev
```

Open http://localhost:5173.

## Deployment

`.firebaserc` currently uses the placeholder project id `ngo-connect-PLACEHOLDER`. Update it to your real Firebase project id once it's created (or run `firebase use --add`).
