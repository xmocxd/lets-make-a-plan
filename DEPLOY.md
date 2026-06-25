# Deploying Let's Make a Plan (PWA)

This app is a **static React PWA**. Deployment is: build once, host the `dist/` folder over **HTTPS**. No server or database is required.

## 1. Build for production

```bash
npm install
npm test          # optional but recommended
npm run build
```

`npm run build` runs TypeScript (`tsc -b`) and then Vite. Output goes to `dist/`:

- HTML, JS, and CSS bundles
- `manifest.webmanifest`
- Service worker via `vite-plugin-pwa` (`registerSW.js` + generated `sw.js` / Workbox assets)
- Static assets from `public/` (favicon, icons)

Test locally before deploying:

```bash
npm run preview
```

Open the preview URL and confirm the app loads and works offline after a refresh.

## 2. Deploy `dist/` to a static host

Any static host works. Common options:

### Vercel

1. Push the repo to GitHub.
2. Import the project at [vercel.com](https://vercel.com).
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy. (Vercel handles SPA routing automatically.)

### Netlify

1. Connect the repo at [netlify.com](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. SPA fallback: this repo includes `public/_redirects`, which Netlify copies into `dist/`:

```text
/*    /index.html   200
```

### Cloudflare Pages

1. Connect the repo in the Cloudflare dashboard.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Add the same SPA fallback: `/* /index.html 200`

### GitHub Pages

This app expects to be served from the **site root** (`start_url: '/'`, `scope: '/'` in `vite.config.ts`).

- **Works as-is** for a user/org site at `https://username.github.io`.
- For a **project site** at `https://username.github.io/repo-name/`, set `base: '/repo-name/'` in `vite.config.ts` and rebuild before deploying.

## 3. PWA requirements

For install prompts and offline behavior:

| Requirement | Why |
|-------------|-----|
| **HTTPS** | Service workers only work on HTTPS (localhost is exempt). |
| **Serve from site root** | Manifest `scope` is `/`. |
| **SPA fallback** | All client routes must return `index.html` (see below). |
| **Do not block SW files** | The host must serve `sw.js`, `workbox-*.js`, `registerSW.js`, and `manifest.webmanifest`. |

### Routes that need SPA fallback

React Router handles these in the browser. Direct visits or refreshes on any of them need `index.html`:

| Path | Screen |
|------|--------|
| `/` | Log (daily tracking) |
| `/plan` | Plan (weekly pre-plan) |
| `/activities` | Exercise activity catalog |
| `/destress` | Calm |
| `/destress/list` | Calm suggestion list |
| `/report` | Report overview |
| `/report/detail` | Report month detail |
| `/mantras` | Mantras |
| `/settings` | Settings |

Legacy paths `/diet` and `/exercise` redirect to `/` in the app, but the SPA fallback still applies if someone bookmarks them.

After deploy:

- **Chrome / Android:** use the install prompt or browser menu → “Install app”.
- **iOS:** open in **Safari** → Share → **Add to Home Screen**.

## 4. Google Drive sync (optional)

Environment variables are embedded at **build time** (`VITE_*` prefix). See `.env.example`:

```bash
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...   # optional, for Google Picker
VITE_GOOGLE_APP_ID=...    # optional, for Google Picker
```

On deploy:

1. Set those variables in your host’s environment settings (Vercel, Netlify, and Cloudflare Pages all support this).
2. In [Google Cloud Console](https://console.cloud.google.com/), add your production URL to **Authorized JavaScript origins**, e.g. `https://your-app.vercel.app`.
3. Enable **Google Sheets API** and **Google Drive API**, and configure the OAuth consent screen.
4. Rebuild and redeploy after changing env vars.

Without those variables, the app still works in **CSV-only offline mode**.

## 5. Deployment checklist

1. Run `npm test` (optional).
2. Run `npm run build`.
3. Deploy the `dist/` folder to HTTPS static hosting.
4. Configure SPA rewrite → `index.html` for all routes (if not automatic).
5. Open the site → DevTools → **Application** → verify **Manifest** and **Service Worker**.
6. Test key routes: `/`, `/plan`, `/report`, `/settings` (refresh each to confirm SPA fallback).
7. Test offline: load once online, then go offline and reload.
8. If using Google sync: set `VITE_*` env vars and add the production origin in Google Cloud.
9. On iPhone: open in Safari and use **Add to Home Screen**.

## 6. Updating the live PWA

`vite-plugin-pwa` is configured with `registerType: 'autoUpdate'`. Users receive updates when they revisit the app after you redeploy. No extra release step is needed beyond rebuilding and redeploying `dist/`.

## 7. CSV-only mode

No Google setup is required. Users can choose **Use offline (CSV)** at onboarding. Data stays on the device; **Export CSV** in Settings backs up manually.
