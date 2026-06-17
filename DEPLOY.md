# Deploying Let's Make a Plan (PWA)

This app is a **static React PWA**. Deployment is: build once, host the `dist/` folder over **HTTPS**. No server or database is required.

## 1. Build for production

```bash
npm install
npm run build
```

That creates `dist/` with:

- HTML, JS, and CSS bundles
- `manifest.webmanifest`
- Service worker (`registerSW.js` + Workbox assets) via `vite-plugin-pwa`

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
5. Deploy.

### Netlify

1. Connect the repo at [netlify.com](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add a SPA redirect (required for React Router). In `public/_redirects` or Netlify site settings:

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
- For a **project site** at `https://username.github.io/repo-name/`, you must set `base: '/repo-name/'` in `vite.config.ts` and rebuild before deploying.

## 3. PWA requirements

For install prompts and offline behavior:

| Requirement | Why |
|-------------|-----|
| **HTTPS** | Service workers only work on HTTPS (localhost is exempt). |
| **Serve from site root** | Manifest `scope` is `/`. |
| **SPA fallback** | Routes like `/report` and `/settings` must return `index.html`. |
| **Do not block SW files** | The host must serve `sw.js`, `workbox-*.js`, and `manifest.webmanifest`. |

After deploy:

- **Chrome / Android:** use the install prompt or browser menu → “Install app”.
- **iOS:** open in **Safari** → Share → **Add to Home Screen**.

## 4. Google Drive sync (optional)

Environment variables are embedded at **build time** (`VITE_*` prefix):

```bash
# .env (see .env.example)
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

1. Run `npm run build`.
2. Deploy the `dist/` folder to HTTPS static hosting.
3. Configure SPA rewrite → `index.html` for all routes.
4. Open the site → DevTools → **Application** → verify **Manifest** and **Service Worker**.
5. Test offline: load once online, then go offline and reload.
6. If using Google sync: set `VITE_*` env vars and add the production origin in Google Cloud.
7. On iPhone: open in Safari and use **Add to Home Screen**.

## 6. Updating the live PWA

`vite-plugin-pwa` is configured with `registerType: 'autoUpdate'`. Users receive updates when they revisit the app after you redeploy. No extra release step is needed beyond rebuilding and redeploying `dist/`.

## 7. CSV-only mode

No Google setup is required. Users can choose **Use offline (CSV)** at onboarding. Data stays on the device; **Export CSV** in Settings backs up manually.
