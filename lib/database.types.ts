// ===========================================
// INVOICE AI - Database Schema Types
// ===========================================
// These types match the Supabase database schema

export type InvoiceStatus = 'draft' | 'unpaid' | 'paid'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_email: string | null
  logo_url: string | null
  default_currency: string | null
  default_tax_rate: number | null
  default_payment_terms: number | null
  invoice_prefix: string | null
  default_notes: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string // uuid
  user_id: string // uuid, references auth.users
  name: string
  email: string
  phone: string | null
  company: string | null
  address: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string // uuid
  user_id: string // uuid, references auth.users
  client_id: string | null // uuid, references clients
  invoice_number: string // auto-generated: INV-2024-0001
  status: InvoiceStatus
  issue_date: string // date
  due_date: string // date
  currency: string // default: 'USD'
  subtotal: number // decimal
  tax_rate: number // decimal
  tax_amount: number // decimal
  discount: number // decimal, default: 0
  total: number // decimal
  notes: string | null
  terms: string | null
  paid_at: string | null // timestamp
  paid_amount: number | null // decimal
  // Sender info (stored per invoice for historical accuracy)
  sender_name: string | null
  sender_email: string | null
  sender_company: string | null
  sender_address: string | null
  sender_logo_url: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string // uuid
  invoice_id: string // uuid, references invoices
  description: string
  quantity: number // decimal
  rate: number // decimal
  amount: number // decimal, calculated: quantity * rate
  created_at: string
}

// Extended types with relations
export interface InvoiceWithClient extends Invoice {
  client: Client | null
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[]
}

export interface InvoiceWithClientAndItems extends Invoice {
  client: Client | null
  items: InvoiceItem[]
}

// Form types for creating/editing
export interface CreateClientInput {
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  avatar_url?: string
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string
}

export interface CreateInvoiceInput {
  client_id?: string | null
  invoice_number?: string
  status?: InvoiceStatus
  issue_date: string
  due_date: string
  currency?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount?: number
  total: number
  notes?: string
  terms?: string
  sender_name?: string
  sender_email?: string
  sender_company?: string
  sender_address?: string
  sender_logo_url?: string
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  id: string
}

export interface CreateInvoiceItemInput {
  invoice_id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface UpdateInvoiceItemInput extends Partial<CreateInvoiceItemInput> {
  id: string
}

// AI parsing types
export interface AIParseInvoiceResult {
  client_name?: string
  client_email?: string
  items: {
    description: string
    quantity: number
    rate: number
  }[]
  notes?: string
}

// Dashboard stats
export interface DashboardStats {
  totalRevenue: number
  invoicesIssued: number
  paidInvoices: number
  unpaidInvoices: number
}

// Chart data
export interface ChartDataPoint {
  date: string
  paid: number
  unpaid: number
  paidCount: number
  unpaidCount: number
}
