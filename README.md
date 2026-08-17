# Wolfgramm Holdings — Video Production Client & Media Portal

A lightweight, responsive client management dashboard and digital asset portal built as a Week 1 prototype challenge for Wolfgramm Holdings. Designed specifically for video production workflows to streamline client tracking, asset categorization, and media review pipelines.

---

## 🚀 Live Demo & Links

- **Live Deployment:** https://wolfgramm-portal.vercel.app
- **GitHub Repository:** https://github.com/bakainusuke/wolfgramm-portal

---

## 🛠️ Tech Stack & Architecture

- **Frontend & Routing:** Next.js (App Router), React, TypeScript
- **Styling & UI Components:** Tailwind CSS, shadcn/ui, Lucide React
- **Backend & Database:** Firebase Firestore (NoSQL Document Store) & Firebase Web SDK
- **Development Tooling:** VS Code, OpenAI Codex, ChatGPT (AI-assisted scaffolding & debugging)
- **Deployment & CI/CD:** Vercel (Automated Git-triggered builds)

---

## ✨ Key Features

### 1. Client Management

- Real-time client overview dashboard with status filters (`Active`, `Lead`, `Archived`).
- Search functionality by client name and company.
- Full CRUD operations: Create new clients and update client records directly in Firestore.

### 2. Video Production Resource Library

- Client-associated media library organizing creative deliverables:
  - **Edited Videos** (Final Masters, Rough Cuts)
  - **Raw Footage** (Camera Reels, D-Log/S-Log B-Roll)
  - **Short-Form Content** (9:16 TikTok / Instagram Reels)
  - **Photos & Stills** (Behind-the-Scenes, Set Photography)
  - **Documents** (Call Sheets, Location Releases, Contracts)
- Status tracking per asset (`Approved`, `In Review`, `Draft`).
- Interactive video player / preview modal for fast playback verification.

### 3. One-Click Mock Data Seeding

- Built-in Firestore seeding script to populate realistic video agency test data (clients, assets, statuses, and external video links) in one click.

---

## ⚙️ Local Development Setup

### 1. Clone the repository

git clone https://github.com/bakainusuke/wolfgramm-portal.git
cd wolfgramm-portal

### 2. Install dependencies

npm install

### 3. Configure environment variables

Create a `.env.local` file in the root directory and configure your Firebase credentials:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

### 4. Run the development server

npm run dev

Open http://localhost:3000 in your browser.

---

## 🔮 Future Roadmap

- **Direct Media Uploads & Transcoding:** Integrate AWS S3 / Cloudflare Stream for direct video proxy rendering and multi-bitrate streaming.
- **Client-Facing Role Based Access (RBAC):** External client login portal restricted to designated client assets only.
- **Time-Coded Video Feedback:** Frame-accurate video review player allowing clients to drop time-stamped annotations and revision requests.
