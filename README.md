# Let's Make a Plan

A client-only React PWA for diet, exercise, and de-stress tracking. Data is stored locally as CSV in IndexedDB, with optional sync to a spreadsheet on your Google Drive.

## Features

- **CSV-first** — works offline without sign-in; export/import anytime
- **Diet tracking** — calories with green/yellow/red scoring, cheat days, optional fat/sugar
- **Exercise** — activity catalog (half/full day), rest days, weekly/monthly scores
- **De-stress** — daily check-off, shuffled suggestions
- **Report card** — all areas vs goals, 3/6/12 month line charts
- **Mantras** — random phrase on home screen
- **Backups** — 3 rotating local CSV snapshots + optional Google Drive duplicate (weekly, on app open after Sunday 3AM)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages).

## Google Drive sync (optional)

1. Create a [Google Cloud project](https://console.cloud.google.com/)
2. Enable **Google Sheets API** and **Google Drive API**
3. Configure OAuth consent screen
4. Create an **OAuth 2.0 Web client** — add your origin to Authorized JavaScript origins
5. Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID` (and optionally API key / app ID for Picker)

## iOS install (PWA)

1. Open the app in **Safari**
2. Tap Share → **Add to Home Screen**
3. Launch from home screen for standalone mode

Note: Backups run when you **open the app** after the scheduled time — not while closed.

## CSV-only mode

Choose **Use offline (CSV)** at onboarding. Data stays on device. Use **Export CSV** in Settings to back up manually or move to another device.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run lint` | ESLint |

## License

MIT
