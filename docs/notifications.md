# Notification Center and browser alerts

The authenticated Notification Center combines the signed-in user's in-app notices with safe chat activity summaries. It supports All, Unread, and Important filters and per-item or bulk read actions. Notification links are restricted to SKTECH dashboard or mobile paths. Chat summaries never include message text or private profile details.

## Database migration

`prisma/migrations/20261009010000_add_notifications_and_push` adds `AppNotification` and `PushSubscription` with user foreign keys and indexes. The migration enables RLS without client policies; browser clients use authenticated Next.js routes, while the server's Prisma connection performs scoped queries. Deploy this migration through the normal `prisma migrate deploy` release step before enabling the new UI. No database reset or manual production SQL is required.

## Web Push setup

Generate one VAPID key pair with `npx web-push generate-vapid-keys --json`. Store these variables on the Railway app service:

```text
WEB_PUSH_PUBLIC_KEY=<public key>
WEB_PUSH_PRIVATE_KEY=<private key>
WEB_PUSH_SUBJECT=mailto:your-team@example.org
```

Keep the private key on the server. The public key is returned only by the authenticated subscription setup API. Use a real contact address for the subject. Web Push needs HTTPS or localhost and a browser that supports PushManager and service workers. The installed PWA uses the same permission and subscription flow when supported.

The **Enable notifications** button in the center is the only action that requests browser permission. Denial leaves in-app notifications available. **Disable notifications** revokes the current browser subscription. The authenticated **Send test** action creates one generic in-app notice for the current user and sends a generic push to that user's active subscriptions; it is limited to one request per minute per app instance. No client endpoint can choose another recipient or supply arbitrary push text.

The worker source is `worker/index.js`; next-pwa incorporates it into the generated service worker during a production build. Do not edit generated `public/sw.js` directly. The push notification title, body, and click destination are fixed to generic SKTECH text and `/dashboard`. No OTP, profile data, contact detail, or message text enters a push payload.

## Testing and next integration

After deploying the migration and VAPID variables, open the Notification Center while signed in, enable browser alerts, and use **Send test**. Verify the in-app notice, browser alert, click destination, read actions, and disable flow. Test denial separately; the in-app center should continue to work.

The server helper `createNotificationForUser` and `sendPushToUser` can be called from selected high-value server events after the event recipient is verified. This version intentionally does not send a push for every chat message or database change.
