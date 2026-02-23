# AfyaAI – AI-Powered Rural Health Triage & Teleconsultation

> **BEORCHID Africa Developers Hackathon 2026** • Submitted by **Abdul Hafis Mohammed**

Intelligent triage and teleconsultation platform for rural African communities. Provides symptom assessment, risk classification, and connection to healthcare resources.

---

## Problem Statement

Access to timely healthcare remains a critical challenge across rural African communities. Millions face delayed diagnoses, long travel distances, overcrowded facilities, and limited access to medical professionals. AfyaAI addresses this by providing AI-driven symptom assessment and triage optimized for low-resource settings.

## Solution Overview

AfyaAI is an intelligent triage and referral platform that:

- **Guides users** through conversational symptom assessment (chat-style, adaptive Q&A)
- **Classifies risk** (Low / Medium / High / Emergency) using rule-based + AI logic
- **Connects users to care** – nearby clinics, directions, emergency hospitals with one-tap call
- **Supports voice** – hear recommendations aloud, or have a live AI voice call (ElevenLabs)
- **Helps admins** – manage clinics with address search, view analytics, track trends

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **Clerk** – Authentication
- **Neon** – PostgreSQL database
- **Drizzle** – ORM
- **OpenAI** – AI triage engine
- **ElevenLabs** – Voice teleconsult + live AI call (Conversational AI)
- **Google Maps** – Geocoding, Places Autocomplete, clinic locations
- **Tailwind CSS** – Styling

## Quick Start

**Prerequisites:** Node.js 18+, pnpm (`npm install -g pnpm`)

### 1. Install dependencies

```bash
cd afya-app
pnpm install
```

### 2. Environment variables

Create `.env.local` in `afya-app/` (or copy from `.env.example`). Add:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | [Clerk](https://clerk.com) publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `DATABASE_URL` | ✅ | [Neon](https://neon.tech) PostgreSQL URL (`?sslmode=require`) |
| `OPENAI_API_KEY` | ✅ | [OpenAI](https://platform.openai.com) API key (AI triage) |
| `ADMIN_USER_IDS` | ⚠️ | Comma-separated Clerk user IDs for admin access |
| `ELEVENLABS_API_KEY` | Optional | Voice teleconsult TTS (free tier ~10 min/month) |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Optional | [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) – live voice call |
| `GOOGLE_MAPS_API_KEY` | Optional | Geocoding (Geocoding + Places API in Cloud Console) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Client-side Places Autocomplete, map display |

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...?sslmode=require
OPENAI_API_KEY=sk-...
ADMIN_USER_IDS=user_xxx,user_yyy

# Optional – voice & maps
ELEVENLABS_API_KEY=
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### 3. Database setup (optional)

If using Neon:

```bash
pnpm db:push
```

To seed demo clinics:

```bash
pnpm tsx src/scripts/seed-clinics.ts
```

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Production build

```bash
pnpm build
pnpm start
```

### 6. Deploy

Deploy to **Vercel** (recommended): connect the `afya-app` directory, add environment variables, and deploy. See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Features

### Core
- ✅ **Conversational AI assessment** – Chat-style adaptive Q&A (replaces basic form)
- ✅ **Symptom body map** – Visual body region selector
- ✅ **Full conversation history saved** – Every turn in `assessment_turns`
- ✅ Rule-based + AI triage (improved prompts)
- ✅ Risk-level results (Low / Medium / High / Emergency)
- ✅ Share report, Print/Export

### Modern Dashboard
- ✅ Sidebar navigation (collapsible)
- ✅ Stats cards, pie charts, weekly trends
- ✅ User & admin analytics
- ✅ Emergency quick access

### Admin
- ✅ Super admin role (via `ADMIN_USER_IDS` or `admins` table)
- ✅ Manage clinics (add/edit/delete) with **Google Maps** – search address, get coordinates
- ✅ System-wide analytics

### Additional
- ✅ **Voice teleconsult (ElevenLabs)** – Hear recommendations aloud, 500 chars max (free tier)
- ✅ **Live AI call** – Natural voice conversation (ElevenLabs Conversational AI, like talking to a person); fallback: Whisper + TTS when agent not configured
- ✅ **Smart clinic matcher** – Clinics ranked by risk level
- ✅ **Nearby clinics** – Sorted by distance from user location, Get directions
- ✅ **Emergency flow** – When AI detects emergency, shows nearest hospitals with call buttons
- ✅ **Symptom insights** – Anonymized tips on results page
- ✅ Emergency mode (`/assessment?emergency=1`)

## Project Structure

```
afya-app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Protected: dashboard, assessment, results, teleconsult
│   │   ├── (auth)/sign-in, sign-up
│   │   ├── admin/         # Admin: overview, clinics, analytics
│   │   ├── api/           # triage, assessments, clinics, admin
│   │   ├── clinics/       # Public clinic locator
│   │   └── page.tsx       # Landing
│   ├── components/dashboard/
│   └── lib/               # db, admin
```

---

## License

Private / Hackathon submission – BEORCHID Africa Developers Hackathon 2026.
