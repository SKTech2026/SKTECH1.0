# Notification Center and browser alerts

The authenticated Notification Center combines the signed-in user's in-app notices with safe chat activity summaries. It supports All, Unread, and Important filters and per-item or bulk read actions. Notification links are restricted to approved internal routes. Chat remains one unread item per conversation in the center, matching the existing unread badge behavior; individual chat message events are deduplicated for storage and push delivery.

## Database migration

`prisma/migrations/20261009010000_add_notifications_and_push` adds `AppNotification` and `PushSubscription` with user foreign keys and indexes. The migration enables RLS without client policies; browser clients use authenticated Next.js routes, while the server's Prisma connection performs scoped queries. Deploy this migration through the normal `prisma migrate deploy` release step before enabling the new UI. No database reset or manual production SQL is required.

`prisma/migrations/20261009020000_add_notification_dedupe_key` adds a nullable unique event key. Existing notifications keep `NULL`, and the unique index permits multiple null values.

`prisma/migrations/20261009030000_add_notification_preferences` adds one preference row per user. Category switches default to enabled; browser push itself remains off until the user enables a browser subscription.

## Web Push setup

Generate one VAPID key pair with `npx web-push generate-vapid-keys --json`. Store these variables on the Railway app service:

```text
WEB_PUSH_PUBLIC_KEY=<public key>
WEB_PUSH_PRIVATE_KEY=<private key>
WEB_PUSH_SUBJECT=mailto:your-team@example.org
```

Keep the private key on the server. The public key is returned only by the authenticated subscription setup API. Use a real contact address for the subject. Web Push needs HTTPS or localhost and a browser that supports PushManager and service workers. The installed PWA uses the same permission and subscription flow when supported.

The **Enable notifications** button in the center is the only action that requests browser permission. Denial leaves in-app notifications available. **Disable notifications** revokes the current browser subscription. The authenticated **Send test** action creates one generic in-app notice for the current user and sends a generic push to that user's active subscriptions; it is limited to one request per minute per app instance. No client endpoint can choose another recipient or supply arbitrary push text.

The Notification Center's **Notification preferences** controls affect browser push only. Chat, announcements, KK profile, certificates, admissions, and system updates can be switched independently; in-app notification creation is not disabled by these switches. Security push events are protected and bypass the category setting. New preference records default all categories to enabled, but no browser push is sent until a browser subscription is enabled.

The worker source is `worker/index.js`; next-pwa compiles and imports it into generated `public/sw.js` during a production build. `public/sw.js`, `public/workbox-*.js`, `public/worker-*.js`, and `public/fallback-*.js` are ignored build artifacts; do not edit or commit them. Push payloads contain only an allowlisted event kind and internal route. The worker selects fixed generic copy for announcements, chat, and test updates; it never displays message text, announcement content, or private profile data. Announcement and chat clicks open the matching role dashboard page. Public-news clicks open the public landing page. Page navigations are not cached, and `/offline` is the safe precached document fallback.

## Event notifications

Creating an Event announcement notifies approved, active Officials who can view that Event; an Admin-created global Event also notifies approved Staff. A Staff-created Event is limited to active Officials assigned to the same municipality. The creator is excluded, and a nullable unique dedupe key prevents duplicate rows for the same event and recipient.

Public news is visible on the public landing feed. When an Admin creates a published post or changes a draft to published, approved registered users receive a generic announcement notice; inactive, unapproved, and inactive Official accounts are excluded. Saving a draft or editing an already-published post does not notify again. Official-authored barangay announcements are not supported by the current Event creation flow.

Chat notifications are created only for eligible participants in the conversation other than the sender. The center continues to aggregate unread activity per conversation, and opening the conversation or marking it read clears its related notification events.

## Testing

After deploying migrations and VAPID variables, sign in as distinct approved recipients and verify an Admin global Event, a Staff municipality Event, published public news, and a chat message. Confirm the creator/sender is excluded, unrelated municipalities and inactive accounts receive nothing, and repeated delivery with the same event key creates no duplicate. Enable browser alerts to verify generic copy and internal click destinations; then test read-one, read-all, and chat unread behavior. Permission is requested only after clicking **Enable notifications**.
