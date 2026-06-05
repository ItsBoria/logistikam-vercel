## Issue
On iPhone (Safari, not yet installed), `PushToggle` shows an "הוסף למסך הבית" button as a fallback (since iOS only allows push after install). `InstallButton` shows the same button right above it → duplicate. The actual "הפעל התראות" button never appears until the app is installed to home screen.

## Fix
1. **`src/components/push-toggle.tsx`** — when `iosNeedsInstall` is true, return `null` instead of rendering its own "Add to Home Screen" button. `InstallButton` already covers that case in the "עוד" sheet.
2. **`src/components/install-button.tsx`** — after triggering the iOS instructional toast, also explain that notifications will appear after install (so the user knows where the enable-notifications button will come from).

This removes the duplicate and makes the flow clear: install first → then the notifications toggle appears in "עוד".

No backend or business-logic changes.