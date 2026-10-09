# SKTECH PWA behavior

The manifest at `public/manifest.json` uses `/mobile` as the stable app identity and start URL, standalone display, and the 192px/512px SKTECH icons. The padded 512px icon is marked `any maskable`. The install card appears only after a browser emits `beforeinstallprompt`; it stays hidden in standalone mode and after **Not now**. Browsers that do not offer that event do not show the card.

`next-pwa` is enabled only for production builds. `npm run build` generates `public/sw.js`, Workbox's `public/workbox-*.js`, and hashed `public/worker-*.js` and `public/fallback-*.js` bundles. These are build artifacts and are ignored/untracked; do not edit or commit them. The source of push behavior is `worker/index.js`, which next-pwa compiles and imports into the generated service worker.

Same-origin API requests and document navigations are network-only. The `/offline` document is explicitly precached as the offline navigation fallback, so private dashboard HTML and App Router payloads are not served from cache. Runtime caching is limited to static fonts, images, audio/video, JavaScript, and styles; uploaded files and sensitive image endpoints remain network-only. The app start URL is not cached.

`/offline` provides retry and home actions and contains no account data. It is shown only when a navigation cannot be served by the network. Public page HTML is also network-only; the offline experience uses the static fallback rather than stale account or page content.

For local verification, run `npm run build`, start with `npm start`, and check `/manifest.json` and `/offline`. Install from a supported secure browser, then test offline navigation with DevTools network offline. Enable browser notifications from the Notification Center and send a test push to verify the compiled worker's generic content and safe click handling. Rebuild twice and confirm `git status --short` shows no generated PWA files.
