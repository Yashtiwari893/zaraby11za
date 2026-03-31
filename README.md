# ZARA — WhatsApp Personal Assistant

> Powered by 11za · Groq · Mistral · Supabase

ZARA is a smart WhatsApp-based personal assistant that helps users manage reminders, tasks, documents, and daily schedules. Supports Hindi, English, and Gujarati.

---

## 🚀 Setup Guide

### Step 1 — Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations in order:
   - `migrations/create_database.sql`
   - `migrations/007_sam_personal_assistant.sql`
   - `migrations/add_11za_credentials_to_files.sql`
   a
   sa
   sa
   sa
   - `migrations/add_intent_and_file_type.sql`
   - `migrations/add_credentials_to_phone_mapping.sql`
   - **`migrations/008_fix_all_bugs.sql`** ← IMPORTANT, run this last
3. Go to **Storage** and create a bucket named `documents` (set to private)

### Step 2 — Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (never expose publicly)
- `GROQ_API_KEY` — From [console.groq.com](https://console.groq.com)
- `MISTRAL_API_KEY` — From [console.mistral.ai](https://console.mistral.ai) (for OCR)
- `ELEVEN_ZA_API_KEY` — Your 11za API key
- `WEBHOOK_VERIFY_TOKEN` — Any random string for webhook verification

### Step 3 — Install & Run

```bash
npm install
npm run dev
```

### Step 4 — Configure 11za Webhook

1. Go to `/files` page in your app
2. Add your WhatsApp Business number
3. Set your 11za Auth Token and Origin
4. Configure webhook URL in 11za dashboard:
   ```
   https://your-domain.vercel.app/api/webhook/whatsapp
   ```

### Step 5 — Deploy to Vercel

```bash
npx vercel --prod
```

Add all env variables in Vercel dashboard under Settings → Environment Variables.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhook/whatsapp/   ← Main WhatsApp message handler
│   │   ├── cron/
│   │   │   ├── reminders/      ← Fires due reminders (every minute)
│   │   │   └── briefing/       ← Morning briefing (9 AM IST)
│   │   ├── ocr/                ← Image OCR endpoint
│   │   └── ...
│   ├── files/                  ← Admin panel
│   └── ...
└── lib/
    ├── ai/                     ← Intent classification, date parsing
    ├── features/               ← Reminder, Task, Document, Briefing logic
    └── whatsapp/               ← WhatsApp client & message templates
```

---

## ✨ Features

- ⏰ **Smart Reminders** — "Kal 9 bje meeting" → auto parsed & saved
- 📋 **Task Lists** — Grocery, office, any list
- 📁 **Document Vault** — Save Aadhaar, bills, photos via WhatsApp
- 🌅 **Morning Briefing** — Daily summary at 9 AM
- 🗣️ **Voice Notes** — Auto transcribed via Groq Whisper
- 🌐 **Bilingual** — Hindi, English, Gujarati

---

## 🐛 Bugs Fixed (v2)

1. Reminders cron was empty — no reminders ever fired
2. Briefing cron was empty — no briefings ever sent
3. Reminders cron not registered in vercel.json
4. `sessions` table missing from schema
5. `recurrence_time` column missing from reminders table
6. CANCEL_REMINDER called wrong handler (listed instead of cancelled)
7. DELETE_TASK was missing from webhook switch
8. Media MIME type hardcoded as image/jpeg (PNG/WEBP/HEIC broke)
9. update-phone-settings upsert conflict column mismatch
10. `briefing_log` table name typo (was `briefing_logs`)
11. `scheduled_at NOT NULL` blocked recurring reminder saves
12. OCR API route was missing
13. `/api/dev/reset-all` had no auth protection
14. `/api/phone-groups` exposed auth_token credentials
