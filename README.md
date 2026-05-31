# Kerala Science City | Document Management & Tracking System

An extremely polished, responsive, and secure **Document Management & Tracking System** built custom for the **Kerala Science City**. Designed to run entirely as a client-side Single Page Application (SPA), it provides real-time syncing and visual tracking of submissions and office orders directly from public Google Sheets.

This system is optimized for free, serverless hosting on **GitHub Pages**.

---

## 🚀 Key Features

- **Dynamic Sync Dashboard**: Displays essential KPIs (Total Submissions, Active Reviews, Completed Actions, Issued Office Orders) and real-time category distribution/status meters.
- **Relational Document Tracking**: Scans and cross-references data records automatically, establishing parent-child relationships between submissions and formal office orders.
- **Interactive Progress Timeline**: Users can search for a Submission ID (e.g. `KSC/SUB/2026/001`) or Order Number to instantly render an interactive, step-by-step tracking timeline.
- **Advanced Registry Searching**: Advanced search across IDs, subjects, submitters, and descriptions with dynamic category drop-downs, status filters, table sorting, and fast pagination.
- **Glassmorphic Metadata Modals**: Deep-dive modals presenting exhaustive parameters, direct Google Drive document preview links, quick copy-to-clipboard actions, and embedded lists of linked sub-records.
- **Dual Visual Themes**: Modern dark-and-light-mode engine featuring glassmorphic frames, HSL-themed brand palettes (progressive scientific emerald), and micro-animations that persist visual preferences using `localStorage`.

---

## 📂 Architecture Overview

The application features a modern, ultra-lightweight stack with **zero external script dependencies**, making it highly secure and compliant with strict Content Security Policies (CSP):

```
├── index.html       # Dynamic Semantic Layout, SVGs, Modals, Section Templates
├── styles.css       # Design System Tokens, CSS Variables, Theme Queries, Grids
├── app.js           # CSV Engine, Normalizer, Cross-Linking, UI Renderers
└── README.md        # Comprehensive Setup and Deployment Documentation
```

### 🔒 Built-in Security Safeguards
1. **XSS Protection**: Zero use of `innerHTML` or unsafe elements with spreadsheet strings. All values are securely sanitized, encoded, and appended using browser native DOM parameters (`textContent`, `createElement`).
2. **Key Resiliency**: Normalized fuzzy mapping protects the application from breaking if headers are modified in the spreadsheet (e.g., adding spaces or casing changes like `"Submission ID"` to `"submission id "`).
3. **Robust Caching**: Operates with an internal `localStorage` fallback. If the network is offline or the spreadsheet is throttled, the interface safely operates using cached records and signals a gentle sync indicator.
4. **No Secrets Exposed**: Pure read-only queries. The app extracts public CSV feeds directly from Google's exports, meaning no API credentials, private OAuth keys, or service account files are stored inside the GitHub repository.

---

## 📊 Google Sheets Data Integration

The system pulls data from two spreadsheets associated with your Google Forms:
1. **Submission Register**: [Spreadsheet Link](https://docs.google.com/spreadsheets/d/1z3pMERl1HH2KKIQJtIE2gRElpjQwPRQb5VSfct521Cc/edit?usp=sharing)
2. **Office Order Register**: [Spreadsheet Link](https://docs.google.com/spreadsheets/d/1_yeOVxT5PWre9sxlXrAEsGLgSD4OLIpsTHAtevl1qzk/edit?usp=sharing)

### How Data Extraction Works
When a user visits the dashboard, JavaScript sends standard `fetch` requests directly to Google's CSV export endpoints:
- `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv`

### How Relationships are Mapped
- The **Office Order Register** contains a column named `Related Submission ID`.
- The **Submission Register** contains a column named `Office Order No. (if applicable)`.
- The script automatically cross-references these IDs, matching them to construct interactive timelines showing how a request progresses into a signed administrative order.

---

## 🛠️ GitHub Pages Deployment Guide

To host this tracking system on GitHub for free:

### Step 1: Create a GitHub Repository
1. Log in to your [GitHub Account](https://github.com).
2. Click **New** to create a new repository.
3. Name it (e.g. `document-tracking-system`).
4. Set it to **Public** (required for standard free GitHub Pages).
5. Click **Create repository**.

### Step 2: Push the Source Files
Upload or push the files from this directory to the main branch:
```bash
git init
git add .
git commit -m "Initial commit: Kerala Science City Document System"
git remote add origin https://github.com/YOUR_USERNAME/document-tracking-system.git
git branch -M main
git push -u origin main
```
*(Alternatively, you can drag-and-drop `index.html`, `styles.css`, `app.js`, and `README.md` directly into GitHub's web interface).*

### Step 3: Enable GitHub Pages
1. In your GitHub repository, navigate to the **Settings** tab.
2. On the left sidebar under the "Code and automation" section, click on **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** as the source.
4. Select `main` (or `master`) as the branch, leave the folder as `/ (root)`, and click **Save**.
5. Wait 1–2 minutes. GitHub will display a secure URL at the top of the page:
   `https://YOUR_USERNAME.github.io/document-tracking-system/`

---

## ⚙️ Customization & Sheet Configuration

If you ever duplicate your Google Sheets or want to connect new spreadsheets:

1. Open `app.js`.
2. Locate the `SPREADSHEET_CONFIG` object at the top of the file:
   ```javascript
   const SPREADSHEET_CONFIG = {
       submissionsUrl: "https://docs.google.com/spreadsheets/d/NEW_SUBMISSION_SHEET_ID/gviz/tq?tqx=out:csv",
       ordersUrl: "https://docs.google.com/spreadsheets/d/NEW_ORDER_SHEET_ID/gviz/tq?tqx=out:csv"
   };
   ```
3. Replace `NEW_SUBMISSION_SHEET_ID` and `NEW_ORDER_SHEET_ID` with your new Google Sheet IDs (found in their browser URLs).
4. Commit and push the changes to GitHub. The live dashboard updates instantly!
