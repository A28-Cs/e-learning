# Taqato Academy — منصة تعليمية | E-Learning Platform

منصة تعليمية ثنائية اللغة (عربي RTL / إنجليزي) مبنية بـ Next.js 14، مع لوحة تحكم كاملة.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firestore (courses, categories, lessons, users, activationCodes) |
| Video | MUX — direct upload من المتصفح، والـ playback ID يتخزن في Firestore |
| Images | Cloudinary — unsigned upload بالـ preset `e-learning` |

## التشغيل

```bash
npm install
npm run dev
```

الموقع: http://localhost:3000 — لوحة التحكم: http://localhost:3000/admin

## إعداد لازم يتعمل مرة واحدة (من Firebase Console)

1. **Firestore**: من [console.firebase.google.com](https://console.firebase.google.com) → مشروع `e-learning-8123e` → Firestore Database → **Create database** (Production mode، أي region).
2. **Authentication**: → Authentication → Sign-in method → فعّل **Email/Password**.
3. **Cloudinary**: اتأكد إن الـ preset `e-learning` نوعه **Unsigned** (Settings → Upload → Upload presets).

> كل القراءة/الكتابة بتعدّي عبر API routes بالـ Admin SDK، فمش محتاج تنشر Firestore Rules — بس يُفضّل تقفل القواعد العامة (allow read, write: if false).

## الأدمن

الإيميلات اللي في `ADMIN_EMAILS` (ملف `.env.local`) هي اللي بتشوف لوحة التحكم. ضيف إيميلات مفصولة بفاصلة، وسجّل بيها حساب عادي من صفحة التسجيل.

## سير العمل

1. من `/admin/categories` ضيف الفئات.
2. من `/admin/courses/new` اعمل كورس (عنوان/وصف عربي وإنجليزي، سعر، صورة غلاف بترفع على Cloudinary).
3. افتح الكورس وضيف دروس — الفيديو بيترفع مباشرة على MUX من المتصفح، ولما يجهز بيتخزن الـ playback ID في Firestore.
4. علّم "منشور" عشان الكورس يظهر في الموقع.
5. من `/admin/codes` ولّد أكواد تفعيل للكورس وابعتها للطلبة بعد الدفع.
6. الطالب يسجّل حساب، يدخل الكود في صفحة الكورس، ويتفرج.

## الدفع الأونلاين (Paymob)

التكامل جاهز في الكود (Unified Checkout: كروت + محافظ موبايل "فودافون كاش وغيرها" + InstaPay). عشان يشتغل:

1. افتح حساب تاجر على [paymob.com](https://paymob.com) وفعّل وسائل الدفع اللي عايزها (Card / Mobile Wallets / InstaPay).
2. من الداشبورد هات: `Secret Key` و `Public Key` و `HMAC Secret` وأرقام الـ Integration IDs.
3. حطهم في `.env.local` في خانات `PAYMOB_*` واكتب أرقام الـ integrations في `PAYMOB_PAYMENT_METHODS` مفصولة بفاصلة.
4. غيّر `NEXT_PUBLIC_PAYMENTS_ENABLED=1` و `NEXT_PUBLIC_SITE_URL` لعنوان موقعك المنشور.
5. (اختياري لكن مُفضّل) في إعدادات الـ Integration عند Paymob حط:
   - Transaction processed callback: `https://موقعك/api/pay/webhook`
   - Transaction response callback: `https://موقعك/payment-result`

**مسار الدفع:** زرار "اشتري الكورس" → إنشاء Order في Firestore → تحويل لصفحة دفع Paymob → بعد الدفع بيرجع لـ `/payment-result` اللي بتتحقق من توقيع HMAC سيرفر-سايد وبتفعّل الكورس فورًا. الـ webhook بيأكّد نفس العملية (idempotent) حتى لو الطالب قفل المتصفح قبل الرجوع. كل الطلبات بتظهر في `/admin/orders`.

> **فوري:** متاحة بشكل غير مباشر عبر شبكات الكشك في Paymob (أمان/مصاري). لو عايز FawryPay الرسمية (كود فوري) دي محتاجة حساب تاجر منفصل عند فوري وتكامل إضافي.

## ملاحظات أمان

- `.env.local` فيه مفاتيح سرية (Firebase service account + MUX). **متعملوش commit** — هو أصلاً في `.gitignore`.
- الفيديوهات playback policy = public على مستوى MUX، لكن الـ playback ID مش بيتسلم غير للمشتركين (أو الدروس المجانية) عبر `/api/playback`.
