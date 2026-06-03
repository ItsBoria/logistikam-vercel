# תוכנית פיתוח

## 1. היסטוריית הזמנות לצוות (לקוח)
- דף חדש `/shop/orders` שמציג את כל ההזמנות של הצוות המחובר (לפי PIN שב‑localStorage).
- כל הזמנה מציגה: תאריך, סטטוס (ממתינה / מאושרת / מוכנה / נמסרה / מבוטלת / ממתינה לאישור חריגה), סכום, רשימת פריטים, הערות.
- כפתור "ההזמנות שלי" בכותרת של `/shop`.
- Server function חדש: `getTeamOrders({ pin })` שמחזיר הזמנות + פריטים, ללא חשיפת צוותים אחרים.

## 2. סינון וחיפוש בקטלוג
- בעמוד `/shop`: שדה חיפוש (שם/תיאור), בורר קטגוריה, מתג "במלאי בלבד".
- סינון בצד הלקוח על המוצרים שכבר נטענו.

## 3. Web Push notifications
- שימוש ב‑Web Push API מובנה של הדפדפן (חינמי, ללא ספק חיצוני).
- טבלה חדשה `push_subscriptions` (team_id, endpoint, p256dh, auth).
- Service Worker חדש `public/sw.js` לקבלת push.
- בעמוד החנות: כפתור "הפעל התראות" שמבקש הרשאה ורושם subscription לצוות.
- Server function `sendTeamPush(teamId, title, body)` שמשתמש בספריית `web-push` עם VAPID keys.
- Secrets חדשים: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (אני אבקש מהמשתמש להפיק עם פקודה פשוטה, או אייצר אוטומטית).
- שליחה אוטומטית כשסטטוס משתנה ל"מוכנה לאיסוף".
- SMS דרך Twilio נשאר כאופציה משנית אם מוגדר.

## 4. ניהול הזמנות מתקדם (אדמין)
- בעמוד `/admin/orders`: כל שורה ניתנת להרחבה ומציגה את הפריטים, כמויות ומחירים.
- אפשרות לערוך הזמנה קיימת: שינוי כמות פריט, הסרת פריט, חישוב מחדש של הסכום.
- שינוי סטטוס נשאר כפי שהוא, אבל מעבר ל"מוכנה" מפעיל Push (+SMS אם זמין).
- Server functions: `getOrderDetails(orderId)`, `updateOrderItems(orderId, items[])`.

## 5. העלאת תמונות למוצרים
- Supabase Storage bucket ציבורי בשם `product-images`.
- בטופס המוצר (`/admin/products`): שדה העלאת קובץ (drag&drop + בחירה), תצוגה מקדימה, מחיקה.
- נשאר גם שדה URL ידני כגיבוי.
- ייבוא מ‑Excel נשאר תומך ב‑URL בעמודת "תמונה".

## פרטים טכניים

### סכמת DB (מיגרציה אחת)
- `push_subscriptions(id, team_id FK, endpoint UNIQUE, p256dh, auth, created_at)` + RLS (admin only; כתיבה דרך server function עם service role).
- Storage bucket `product-images` ציבורי + policy לאדמינים בלבד להעלאה/מחיקה, קריאה ציבורית.

### חבילות חדשות
- `web-push` להפקת התראות.

### Secrets
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` (mailto:davidpanasik@hotmail.com). אני אייצר את הזוג בעצמי בהרצת סקריפט ואבקש מהמשתמש לשמור אותם.

### קבצים עיקריים שייווצרו/יתעדכנו
- `supabase/migrations/...` — טבלת push_subscriptions
- `public/sw.js` — service worker ל‑push
- `src/lib/push.functions.ts` + `src/lib/push.server.ts`
- `src/lib/team.functions.ts` — `getTeamOrders`
- `src/lib/admin.functions.ts` — `getOrderDetails`, `updateOrderItems`
- `src/routes/shop.tsx` — חיפוש/סינון + כפתורי "ההזמנות שלי" ו"הפעל התראות"
- `src/routes/shop.orders.tsx` — דף חדש
- `src/routes/admin.orders.tsx` — הרחבה של שורות + עריכת פריטים
- `src/routes/admin.products.tsx` — העלאת תמונה

## שאלה אחת לפני שמתחילים
האם להמשיך עם **Web Push בלבד** (חינמי לגמרי, עובד דרך הדפדפן/PWA), או להוסיף גם **Telegram bot** כגיבוי במקביל? Web Push דורש שהמשתמש יאשר הרשאה פעם אחת והמכשיר יהיה מחובר לאינטרנט.
