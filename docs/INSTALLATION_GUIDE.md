# SHAKILWORK — Native Android Installation & Deployment Guide

This guide describes how to install and test the official **SHAKIL TRAVELS Native Android Application** on Android devices, emulators, and Google Play Console.

---

## 1. Compiled Release Artifacts

Both production release artifacts are pre-compiled and located in the `release/` folder of this repository:

| Artifact File | Size | Format | Primary Target |
| :--- | :--- | :--- | :--- |
| **`release/app-release.apk`** | **59.4 MB** | APK (Self-Signed) | Direct sideload on physical Android phones or tablets |
| **`release/app-release.aab`** | **56.9 MB** | Android App Bundle | Google Play Console (Internal / Closed / Production Track) |

---

## 2. Option A: Direct Installation on Physical Android Phone (Sideload)

### Method 1: Using ADB (Android Debug Bridge) via USB
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone to your computer with a USB cable.
3. Run the following command from the repository root:
   ```powershell
   adb install -r release/app-release.apk
   ```
4. The app will install with the name **SHAKIL TRAVELS** and official logo icon.

### Method 2: Direct File Transfer (WhatsApp / Google Drive / USB)
1. Copy `release/app-release.apk` to your phone's internal storage or send it via WhatsApp/Telegram.
2. Open your phone's **Files / Downloads** app and tap `app-release.apk`.
3. If prompted, allow "Install unknown apps" for your file manager.
4. Tap **Install** and then **Open**.

---

## 3. Option B: Running in Android Studio Emulator

1. Start an Android Virtual Device (AVD) running Android 10+ (API 29+).
2. Drag and drop `release/app-release.apk` onto the emulator screen.
3. Alternatively, install via command line:
   ```powershell
   adb -e install release/app-release.apk
   ```
4. The emulator will automatically connect to your PC's local server at `http://10.0.2.2:3000` or the live Vercel cloud server.

---

## 4. Option C: Google Play Console Release

1. Log in to your [Google Play Console](https://play.google.com/console).
2. Select or create the app under package name: `com.shakiltravels.app`.
3. Under **Release > Production** (or **Internal Testing**), click **Create new release**.
4. Upload `release/app-release.aab`.
5. Enter release notes (e.g. "Initial release of SHAKILWORK Native ERP for Candidates and Staff").
6. Click **Save** and **Review Release**.

---

## 5. In-App Server Switching Guide

By default, the release APK automatically connects directly to the live production cloud ERP:
`https://shakil-travels.vercel.app`

If you are developing locally and want to point the app to your development PC:
1. Open the app and go to the **Login Screen**.
2. Tap the **Server Settings** icon (DNS icon in top app bar).
3. Tap the quick chip:
   - **Live ERP (Vercel):** Connects to `https://shakil-travels.vercel.app`
   - **Wi-Fi Phone (0.127):** Connects to `http://192.168.0.127:3000`
   - **PC Emulator:** Connects to `http://10.0.2.2:3000`
4. Tap **Test Connection** to verify server health (`/api/health`).
5. Tap **Save & Apply**.
