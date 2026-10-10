# MegaMarto Android App (Android Studio)

MegaMarto includes a Capacitor 8 Android project under `client/android`, package ID `com.megamarto.app`.

## Requirements
- Node.js 24, npm
- Android Studio with Android SDK installed
- Android phone with USB debugging enabled (or emulator)

## Build and open
```bash
git checkout feat/delivery-zone-20261010
cd client
npm install
npm run android:sync
npm run android:open
```
In Android Studio, wait for Gradle sync. Choose your connected phone or emulator and click **Run ▶**. The app will be installed on your device.

For an APK, choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**. For distribution, create a signed release APK/AAB using Android Studio's **Generate Signed Bundle / APK** flow. Never commit keystore or passwords.

## Mobile behavior
- Uses the same React customer, store, admin and delivery screens as the website.
- Geolocation permissions allow nearby-shop discovery and checkout location (ask permission only when needed).
- No broad storage permission is requested; Android's system file picker can be used for uploads.
- HTTPS-only traffic; internet connection is needed for backend APIs.
- Offline screen provides a Retry button.

## Important deployment notes
- The app bundles `client/dist` and uses `https://megamarto-backend.onrender.com` for existing API calls.
- After any frontend change, rerun `npm run android:sync` and rebuild/reinstall the Android app.
- Preview branch code is not production verified. Test login, payment (Razorpay test mode), GPS, navigation, and uploads on an actual phone before distributing.
- A real payment gateway transaction and location-permission testing cannot be completed in GitHub CI alone.
