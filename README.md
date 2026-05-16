# Invoice AI

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)
![React Icons](https://img.shields.io/badge/React_Icons-5.x-e91e63?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

AI-powered invoicing for freelancers and agencies. Create invoices in seconds, track payments, automate reminders — all in one place.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui, Radix UI |
| Icons | React Icons (Remix Icons) |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |

---

## Local Setup

### 1. Install dependencies

```bash
pnpm install
# or npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Add your keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — AI features
OPENAI_API_KEY=sk-your-key

# Optional — Email sending
RESEND_API_KEY=your-resend-key
```

### 3. Set up Supabase

Go to [supabase.com](https://supabase.com), create a project, and run the following SQL in the **SQL Editor**:

```sql
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  default_currency TEXT DEFAULT 'USD',
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  default_payment_terms INTEGER DEFAULT 14,
  invoice_prefix TEXT DEFAULT 'INV-',
  default_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(10, 2),
  total DECIMAL(10, 2),
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  rate DECIMAL(10, 2),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);
```

### 4. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
invoice-ai/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles & theme
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx               # Overview & revenue charts
│   │   ├── layout.tsx             # Sidebar + header layout
│   │   ├── invoices/
│   │   │   ├── page.tsx           # Invoice list
│   │   │   ├── new/page.tsx       # Create invoice
│   │   │   └── [id]/page.tsx      # Invoice detail
│   │   ├── clients/page.tsx
│   │   ├── ai/page.tsx            # AI generation
│   │   └── settings/page.tsx
│   └── about/ blog/ pricing/ contact/ privacy/ terms/ cookies/ security/
├── components/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── create-with-ai-dialog.tsx
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── database.types.ts          # Supabase TypeScript types
│   └── supabase/
│       ├── client.ts              # Browser client
│       └── server.ts              # Server client
└── .env.example
```

---

## AI Features

Currently mocked for demo. To enable real AI:

1. Add `OPENAI_API_KEY` to `.env.local`
2. Create `/app/api/ai/generate/route.ts`
3. Connect it in `/components/create-with-ai-dialog.tsx`

---

## Email Setup

To send invoices by email (optional):

1. Sign up at [resend.com](https://resend.com)
2. Add `RESEND_API_KEY` to `.env.local`
3. Create email templates in `/lib/emails/`

---

## API Routes (Ready to Implement)

```
/api/
├── auth/          signup · login · logout
├── invoices/      GET · POST · [id] GET/PUT/DELETE
├── clients/       GET · POST · [id] PUT/DELETE
└── ai/            generate · templates
```

---

## Deployment

### Vercel (recommended)

```bash
git push origin main
# Import repo in vercel.com → add env vars → deploy
```

**Required env vars in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` *(if using AI)*

---

## Troubleshooting

**Supabase connection fails** — double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Make sure your project is not paused.

**Build errors / stale cache**
```bash
rm -rf .next
pnpm install
pnpm build
```

**Port in use**
```bash
pnpm dev -- -p 3001
```

---

## Roadmap

- [ ] PDF invoice generation
- [ ] Email invoice sending via Resend
- [ ] Stripe payment integration
- [ ] Recurring invoices
- [ ] Multi-currency support
- [ ] Webhook integrations
- [ ] Invoice template library

---

## License

MIT — free to use for personal and commercial projects.
