## What’s broken
I found two concrete push issues:

1. **Test notifications fail on the server** because the push sender is using an invalid VAPID subject value. The server log shows:
   - `Vapid subject is not a valid URL. David`
   - The push library requires the subject to be a valid `mailto:` or `https:` URL.
2. **Push setup is inconsistent between environments** because the published app hit a server-function error for `getVapidPublicKey` (`Server function info not found`), which suggests the rebuilt push functions are not fully aligned/deployed across environments.

## Plan
1. **Fix server-side VAPID validation and configuration**
   - Update the push sender to validate `VAPID_SUBJECT` on startup.
   - Use a safe fallback only if the secret is missing/invalid, and return a clear error instead of silently failing.
   - Make test-push responses include the real failure reason so the admin UI shows what is wrong.

2. **Harden the push subscription flow**
   - Verify the client fetches the public VAPID key correctly in the current environment.
   - Make the enable-push flow surface actionable messages for permission denied, invalid VAPID config, bad subscription payloads, and service worker registration problems.
   - Confirm the stored subscription format matches what the sender expects.

3. **Fix admin test notifications UX**
   - Improve the admin “test push” action so it reports cases like:
     - no devices subscribed
     - invalid VAPID config
     - expired subscriptions removed
     - send failures from the browser push service
   - Keep the current per-team behavior, only making the errors understandable and reliable.

4. **Verify preview and published behavior**
   - Check that the rebuilt server functions are available in both preview and published environments.
   - Retest: subscribe a device, send a test notification, and confirm delivery/end-to-end behavior.

## Technical details
- Files likely involved:
  - `src/lib/push.server.ts`
  - `src/lib/push.functions.ts`
  - `src/components/push-toggle.tsx`
  - `src/routes/admin.teams.tsx`
- Known root cause from logs:
  - `VAPID_SUBJECT` is currently invalid and must be something like:
    - `mailto:you@example.com`
    - or `https://yourdomain.com`
- Secondary issue to verify:
  - published server-function mapping for `getVapidPublicKey` appears stale/incomplete and may need regeneration/redeploy validation.

## Expected result
After this fix:
- enabling push should either succeed or show the exact reason it cannot,
- test notifications should no longer fail silently,
- and subscribed devices should actually receive the notification when the team test button is used.