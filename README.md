# Invoice AI

AI-powered invoicing for freelancers and agencies. Create professional invoices in seconds, track payments, and send beautiful email invoices — all in one place.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL + Auth) |
| Proxy | `proxy.ts` (Next.js 16 convention) |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui + Radix UI |
| Icons | React Icons (Remix Icons) |
| Charts | Recharts |
| AI | OpenAI GPT-4o-mini |
| Email | Resend (responsive HTML templates) |
| PDF | html2canvas + jsPDF |
| Analytics | Vercel Analytics |

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
# or: npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional — AI features (invoice generation, email drafts)
OPENAI_API_KEY=sk-proj-your-key

# Optional — Email sending
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=invoices@yourdomain.com
```

### 3. Set up the database

1. Go to [supabase.com](https://supabase.com) → create or open your project
2. Go to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `SUPABASE_SETUP.sql` and paste it in
5. Click **Run** (RLS, triggers, indexes — everything is set up automatically)

### 4. Configure Supabase Auth URLs

In your Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (for dev) or your production URL
- **Redirect URLs**: Add both:
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback` (once deployed)

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Setting Up Services

### OpenAI (AI features)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / log in → **API Keys** → **Create new secret key**
3. Add to `.env.local` as `OPENAI_API_KEY=sk-proj-...`
4. Add a small amount of credit ($5 is plenty — gpt-4o-mini costs ~$0.15/1M tokens)

**What it powers:**
- AI invoice line item generation from plain-language descriptions
- AI email drafting for invoice delivery and payment reminders

**Without it:** The app uses sensible template fallbacks — fully functional.

---

### Resend (Email sending)

1. Go to [resend.com](https://resend.com) and create a free account
2. Free tier: **3,000 emails/month**, no credit card required
3. **Add your domain** (or use Resend's test address during development):
   - Go to **Domains** → **Add Domain** → follow DNS instructions
   - Or use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` for testing
4. Go to **API Keys** → **Create API Key**
5. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your-key
   RESEND_FROM_EMAIL=invoices@yourdomain.com
   ```

**What it sends:**
- 📄 **Invoice emails** — Beautiful responsive HTML with line items, totals, branding
- 🔔 **Payment reminders** — Styled differently (red accent) for overdue invoices
- ✅ **Payment receipts** — Green accent for paid invoice confirmations

**Without it:** Invoices are saved to the database but no email is sent. A toast message tells you to configure Resend.

---

## Project Structure

```
invoice-ai/
├── proxy.ts                    # Next.js 16 proxy (auth + route protection)
├── SUPABASE_SETUP.sql          # Complete database setup — run this once
├── .env.example                # Environment variable template
│
├── app/
│   ├── layout.tsx              # Root layout (fonts, Toaster, Analytics)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles + Tailwind theme
│   │
│   ├── auth/
│   │   ├── login/page.tsx      # Sign in page
│   │   ├── signup/page.tsx     # Sign up page
│   │   ├── forgot-password/    # Password reset
│   │   └── callback/route.ts   # OAuth + magic link callback
│   │
│   ├── dashboard/
│   │   ├── layout.tsx          # Sidebar + Header shell (server component)
│   │   ├── page.tsx            # Overview: stats, chart, recent invoices
│   │   ├── invoices/
│   │   │   ├── page.tsx        # Invoice list with search/filter/pagination
│   │   │   ├── new/page.tsx    # Create invoice (live PDF preview + AI)
│   │   │   └── [id]/page.tsx   # Invoice detail, edit, send, download
│   │   ├── clients/page.tsx    # Client management (add/edit/delete)
│   │   ├── settings/page.tsx   # Profile, company, invoice defaults, security
│   │   └── ai/page.tsx         # AI assistant page
│   │
│   └── api/
│       ├── ai/generate/route.ts  # OpenAI: line items, email, reminder, terms
│       ├── ai/email/route.ts     # OpenAI: dedicated email generation
│       └── invoices/send/route.ts # Resend: send beautiful HTML invoice emails
│
├── components/
│   ├── sidebar.tsx             # Collapsible nav sidebar
│   ├── header.tsx              # Top header with quick actions
│   ├── create-with-ai-dialog.tsx # AI invoice creation modal
│   └── ui/                     # shadcn/ui component library
│
└── lib/
    ├── database.types.ts       # TypeScript types matching Supabase schema
    ├── email-templates.ts      # Responsive HTML + plain-text email builder
    └── supabase/
        ├── client.ts           # Browser Supabase client
        └── server.ts           # Server Supabase client
```

---

## Deployment (Vercel)

```bash
# Push to GitHub, then:
# 1. Import repo at vercel.com
# 2. Set environment variables (see below)
# 3. Deploy
```

**Required env vars in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Optional but recommended:**
```
OPENAI_API_KEY            # AI features
RESEND_API_KEY            # Email sending
RESEND_FROM_EMAIL         # Your verified sender
NEXT_PUBLIC_APP_URL       # Your Vercel URL (used in email footers)
SUPABASE_SERVICE_ROLE_KEY # Admin operations (future use)
```

**After deploying:**
- Update Supabase Auth → URL Configuration with your Vercel production URL
- Update Supabase Auth → Redirect URLs with `https://your-app.vercel.app/auth/callback`

---

## Features

### ✅ Invoices
- Create invoices with live PDF preview
- Line items with quantity × rate calculation
- Tax rate, discount support
- PDF download (html2canvas + jsPDF)
- Status tracking: Draft → Unpaid → Paid
- Duplicate any invoice as a draft
- Search, filter by status, pagination

### ✅ AI (OpenAI GPT-4o-mini)
- Describe work in plain English → auto-fill line items
- AI-generated email drafts for invoice delivery
- AI-generated payment reminder emails
- Smart fallbacks when API key is not set

### ✅ Email (Resend)
- Beautiful responsive HTML emails (dark header, clean layout)
- Line items table with totals
- Invoice type variants: invoice / reminder (red) / receipt (green)
- Plain-text fallback for email clients that don't render HTML
- Graceful degradation when no RESEND_API_KEY

### ✅ Clients
- Add, edit, delete clients
- Associate clients with invoices
- Client invoice history

### ✅ Settings
- Profile (name, avatar)
- Company (business name, email, phone, address, logo)
- Invoice defaults (currency, tax rate, payment terms, prefix, notes)
- Password change

### ✅ Auth (Supabase)
- Email + password sign up/in
- Google OAuth
- Forgot password / reset
- Auto-redirect (proxy.ts protects `/dashboard/*`)
- Profile auto-created on signup via DB trigger

---

## Troubleshooting

**Data not saving after login**
→ Run the full `SUPABASE_SETUP.sql` in Supabase SQL Editor. The schema includes all required columns and the profile auto-creation trigger.

**"Missing Supabase environment variables"**
→ Make sure `.env.local` exists with correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Dashboard redirects to login immediately**
→ The `proxy.ts` file must be at the project root (same level as `app/`). Check it exists.

**AI features say "no API key"**
→ Add `OPENAI_API_KEY` to `.env.local` and restart the dev server. Without it, templates are used.

**Emails not sending**
→ Add `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`. Check Resend dashboard for delivery logs.

**Supabase connection fails in production**
→ Make sure your Supabase project is not paused (free tier pauses after 1 week of inactivity). Go to supabase.com and resume it.

**Google OAuth not working**
→ In Supabase → Authentication → Providers → Google: add your Google OAuth client ID and secret. In Google Cloud Console, add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI.
