# SHAKIL TRAVELS - Mobile Application 📱

Official React Native (Expo + TypeScript) mobile application for **SHAKIL TRAVELS** (Govt. Approved Overseas Recruiting Agency, License: `RL-1558`).

---

## 🌟 Features Overview

### 1. 🏠 Home Screen (`src/screens/HomeScreen.tsx`)
- **Brand Header**: Official logo, Government license `RL-1558`, 24/7 hotline dialer, emergency notification bell, and bilingual language switch (`বাং | EN`).
- **Live Visa Tracking Card**: Instant passport search (`A12345678`, `B98765432`) with 5-stage timeline.
- **Popular Destinations**: Saudi Arabia 🇸🇦, UAE 🇦🇪, Qatar 🇶🇦, Malaysia 🇲🇾, Kuwait 🇰🇼, Oman 🇴🇲.
- **Featured Circulars**: Top job demands with salary in local currency (SAR, AED, QAR, MYR).
- **Process Roadmap**: 5-step BMET-compliant transparency workflow.
- **Support & Hotline**: One-tap phone dialer, WhatsApp direct chat, and Dhaka office location.

### 2. 💼 Circulars & Demands (`src/screens/JobsScreen.tsx`)
- **Interactive Search**: Search by job title, country, trade, or company.
- **Trade Category Filters**: Driving, Technical, Construction, Hospitality, Factory, Cleaning.
- **Job Details Modal**: Comprehensive breakdown of salary, vacancies, requirements, food, accommodation, and overtime benefits.
- **Direct Application Form (`ApplicationFormModal`)**: In-app application submission generating reference codes (e.g. `ST-APP-7842`).

### 3. 🛡️ Live File Tracking (`src/screens/TrackingScreen.tsx`)
- Full-page tracking interface with passport lookup.
- 5 recruitment milestones with date stamps and status badges.
- Official BMET anti-fraud notice.
- Direct officer hotline button.

### 4. 👤 Portal & Candidate Zone (`src/screens/PortalScreen.tsx`)
- **Candidate Dashboard**:
  - Verified candidate profile header.
  - Overall progress bar (80% completed, Step 4/5).
  - 6-item document checklist (Passport, Photos, GAMCA Medical, Visa Stamping, BMET Card, Air Ticket).
  - Financial ledger & Money receipt (#ST-MR-4412).
  - Official interactive Money Receipt view (`ReceiptModal`).
  - Assigned processing officer contact card.
- **Staff Control Console**:
  - Live pipeline counters (124 candidates, 28 medical fit, 19 visas, 12 flights).
  - Officer actions: New registration, Status update, SMS alerts, Flight manifests.
- **1-Click Demo Logins** for instant previewing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or yarn

### Installation
```bash
cd mobile
npm install
```

### Running the App
- **Web Browser (Local Preview)**:
  ```bash
  npm run web
  ```
  Open `http://localhost:8081` in your browser. (Press `F12` -> `Ctrl+Shift+M` for mobile device emulation).

- **Android Phone (via Expo Go)**:
  ```bash
  npm start
  ```
  Scan the QR code in the terminal with the **Expo Go** app from Google Play Store.

- **Type Check**:
  ```bash
  npm run typecheck
  ```

---

## 📦 Building Android APK

Build profiles are pre-configured in `eas.json`.

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```
2. **Build Installable Standalone APK**:
   ```bash
   eas build -p android --profile preview
   ```
