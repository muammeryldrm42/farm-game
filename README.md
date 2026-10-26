# Talons Farm: Android project

The whole game with all of its models, ready to open in Android Studio. No website needed.

## What you need

- Android Studio 2025.1 (Narwhal) or later. The project uses the Android Gradle plugin 8.13 and
  Java 21, which come with it.
- The `node_modules` folder next to `android`: it holds the Capacitor parts the app is built
  from (already in this branch, nothing to install).

## Try it on a phone

1. Open the `android` folder in Android Studio.
2. Wait for the Gradle sync, plug in a phone (USB debugging on), then Run.
   Or Build > Build App Bundle(s) / APK(s) > Build APK(s) for an APK to copy over.

## Build for Google Play

1. Build > Generate Signed App Bundle or APK > Android App Bundle.
2. Make an upload key the first time (keep the `.jks` file and its passwords safe: every later
   update must be signed with the same key), then build the `release` variant.
3. Upload `android/app/release/app-release.aab` in Play Console.

Before every later upload, raise `versionCode` (and `versionName`, as players see it) in
`android/app/build.gradle`: Play refuses a bundle whose `versionCode` it has had before.

## Play Console

- Target API: 36 (Android 16), as Play requires for new apps and updates.
- Privacy policy: the website's `/privacy` page.
- Data safety: the game collects and shares no data (no account, ads or analytics; the farm is
  kept on the phone).
- Permissions the app asks for: internet (the time check), notifications (and starting with the
  phone, to set them again), vibration.
- A new personal developer account must run a closed test (12 testers for 14 days) before the
  production track opens.

## Where the game comes from

`android/app/src/main/assets/public` is the web game's build (`npm run build` on the main branch,
the `out` folder), copied in with each change.
