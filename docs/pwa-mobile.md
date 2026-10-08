# SKTECH mobile PWA behavior

The install card appears only after a browser emits `beforeinstallprompt`. It stays hidden in standalone mode and after the user selects **Not now**. Browsers that do not offer that event do not show the card.

`/offline` provides a direct offline information page with retry and home actions. The existing service worker and runtime caching rules are unchanged. General navigation is not redirected to `/offline` when the network fails, because dashboard and account pages require live authentication and data. Users can open the page when it is available in the browser cache.

Dashboard and mobile route loading files show layout placeholders while pages load. They do not display cached account data.
