# upgraded-pancake# StreamHub Monorepo

This repo contains:
- `src/` → Angular frontend
- `functions/` → Firebase Cloud Functions backend

## Local dev
```bash
cd functions
npm install
npm run build
firebase emulators:start --only functions