# NGO Connect

NGO Connect is a Progressive Web App that lets any citizen file a welfare
report — a stray dog, a person sleeping rough, an abandoned construction site —
in seconds, with a photo and a tap. Gemini multimodal AI classifies, summarizes,
and triages the report; the app then routes it in real time to the nearest
verified NGO that handles that category. NGO admins receive the report in a
live inbox where they can Accept and Resolve, and the citizen sees status
updates as they happen.

## Tech stack

- **React + Vite + TypeScript** — strict mode, `verbatimModuleSyntax`, path alias `@/*`.
- **Firebase Auth** (Google sign-in) and **Cloud Firestore** for realtime data.
- **Gemini** via Firebase AI Logic (`firebase/ai`), structured JSON output with a fixed schema.
- **MapLibre GL JS** + OpenStreetMap tiles for the help-locations map.
- **vite-plugin-pwa** for installability, offline shell, and the web manifest.
- **shadcn/ui** primitives + **Tailwind CSS 3**, manually scaffolded (no shadcn CLI).
- **geofire-common** for geohash-based proximity queries.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. In the [Firebase Console](https://console.firebase.google.com/), create a
   new project. Enable **Authentication → Google** as a sign-in provider, and
   enable **Firestore** in production mode.
3. Copy the example env file and fill in the Firebase web app config from
   *Project Settings → General → Your apps*:
   ```bash
   cp .env.local.example .env.local
   # then edit .env.local
   ```
4. Open `src/constants.ts` and edit `NGO_ADMIN_EMAIL_TO_NGO_ID` so it maps the
   Google emails of your NGO-admin teammates to one of the seeded NGO ids
   (e.g. `'admin1@example.com': 'ngo_animal_rescue_blr'`).
5. Generate a service account key for the seed script:
   *Project Settings → Service Accounts → Generate new private key*. Save the
   downloaded JSON as `scripts/serviceAccount.json`. The file is gitignored.
6. Seed Firestore with eight NGOs, fifteen help locations, ten posts, and three
   historical reports:
   ```bash
   npm run seed
   ```
7. Push the Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
8. Run locally, or build and deploy:
   ```bash
   npm run dev                                 # http://localhost:5173
   npm run build && firebase deploy --only hosting
   ```

## Architecture

```
+-------------------+       +----------------------+
|  Citizen PWA      |       |  NGO Admin PWA       |
|  (same codebase,  |       |  (role-gated routes) |
|   role gated)     |       |                      |
+---------+---------+       +----------+-----------+
          |                            ^
          |  createReport(...)         |  onSnapshot(/ngos/{id}/incoming_reports)
          v                            |
+-------------------------------------------------+
|             Cloud Firestore                     |
|  /reports/{reportId}                            |
|  /ngos/{ngoId}/incoming_reports/{reportId}      |
|  /help_locations/*  /posts/*  /users/*          |
+--------+-----------------+----------------------+
         |                 |
         v                 v
+----------------+   +----------------+
|  Firebase AI   |   |  Geohash range |
|  Logic         |   |  query for     |
|  (Gemini       |   |  nearest NGO   |
|   classify)    |   |                |
+----------------+   +----------------+
```

A new report is written first as `pending`, then classified by Gemini, then
matched to the nearest verified NGO that handles its category, then mirrored
into `/ngos/{ngoId}/incoming_reports/{reportId}` and flipped to `submitted`.
Both sides watch via `onSnapshot`, so accept/resolve updates land instantly on
the citizen's "My Reports" screen.

We don't use Firebase Storage — photos are resized client-side and stored
inline as a base64 data URL on the report doc, with a 750 KB cap to stay under
Firestore's 1 MB document limit.

## Demo flow

- Citizen signs in with Google, taps the camera, snaps a photo of a stray cat.
- The app uploads the report; Gemini summarizes and tags it `animal_welfare /
  high`.
- The nearest verified animal-welfare NGO appears in their dashboard inbox in
  real time.
- The NGO admin taps **Accept**; the citizen sees status flip to "Accepted by
  Bengaluru Animal Rescue" without refreshing.
- The admin taps **Resolve** when the rescue is complete; the citizen sees the
  resolved status and the loop closes.

## Repository layout

```
public/             Static PWA assets (favicon, manifest, icons)
scripts/            One-shot scripts (seed, gemini smoke test) — server-side, not bundled
src/                React app source
  components/         UI primitives, shared cards, badges
  components/ui/      shadcn/ui Card, Button, Badge, etc.
  lib/                firebase init, auth, reports, gemini, geo helpers
  routes/             Top-level pages (citizen, ngo, public)
  types.ts            Domain types — locked, do not bend the data model
  constants.ts        Shared constants and NGO admin email → NGO id mapping
firestore.rules     §7.1 security rules (deployed via firebase CLI)
firebase.json       Hosting + rules config
```

## License

MIT.
