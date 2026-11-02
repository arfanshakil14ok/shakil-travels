# Google Play Store Listing & Submission Guide 🚀
**Application:** SHAKIL TRAVELS (com.shakiltravels.app)  
**Govt. Approved Recruiting Agency License:** RL-1558  

---

## 1. Store Listing Details

### App Title (Max 30 characters)
```text
SHAKIL TRAVELS - Visa Tracking
```

### Short Description (Max 80 characters)
```text
Official visa tracking & overseas job recruitment app for SHAKIL TRAVELS.
```

### Full Description (Max 4000 characters)
```text
SHAKIL TRAVELS (Govt. Approved Recruiting License RL-1558) is a premier overseas recruitment and manpower agency based in Dhaka, Bangladesh. 

The official SHAKIL TRAVELS mobile application empowers aspiring overseas workers and candidates to track their recruitment journey transparently, browse verified job circulars, and manage their documents in real time.

🌟 KEY FEATURES:

1. 🔍 LIVE VISA & FILE TRACKING:
• Enter your Passport Number or Application ID to instantly check your current processing stage.
• Live 5-Stage Timeline:
   - Initial Interview & Skill Screening
   - GAMCA / Authorized Medical Examination
   - Embassy Visa Stamping (Mofa Approved)
   - BMET Smart Card Clearance & Orientation
   - Flight Ticket Booking & Final Departure Briefing

2. 💼 OVERSEAS JOB CIRCULARS & DEMANDS:
• Explore government-approved vacancies across top destinations:
   - 🇸🇦 Saudi Arabia (KSA)
   - 🇦🇪 United Arab Emirates (Dubai)
   - 🇶🇦 Qatar
   - 🇲🇾 Malaysia
   - 🇰🇼 Kuwait
   - 🇴🇲 Oman
• View exact monthly salary in local currency (SAR, AED, QAR, MYR), vacancies, requirements, food, accommodation, and overtime benefits.
• Apply directly from the app in seconds.

3. 👤 CANDIDATE PROFILE & DIGITAL RECEIPTS:
• Track verified personal profile and overall processing percentage.
• View your document checklist: Passport, Photos, Medical Fit Certificate, Visa Copy, and BMET Smart Card.
• Access official digitized money receipts (#ST-MR) with authentic payment ledgers.

4. 🛡️ SAFE MIGRATION & BMET COMPLIANCE:
• We adhere strictly to the Ministry of Expatriates' Welfare and Overseas Employment and BMET guidelines.
• Protect yourself from middlemen and unauthorized agents with direct agency access.

5. 📞 24/7 HELPLINE & OFFICE SUPPORT:
• One-tap direct call to our Dhaka Head Office hotline.
• Instant WhatsApp chat for rapid candidate inquiries.

Office Address:
Nayapaltan, VIP Road, Dhaka-1000, Bangladesh
License: RL-1558
Email: info@shakiltravels.com
Hotline: +880 1711-000000
```

---

## 2. Store Categorization & Contact Details
- **App Category:** Business
- **Tags:** Manpower Recruitment, Visa Tracking, Overseas Jobs, Employment, Travel
- **Target Audience:** Age 18 and older
- **Website:** `https://shakiltravels.com`
- **Support Email:** `info@shakiltravels.com`
- **Support Phone:** `+8801711000000`
- **Privacy Policy URL:** `https://shakiltravels.com/privacy-policy`

---

## 3. Google Play Data Safety Form Answers
When filling out the **Data safety** section in Google Play Console, declare:

1. **Data collected:**
   - **Personal info:** Name, Phone Number, Email, Passport Number (for identification & visa filing).
   - **Financial info:** Payment status & receipts (contract fee records).
   - **User IDs:** Candidate Reference ID.
2. **Is data shared with third parties?**
   - **No** (data is NOT shared with advertising networks or third-party marketers). Only shared with authorized government authorities (foreign embassies, BMET) for mandatory immigration clearance.
3. **Security practices:**
   - Data is encrypted in transit (HTTPS / TLS).
   - Users can request data deletion by contacting `privacy@shakiltravels.com`.

---

## 4. Keystore & Signing Details
- **Keystore File:** `mobile/shakil-travels-release.keystore`
- **Alias:** `shakiltravels`
- **Validity:** Until March 20, 2054
- **Key Password:** `ShakilTravels2026@`
- **Store Password:** `ShakilTravels2026@`
- **SHA-1 Fingerprint:** `61:2F:55:07:99:E7:F6:87:0C:07:A1:F2:31:39:C3:77:D9:45:6C:DB`
- **SHA-256 Fingerprint:** `ED:2D:C3:75:BB:47:4D:97:B6:0B:13:37:0F:50:BF:F3:CE:4F:E6:9B:40:5C:5F:2A:70:43:46:CF:2D:41:84:AA`

---

## 5. Steps to Release on Google Play Console

1. **Log in to Google Play Console:**
   Go to [https://play.google.com/console](https://play.google.com/console).

2. **Create New App:**
   - Click **Create app**.
   - App name: `SHAKIL TRAVELS - Visa Tracking`
   - Default language: `Bengali (bn-BD)` or `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`
   - Accept Declarations.

3. **Complete App Set-up Tasks:**
   - **Privacy Policy:** Paste `https://shakiltravels.com/privacy-policy`
   - **App access:** All functionality is available without special credentials (or use demo passport `A12345678`).
   - **Ads:** Select "No, my app does not contain ads".
   - **Content rating:** Complete the questionnaire (select Utility/Business -> receives 'Everyone').
   - **Target audience:** Select "18 and over".
   - **Data safety:** Fill out according to Section 3 above.
   - **Government apps:** Select "No" (we are a private recruiting agency with license RL-1558).

4. **Upload Graphics & Screenshots:**
   - App icon: 512 x 512 px PNG.
   - Feature graphic: 1024 x 500 px PNG/JPEG.
   - Phone screenshots: At least 2 screenshots from the app.

5. **Upload the Android App Bundle (`.aab`):**
   - Go to **Production** (or **Closed testing**).
   - Click **Create new release**.
   - Upload your signed `.aab` file.
   - Enter Release Name: `1.0.0 (1)`.
   - Click **Next** -> **Review and roll out release**.
