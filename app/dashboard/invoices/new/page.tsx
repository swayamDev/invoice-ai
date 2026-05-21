'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  RiAddLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiArrowLeftLine,
  RiSparkling2Line,
  RiDownloadLine,
  RiLoaderLine,
  RiUserLine,
  RiCloseLine,
  RiCheckLine,
  RiMailLine,
  RiImageLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/database.types'

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'SGD']

const fmt = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

const today = () => new Date().toISOString().split('T')[0]
const addDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
const formatDate = (s: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

function InvoicePDFPreview({
  invoiceNumber, issueDate, dueDate, currency, taxRate, notes,
  lineItems, client, sender, logoUrl,
}: {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  taxRate: number
  notes: string
  lineItems: LineItem[]
  client: Client | null
  sender: { name: string; email: string; company: string; address: string }
  logoUrl: string | null
}) {
  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0)
  const taxAmt = subtotal * (taxRate / 100)
  const total = subtotal + taxAmt

  return (
    <div
      id="invoice-preview"
      className="bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px' }}
    >
      {/* Header */}
      <div className="px-10 pt-10 pb-6">
        <div className="flex justify-between items-start">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover mb-3" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mb-3 text-gray-400 text-xs">Logo</div>
            )}
            <p className="font-bold text-gray-900 text-base">{sender.company || sender.name}</p>
            <p className="text-gray-500 text-xs">{sender.email}</p>
            <p className="text-gray-500 text-xs">{sender.address}</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-900 tracking-wider mb-1">INVOICE</h1>
            <p className="text-[#FF0A54] font-bold text-base">{invoiceNumber}</p>
            <div className="mt-2 inline-block border border-red-300 rounded px-2 py-0.5">
              <span className="text-red-500 text-xs font-semibold uppercase">UNPAID</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-5 text-xs text-gray-500">
          <div className="space-y-0.5">
            <div className="flex gap-3"><span className="font-medium text-gray-700 w-16">Issue Date</span><span>{formatDate(issueDate)}</span></div>
            <div className="flex gap-3"><span className="font-medium text-gray-700 w-16">Due Date</span><span>{formatDate(dueDate)}</span></div>
          </div>
        </div>
      </div>

      {/* Bill From / To */}
      <div className="px-10 py-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Bill From</p>
            <p className="font-semibold text-gray-800">{sender.company || sender.name}</p>
            <p className="text-gray-500 text-xs">{sender.email}</p>
            <p className="text-gray-500 text-xs">{sender.address}</p>
          </div>
          {client && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
              <p className="font-semibold text-gray-800">{client.name}</p>
              {client.company && <p className="text-gray-500 text-xs">{client.company}</p>}
              <p className="text-gray-500 text-xs">{client.email}</p>
              {client.phone && <p className="text-gray-500 text-xs">{client.phone}</p>}
              {client.address && <p className="text-gray-500 text-xs">{client.address}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="px-10 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Rate</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.filter(i => i.description).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2.5 text-gray-700">{item.description}</td>
                <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-600">{fmt(item.rate, currency)}</td>
                <td className="py-2.5 text-right font-semibold text-gray-800">{fmt(item.quantity * item.rate, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(subtotal, currency)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tax ({taxRate}%)</span>
                <span>{fmt(taxAmt, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-800">Total Due</span>
              <span className="font-black text-[#FF0A54] text-base">{fmt(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-gray-600 text-xs leading-relaxed">{notes}</p>
          </div>
        )}

        <div className="mt-6 pb-4 text-center text-xs text-gray-300 tracking-widest uppercase">
          Thank you for your business.
        </div>
      </div>
    </div>
  )
}

function NewInvoiceInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(addDays(14))
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0 },
  ])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendDialog, setSendDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [sender, setSender] = useState({ name: '', email: '', company: '', address: '' })

  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  // Load clients + profile on mount
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: clientsData }, { data: profile }] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (clientsData) setClients(clientsData)
      if (profile) {
        setSender({
          name: profile.full_name || user.email?.split('@')[0] || '',
          email: profile.business_email || user.email || '',
          company: profile.business_name || '',
          address: profile.business_address || '',
        })
        setLogoUrl(profile.logo_url || null)
      }

      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      const num = String((count || 0) + 1).padStart(3, '0')
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${num}`)

      // Handle AI param — auto-generate line items from description
      const aiText = searchParams.get('ai')
      if (aiText) {
        try {
          const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'invoice', input: aiText }),
          })
          const { output } = await res.json()
          if (output) {
            // Strip markdown code fences if model wraps JSON in ```json ... ```
            const clean = output.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
            const parsed = JSON.parse(clean)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLineItems(
                parsed.map((item: { description: string; quantity: number; rate: number }, idx: number) => ({
                  id: `ai-${idx}`,
                  description: item.description || '',
                  quantity: Number(item.quantity) || 1,
                  rate: Number(item.rate) || 0,
                }))
              )
              toast.success('AI generated your line items!')
            }
          }
        } catch (e) {
          console.error('AI parse error:', e)
          // Silently fail — user can fill manually
        }
      }
    }
    load()
  }, [])

  const addLineItem = () =>
    setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }])

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) setLineItems(prev => prev.filter(i => i.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0)
  const taxAmt = subtotal * (taxRate / 100)
  const total = subtotal + taxAmt

  const validateInvoice = () => {
    if (!selectedClientId) { toast.error('Please select a client'); return false }
    if (!invoiceNumber.trim()) { toast.error('Invoice number is required'); return false }
    if (!issueDate) { toast.error('Issue date is required'); return false }
    if (!dueDate) { toast.error('Due date is required'); return false }
    if (lineItems.every(i => !i.description)) { toast.error('Add at least one line item'); return false }
    return true
  }

  const saveInvoice = async (status: 'draft' | 'unpaid') => {
    if (!validateInvoice()) return null
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const validItems = lineItems.filter(i => i.description)

      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: selectedClientId || null,
          invoice_number: invoiceNumber,
          status,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmt,
          discount: 0,
          total,
          notes: notes || null,
          sender_name: sender.name,
          sender_email: sender.email,
          sender_company: sender.company,
          sender_address: sender.address,
          sender_logo_url: logoUrl,
        })
        .select()
        .single()

      if (invError) throw invError

      if (validItems.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          validItems.map(item => ({
            invoice_id: inv.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          }))
        )
        if (itemsError) throw itemsError
      }

      return inv
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save invoice'
      toast.error(msg)
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    const inv = await saveInvoice('draft')
    if (inv) {
      toast.success('Invoice saved as draft')
      router.push('/dashboard/invoices')
    }
  }

  const handleSendClick = () => {
    if (!validateInvoice()) return
    setEmailSubject(`Invoice ${invoiceNumber} – ${fmt(total, currency)}`)
    setEmailBody('')
    setSendDialog(true)
  }

  const generateAIEmail = async () => {
    if (!selectedClient) return
    setGeneratingEmail(true)
    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient.name,
          invoiceNumber,
          amount: fmt(total, currency),
          dueDate: formatDate(dueDate),
          senderName: sender.name,
          senderCompany: sender.company,
          type: 'invoice',
        }),
      })
      const data = await res.json()
      if (data.subject) setEmailSubject(data.subject)
      if (data.body) setEmailBody(data.body)
      toast.success('Email generated with AI')
    } catch {
      // Fallback template
      setEmailBody(`Dear ${selectedClient.name},

Please find your invoice ${invoiceNumber} for ${fmt(total, currency)} attached.

Payment is due by ${formatDate(dueDate)}. If you have any questions, please don't hesitate to reach out.

Thank you for your business!

Best regards,
${sender.name || sender.company}`)
      toast.success('Email template ready')
    } finally {
      setGeneratingEmail(false)
    }
  }

  const handleConfirmSend = async () => {
    const inv = await saveInvoice('unpaid')
    if (!inv) return

    // Attempt email send with full invoice data for rich HTML template
    try {
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          invoiceId: inv.id,
          to: selectedClient?.email,
          subject: emailSubject,
          body: emailBody,
          invoiceNumber,
          clientName: selectedClient?.name,
          clientEmail: selectedClient?.email,
          senderName: sender.name,
          senderCompany: sender.company,
          senderEmail: sender.email,
          senderAddress: sender.address,
          issueDate,
          dueDate,
          currency,
          subtotal,
          taxRate,
          taxAmount: taxAmt,
          discount: 0,
          total,
          items: lineItems.filter(i => i.description).map(i => ({
            description: i.description,
            quantity: i.quantity,
            rate: i.rate,
            amount: i.quantity * i.rate,
          })),
          notes,
        }),
      })
      const result = await res.json()
      if (result.note) {
        // No email configured — invoice still saved
        toast.success('Invoice saved! (Configure RESEND_API_KEY to send emails)')
      } else if (result.success) {
        toast.success('Invoice sent successfully!')
      } else {
        toast.success('Invoice saved! (Email may not have been delivered)')
      }
    } catch {
      toast.success('Invoice saved! (Email could not be sent)')
    }

    setSendDialog(false)
    router.push('/dashboard/invoices')
  }

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      const A4_WIDTH_PX = 794
      const SCALE = 2

      const formatD = (s: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

      const isDirectImage = (url: string) => {
        try {
          const u = new URL(url)
          return /\.(png|jpe?g|gif|webp|svg|ico)(\?|$)/i.test(u.pathname) ||
            ['supabase.co', 'githubusercontent.com', 'cloudinary.com', 'imgix.net', 'unsplash.com'].some(h => u.hostname.includes(h))
        } catch { return false }
      }

      // Pre-fetch logo as base64 so html2canvas never hits CORS
      let logoDataUrl: string | null = null
      if (logoUrl && isDirectImage(logoUrl)) {
        try {
          const res = await fetch(logoUrl)
          const blob = await res.blob()
          logoDataUrl = await new Promise<string>(r => {
            const fr = new FileReader()
            fr.onload = () => r(fr.result as string)
            fr.readAsDataURL(blob)
          })
        } catch { logoDataUrl = null }
      }
      const fmtAmt = (n: number) => {
        try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n) }
        catch { return `${currency || 'USD'} ${n.toFixed(2)}` }
      }
      const sub = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0)
      const tax = sub * (taxRate / 100)
      const tot = sub + tax
      const client = lineItems ? selectedClient : null

      const itemRows = lineItems.filter(i => i.description).map(i => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#374151;font-size:13px;">${i.description}</td>
          <td style="padding:8px 0;text-align:right;color:#6b7280;font-size:13px;">${i.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#6b7280;font-size:13px;">${fmtAmt(i.rate)}</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#1f2937;font-size:13px;">${fmtAmt(i.quantity * i.rate)}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:#fff;color:#111;}</style>
      </head><body>
        <div style="width:${A4_WIDTH_PX}px;background:#fff;padding:0;">
          <!-- Header -->
          <div style="padding:40px 40px 24px;background:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                ${logoDataUrl ? `<img src="${logoDataUrl}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin-bottom:12px;"/>` :
                  `<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;margin-bottom:12px;color:#9ca3af;font-size:11px;">Logo</div>`}
                <p style="font-weight:700;color:#111827;font-size:15px;">${sender.company || sender.name || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${sender.email || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${sender.address || ''}</p>
              </div>
              <div style="text-align:right;">
                <h1 style="font-size:28px;font-weight:900;color:#111827;letter-spacing:2px;margin-bottom:4px;">INVOICE</h1>
                <p style="color:#ff0a54;font-weight:700;font-size:15px;">${invoiceNumber}</p>
                <div style="margin-top:8px;display:inline-block;border:1px solid #fca5a5;border-radius:4px;padding:2px 8px;">
                  <span style="color:#ef4444;font-size:11px;font-weight:700;text-transform:uppercase;">UNPAID</span>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:24px;margin-top:20px;font-size:12px;color:#6b7280;">
              <div>
                <span style="font-weight:500;color:#374151;margin-right:12px;">Issue Date</span>
                <span>${formatD(issueDate)}</span>
              </div>
              ${dueDate ? `<div><span style="font-weight:500;color:#374151;margin-right:12px;">Due Date</span><span>${formatD(dueDate)}</span></div>` : ''}
            </div>
          </div>
          <!-- Bill From/To -->
          <div style="padding:16px 40px;border-top:1px solid #f3f4f6;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
              <div>
                <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Bill From</p>
                <p style="font-weight:600;color:#1f2937;font-size:13px;">${sender.company || sender.name || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${sender.email || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${sender.address || ''}</p>
              </div>
              ${client ? `<div>
                <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Bill To</p>
                <p style="font-weight:600;color:#1f2937;font-size:13px;">${client.name}</p>
                ${client.company ? `<p style="color:#6b7280;font-size:12px;">${client.company}</p>` : ''}
                <p style="color:#6b7280;font-size:12px;">${client.email}</p>
                ${client.phone ? `<p style="color:#6b7280;font-size:12px;">${client.phone}</p>` : ''}
                ${client.address ? `<p style="color:#6b7280;font-size:12px;">${client.address}</p>` : ''}
              </div>` : ''}
            </div>
          </div>
          <!-- Line Items -->
          <div style="padding:16px 40px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                  <th style="text-align:left;padding:8px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Description</th>
                  <th style="text-align:right;padding:8px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:64px;">Qty</th>
                  <th style="text-align:right;padding:8px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:96px;">Rate</th>
                  <th style="text-align:right;padding:8px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:96px;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <!-- Totals -->
            <div style="display:flex;justify-content:flex-end;margin-top:16px;">
              <div style="width:224px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:6px;">
                  <span>Subtotal</span><span>${fmtAmt(sub)}</span>
                </div>
                ${taxRate > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:6px;">
                  <span>Tax (${taxRate}%)</span><span>${fmtAmt(tax)}</span>
                </div>` : ''}
                <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb;">
                  <span style="font-weight:700;color:#1f2937;font-size:13px;">Total Due</span>
                  <span style="font-weight:900;color:#ff0a54;font-size:15px;">${fmtAmt(tot)}</span>
                </div>
              </div>
            </div>
            ${notes ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
              <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Notes</p>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;">${notes}</p>
            </div>` : ''}
            <div style="margin-top:24px;padding-bottom:16px;text-align:center;font-size:11px;color:#d1d5db;letter-spacing:3px;text-transform:uppercase;">
              Thank you for your business.
            </div>
          </div>
        </div>
      </body></html>`

      // Render inside a hidden iframe so app's Tailwind CSS (which uses lab() etc.) never leaks in
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1px;border:none;visibility:hidden;'
      document.body.appendChild(iframe)

      await new Promise<void>(resolve => {
        iframe.onload = () => resolve()
        iframe.srcdoc = html
      })

      const iframeDoc = iframe.contentDocument!
      const root = iframeDoc.body.firstElementChild as HTMLElement
      root.style.width = `${A4_WIDTH_PX}px`

      // Give images a moment to load
      await new Promise(r => setTimeout(r, 200))

      const canvas = await html2canvas(root, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: A4_WIDTH_PX,
        width: A4_WIDTH_PX,
      })

      document.body.removeChild(iframe)

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = pageW / (canvas.width / SCALE)
      const renderedH = (canvas.height / SCALE) * ratio

      if (renderedH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, renderedH)
      } else {
        const pageHeightPx = Math.floor(pageH / ratio)
        let yOffset = 0
        let page = 0
        while (yOffset < canvas.height / SCALE) {
          if (page > 0) pdf.addPage()
          const sliceH = Math.min(pageHeightPx, canvas.height / SCALE - yOffset)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sliceH * SCALE
          const ctx = sliceCanvas.getContext('2d')!
          ctx.drawImage(canvas, 0, yOffset * SCALE, canvas.width, sliceH * SCALE, 0, 0, canvas.width, sliceH * SCALE)
          pdf.addImage(sliceCanvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pageW, sliceH * ratio)
          yOffset += pageHeightPx
          page++
        }
      }

      pdf.save(`${invoiceNumber || 'invoice'}.pdf`)
      toast.success('PDF downloaded!')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Failed to generate PDF — please try again')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <RiArrowLeftLine className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">New Invoice</h1>
            <p className="text-white/40 text-sm">Fill in the details — preview updates live</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5"
          >
            {downloadingPdf ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiDownloadLine className="w-4 h-4" />}
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_480px] gap-6">
        {/* ─── Left: Form ─── */}
        <div className="space-y-5">
          {/* Invoice Details */}
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <RiUserLine className="w-4 h-4 text-[#FF0A54]" />
              <h2 className="font-semibold text-white">Invoice Details</h2>
            </div>

            {/* Logo upload */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden">
                {logoUrl
                  ? <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" />
                  : <RiImageLine className="w-6 h-6 text-white/20" />}
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Business Logo</p>
                <p className="text-white/30 text-xs">Set in Settings → Company</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-number" className="text-white/50 text-xs uppercase tracking-wider">Invoice Number *</Label>
                <Input
                  id="invoice-number"
                  name="invoice_number"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-001"
                  className="mt-1.5 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0"
                />
              </div>
              <div>
                <Label htmlFor="invoice-currency" className="text-white/50 text-xs uppercase tracking-wider">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="invoice-currency" className="mt-1.5 bg-[#111] border-white/10 text-white focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c} className="text-white/70 focus:bg-[#FF0A54]/10 focus:text-white">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="invoice-issue-date" className="text-white/50 text-xs uppercase tracking-wider">Issue Date *</Label>
                <Input
                  id="invoice-issue-date"
                  name="issue_date"
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="mt-1.5 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0 [color-scheme:dark]"
                />
              </div>
              <div>
                <Label htmlFor="invoice-due-date" className="text-white/50 text-xs uppercase tracking-wider">Due Date</Label>
                <Input
                  id="invoice-due-date"
                  name="due_date"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="mt-1.5 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Sender & Client */}
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-5">Sender &amp; Recipient</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Sender */}
              <div className="space-y-3">
                <p className="text-white/30 text-xs uppercase tracking-wider">From (Sender)</p>
                <div>
                  <Label htmlFor="sender-name" className="text-white/50 text-xs">Name</Label>
                  <Input id="sender-name" name="sender_name" value={sender.name} onChange={e => setSender(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0" />
                </div>
                <div>
                  <Label htmlFor="sender-email" className="text-white/50 text-xs">Email</Label>
                  <Input id="sender-email" name="sender_email" type="email" value={sender.email} onChange={e => setSender(p => ({ ...p, email: e.target.value }))} className="mt-1 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0" />
                </div>
                <div>
                  <Label htmlFor="sender-company" className="text-white/50 text-xs">Company</Label>
                  <Input id="sender-company" name="sender_company" value={sender.company} onChange={e => setSender(p => ({ ...p, company: e.target.value }))} className="mt-1 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0" />
                </div>
                <div>
                  <Label htmlFor="sender-address" className="text-white/50 text-xs">Address</Label>
                  <Input id="sender-address" name="sender_address" value={sender.address} onChange={e => setSender(p => ({ ...p, address: e.target.value }))} className="mt-1 bg-[#111] border-white/10 text-white focus:border-[#FF0A54]/50 focus-visible:ring-0" />
                </div>
              </div>

              {/* Client */}
              <div className="space-y-3">
                <p className="text-white/30 text-xs uppercase tracking-wider">To (Recipient)</p>
                <div>
                  <Label htmlFor="invoice-client" className="text-white/50 text-xs">Client *</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger id="invoice-client" className="mt-1 bg-[#111] border-white/10 text-white focus:ring-0">
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10">
                      {clients.length === 0 ? (
                        <SelectItem value="_none" disabled className="text-white/30">No clients yet — add one first</SelectItem>
                      ) : clients.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-white/70 focus:bg-[#FF0A54]/10 focus:text-white">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClient && (
                  <div className="p-3 bg-[#FF0A54]/8 border border-[#FF0A54]/15 rounded-lg space-y-1.5">
                    <p className="text-white font-medium text-sm">{selectedClient.name}</p>
                    {selectedClient.company && <p className="text-white/50 text-xs">{selectedClient.company}</p>}
                    <p className="text-white/50 text-xs">{selectedClient.email}</p>
                    {selectedClient.phone && <p className="text-white/50 text-xs">{selectedClient.phone}</p>}
                    {selectedClient.address && <p className="text-white/50 text-xs">{selectedClient.address}</p>}
                  </div>
                )}
                {clients.length === 0 && (
                  <Link href="/dashboard/clients" className="block text-[#FF0A54] text-xs hover:underline">
                    + Add your first client
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Line Items</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="gap-1.5 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-[#FF0A54]/30"
              >
                <RiAddLine className="w-4 h-4" /> Add Item
              </Button>
            </div>
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-white/30 uppercase tracking-wider px-1">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            <div className="space-y-2">
              {lineItems.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
                  <div className="col-span-6">
                    <Input
                      placeholder="Item description..."
                      value={item.description}
                      onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      className="bg-[#111] border-white/8 text-white placeholder:text-white/20 focus:border-[#FF0A54]/40 focus-visible:ring-0 h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="bg-[#111] border-white/8 text-white text-center focus:border-[#FF0A54]/40 focus-visible:ring-0 h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="bg-[#111] border-white/8 text-white placeholder:text-white/20 focus:border-[#FF0A54]/40 focus-visible:ring-0 h-9"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between pl-2">
                    <span className="text-white/50 text-sm font-mono">
                      {fmt(item.quantity * item.rate, currency)}
                    </span>
                    <button
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-30 ml-1"
                    >
                      <RiCloseLine className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tax */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label htmlFor="invoice-tax-rate" className="text-white/50 text-xs">Tax Rate (%)</Label>
                <Input
                  id="invoice-tax-rate"
                  name="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate || ''}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-[#111] border-white/8 text-white text-center focus:border-[#FF0A54]/40 focus-visible:ring-0 h-8"
                />
              </div>
              <div className="text-right space-y-1">
                <div className="text-white/40 text-xs">Subtotal: {fmt(subtotal, currency)}</div>
                {taxRate > 0 && <div className="text-white/40 text-xs">Tax: {fmt(taxAmt, currency)}</div>}
                <div className="text-[#FF0A54] font-bold">Total: {fmt(total, currency)}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Notes</h2>
            <Textarea
              id="invoice-notes"
              name="notes"
              placeholder="Payment terms, special notes, or instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-[#111] border-white/8 text-white placeholder:text-white/20 focus:border-[#FF0A54]/40 focus-visible:ring-0 resize-none min-h-20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleSendClick()}
              disabled={saving}
              className="flex-1 gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm font-medium"
            >
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSendPlaneLine className="w-4 h-4" />}
              Send Invoice
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            >
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSaveLine className="w-4 h-4" />}
              Save Draft
            </Button>
          </div>
        </div>

        {/* ─── Right: Live PDF Preview ─── */}
        <div className="space-y-3">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white/50 text-xs font-medium uppercase tracking-widest">Live Preview</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="gap-1.5 text-white/40 hover:text-white hover:bg-white/5 text-xs"
              >
                {downloadingPdf ? <RiLoaderLine className="w-3 h-3 animate-spin" /> : <RiDownloadLine className="w-3 h-3" />}
                PDF
              </Button>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-10rem)]" style={{ scrollbarWidth: 'none' }}>
              <InvoicePDFPreview
                invoiceNumber={invoiceNumber}
                issueDate={issueDate}
                dueDate={dueDate}
                currency={currency}
                taxRate={taxRate}
                notes={notes}
                lineItems={lineItems}
                client={selectedClient}
                sender={sender}
                logoUrl={logoUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="bg-[#0a0a0a] border-[#FF0A54]/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl text-white">
              <RiMailLine className="w-5 h-5 text-[#FF0A54]" />
              Send Invoice
            </DialogTitle>
            <DialogDescription className="sr-only">
              Compose and send the invoice email to your client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {selectedClient && (
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/8">
                <div>
                  <p className="text-white/40 text-xs">Sending to</p>
                  <p className="text-white font-medium">{selectedClient.name}</p>
                  <p className="text-white/50 text-sm">{selectedClient.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">Amount</p>
                  <p className="text-[#FF0A54] font-bold text-lg">{fmt(total, currency)}</p>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={generateAIEmail}
              disabled={generatingEmail}
              className="w-full gap-2 bg-transparent border-[#FF0A54]/25 text-[#FF0A54] hover:bg-[#FF0A54]/10"
            >
              {generatingEmail
                ? <><RiLoaderLine className="w-4 h-4 animate-spin" />Generating...</>
                : <><RiSparkling2Line className="w-4 h-4" />Generate Email with AI</>}
            </Button>

            <div>
              <Label htmlFor="send-email-subject" className="text-white/50 text-xs">Subject</Label>
              <Input
                id="send-email-subject"
                name="email_subject"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0"
              />
            </div>
            <div>
              <Label htmlFor="send-email-body" className="text-white/50 text-xs">Message</Label>
              <Textarea
                id="send-email-body"
                name="email_body"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                placeholder="Email body..."
                className="mt-1.5 min-h-36 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendDialog(false)} className="text-white/50 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={saving || !emailSubject}
              className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white"
            >
              {saving
                ? <><RiLoaderLine className="w-4 h-4 animate-spin" />Sending...</>
                : <><RiSendPlaneLine className="w-4 h-4" />Send Invoice</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function NewInvoice() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF0A54] border-t-transparent animate-spin" />
          <p className="text-white/40 text-sm">Loading invoice editor...</p>
        </div>
      </div>
    }>
      <NewInvoiceInner />
    </Suspense>
  )
}
