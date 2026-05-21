'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  RiArrowLeftLine,
  RiDownloadLine,
  RiSendPlaneLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiLoaderLine,
  RiMailLine,
  RiSparkling2Line,
  RiFileCopyLine,
  RiPencilLine,
  RiBellLine,
  RiMoreLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { createClient as createSupabase } from '@/lib/supabase/client'
import type { Invoice, Client, InvoiceStatus } from '@/lib/database.types'

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

type FullInvoice = Invoice & { clients?: Client; invoice_items?: LineItem[] }

const fmt = (v: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v)
const fmtDate = (s: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

const STATUS_STYLES: Record<string, string> = {
  draft: 'border border-gray-300 text-gray-500',
  unpaid: 'border border-red-300 text-red-500',
  paid: 'border border-green-300 text-green-600',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabase()

  const [invoice, setInvoice] = useState<FullInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendDialog, setSendDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*), invoice_items(*)')
        .eq('id', params.id as string)
        .single()
      if (!error && data) setInvoice(data as FullInvoice)
      setLoading(false)

      // Auto-download if ?download=true
      if (searchParams.get('download') === 'true') {
        setTimeout(() => handleDownload(data as FullInvoice), 500)
      }
    }
    load()
  }, [params.id])

  const updateStatus = async (status: InvoiceStatus) => {
    if (!invoice) return
    setActioning(true)
    const { error } = await supabase.from('invoices').update({
      status,
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    }).eq('id', invoice.id)
    if (error) { toast.error('Failed to update'); setActioning(false); return }
    setInvoice(prev => prev ? { ...prev, status } : prev)
    toast.success(`Marked as ${status}`)
    setActioning(false)
  }

  const handleDownload = async (inv?: FullInvoice) => {
    const target = inv || invoice
    if (!target) return
    setDownloadingPdf(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      const A4_WIDTH_PX = 794
      const SCALE = 2

      const fmtD = (s: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
      const isDirectImage = (url: string) => {
        try {
          const u = new URL(url)
          return /\.(png|jpe?g|gif|webp|svg|ico)(\?|$)/i.test(u.pathname) ||
            ['supabase.co', 'githubusercontent.com', 'cloudinary.com', 'imgix.net', 'unsplash.com'].some(h => u.hostname.includes(h))
        } catch { return false }
      }

      // Pre-fetch logo as base64 so html2canvas never hits CORS
      let logoDataUrl: string | null = null
      if (target.sender_logo_url && isDirectImage(target.sender_logo_url)) {
        try {
          const res = await fetch(target.sender_logo_url)
          const blob = await res.blob()
          logoDataUrl = await new Promise<string>(r => {
            const fr = new FileReader()
            fr.onload = () => r(fr.result as string)
            fr.readAsDataURL(blob)
          })
        } catch { logoDataUrl = null }
      }
      const fmtA = (n: number) => {
        try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: target.currency || 'USD' }).format(n) }
        catch { return `${target.currency || 'USD'} ${n.toFixed(2)}` }
      }

      const statusColors: Record<string, string> = {
        paid: 'border:1px solid #6ee7b7;color:#10b981;',
        unpaid: 'border:1px solid #fca5a5;color:#ef4444;',
        draft: 'border:1px solid #d1d5db;color:#6b7280;',
      }
      const statusColor = statusColors[target.status] || statusColors.unpaid

      const items = target.invoice_items || []
      const client = target.clients

      const itemRows = items.map(i => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#374151;font-size:13px;">${i.description}</td>
          <td style="padding:8px 0;text-align:right;color:#6b7280;font-size:13px;">${i.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#6b7280;font-size:13px;">${fmtA(i.rate)}</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#1f2937;font-size:13px;">${fmtA(i.amount)}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:#fff;color:#111;}</style>
      </head><body>
        <div style="width:${A4_WIDTH_PX}px;background:#fff;padding:0;">
          <div style="padding:48px 48px 32px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                ${logoDataUrl
                  ? `<img src="${logoDataUrl}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin-bottom:12px;"/>`
                  : `<div style="width:56px;height:56px;border-radius:50%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;margin-bottom:12px;color:#d1d5db;font-size:11px;">Logo</div>`}
                <p style="font-weight:700;color:#111827;font-size:15px;">${target.sender_company || target.sender_name || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${target.sender_email || ''}</p>
                <p style="color:#6b7280;font-size:12px;">${target.sender_address || ''}</p>
              </div>
              <div style="text-align:right;">
                <h1 style="font-size:32px;font-weight:900;color:#111827;letter-spacing:3px;margin-bottom:8px;">INVOICE</h1>
                <p style="color:#ff0a54;font-weight:700;font-size:16px;">${target.invoice_number}</p>
                <div style="margin-top:8px;display:inline-block;border-radius:4px;padding:2px 10px;${statusColor}">
                  <span style="font-size:11px;font-weight:700;text-transform:uppercase;">${target.status}</span>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:32px;margin-top:24px;font-size:12px;color:#6b7280;">
              <div style="display:flex;gap:12px;">
                <span style="font-weight:500;color:#374151;width:80px;">Issue Date</span>
                <span>${fmtD(target.issue_date)}</span>
              </div>
              ${target.due_date ? `<div style="display:flex;gap:12px;">
                <span style="font-weight:500;color:#374151;width:80px;">Due Date</span>
                <span>${fmtD(target.due_date)}</span>
              </div>` : ''}
            </div>
          </div>

          <div style="padding:24px 48px;border-top:1px solid #f3f4f6;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;">
              <div>
                <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Bill From</p>
                <p style="font-weight:600;color:#1f2937;font-size:13px;">${target.sender_company || target.sender_name || ''}</p>
                <p style="color:#6b7280;font-size:12px;margin-top:2px;">${target.sender_email || ''}</p>
                ${target.sender_address ? `<p style="color:#6b7280;font-size:12px;">${target.sender_address}</p>` : ''}
              </div>
              ${client ? `<div>
                <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Bill To</p>
                <p style="font-weight:600;color:#1f2937;font-size:13px;">${client.name}</p>
                ${client.company ? `<p style="color:#6b7280;font-size:12px;">${client.company}</p>` : ''}
                <p style="color:#6b7280;font-size:12px;margin-top:2px;">${client.email}</p>
                ${client.phone ? `<p style="color:#6b7280;font-size:12px;">${client.phone}</p>` : ''}
                ${client.address ? `<p style="color:#6b7280;font-size:12px;">${client.address}</p>` : ''}
              </div>` : ''}
            </div>
          </div>

          <div style="padding:0 48px 32px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                  <th style="text-align:left;padding:12px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Description</th>
                  <th style="text-align:right;padding:12px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:64px;">Qty</th>
                  <th style="text-align:right;padding:12px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:112px;">Rate</th>
                  <th style="text-align:right;padding:12px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;width:112px;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div style="display:flex;justify-content:flex-end;margin-top:24px;">
              <div style="width:240px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:8px;">
                  <span>Subtotal</span><span>${fmtA(target.subtotal)}</span>
                </div>
                ${target.tax_rate > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:8px;">
                  <span>Tax (${target.tax_rate}%)</span><span>${fmtA(target.tax_amount)}</span>
                </div>` : ''}
                ${target.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:8px;">
                  <span>Discount</span><span>-${fmtA(target.discount)}</span>
                </div>` : ''}
                <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #e5e7eb;">
                  <span style="font-weight:700;color:#1f2937;font-size:14px;">Total Due</span>
                  <span style="font-weight:900;color:#ff0a54;font-size:16px;">${fmtA(target.total)}</span>
                </div>
              </div>
            </div>

            ${target.notes ? `<div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;">
              <p style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Notes</p>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;">${target.notes}</p>
            </div>` : ''}

            <div style="margin-top:32px;text-align:center;font-size:11px;color:#d1d5db;letter-spacing:3px;text-transform:uppercase;">
              Thank you for your business.
            </div>
          </div>
        </div>
      </body></html>`

      // Use a hidden iframe so app's Tailwind CSS (which uses lab() etc.) never leaks into html2canvas
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

      await new Promise(r => setTimeout(r, 200))

      const canvas = await html2canvas(root, {
        scale: SCALE, useCORS: true, backgroundColor: '#ffffff',
        logging: false, windowWidth: A4_WIDTH_PX, width: A4_WIDTH_PX,
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
        let yOffset = 0, page = 0
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

      pdf.save(`${target.invoice_number}.pdf`)
      toast.success('PDF downloaded!')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const generateAIEmail = async () => {
    if (!invoice) return
    setGeneratingEmail(true)
    const isReminder = invoice.status === 'unpaid'
    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: invoice.clients?.name,
          invoiceNumber: invoice.invoice_number,
          amount: fmt(invoice.total, invoice.currency),
          dueDate: fmtDate(invoice.due_date),
          senderName: invoice.sender_name,
          senderCompany: invoice.sender_company,
          type: isReminder ? 'reminder' : 'invoice',
        }),
      })
      const data = await res.json()
      if (data.subject) setEmailSubject(data.subject)
      if (data.body) setEmailBody(data.body)
      toast.success('Email generated with AI')
    } catch {
      const name = invoice.clients?.name || 'Client'
      const num = invoice.invoice_number
      const amount = fmt(invoice.total, invoice.currency)
      const due = fmtDate(invoice.due_date)
      const from = invoice.sender_company || invoice.sender_name || 'Invoice AI'
      setEmailSubject(
        isReminder
          ? `Payment Reminder: ${num} – ${amount} Overdue`
          : `Invoice ${num} from ${invoice.sender_company || invoice.sender_name} – ${amount} Due`
      )
      setEmailBody(
        isReminder
          ? `Dear ${name},\n\nI hope this message finds you well. I'm writing to follow up on invoice ${num} for ${amount}, which was due on ${due}.\n\nCould you please let us know when we can expect payment?\n\nThank you,\n${from}`
          : `Dear ${name},\n\nPlease find your invoice ${num} for ${amount} detailed below.\n\nPayment is due by ${due}. If you have any questions, please do not hesitate to reach out.\n\nThank you for your business!\n\nBest regards,\n${from}`
      )
      toast.success('Email template ready')
    } finally {
      setGeneratingEmail(false)
    }
  }

  const handleSend = async () => {
    if (!invoice) return
    setActioning(true)
    try {
      const items = invoice.invoice_items || []
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: invoice.status === 'unpaid' ? 'reminder' : 'invoice',
          invoiceId: invoice.id,
          to: invoice.clients?.email,
          subject: emailSubject,
          body: emailBody,
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients?.name,
          clientEmail: invoice.clients?.email,
          senderName: invoice.sender_name,
          senderCompany: invoice.sender_company,
          senderEmail: invoice.sender_email,
          senderAddress: invoice.sender_address,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          taxRate: invoice.tax_rate,
          taxAmount: invoice.tax_amount,
          discount: invoice.discount,
          total: invoice.total,
          items: items.map((i: LineItem) => ({
            description: i.description,
            quantity: i.quantity,
            rate: i.rate,
            amount: i.amount,
          })),
          notes: invoice.notes,
        }),
      })
      const result = await res.json()
      if (invoice.status === 'draft') await updateStatus('unpaid')
      if (result.note) {
        toast.success('Invoice saved! Configure RESEND_API_KEY to send emails.')
      } else {
        toast.success('Invoice sent!')
      }
      setSendDialog(false)
    } catch {
      toast.error('Send failed — download the PDF and send manually')
    } finally {
      setActioning(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Invoice deleted')
    router.push('/dashboard/invoices')
  }

  const handleDuplicate = async () => {
    if (!invoice) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const num = String((count || 0) + 1).padStart(3, '0')
    const { data: newInv, error } = await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: invoice.client_id,
      invoice_number: `INV-${new Date().getFullYear()}-${num}`,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: invoice.due_date,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      discount: invoice.discount,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      sender_name: invoice.sender_name,
      sender_email: invoice.sender_email,
      sender_company: invoice.sender_company,
      sender_address: invoice.sender_address,
      sender_logo_url: invoice.sender_logo_url,
    }).select().single()
    if (error) { toast.error('Failed to duplicate'); return }
    // Also duplicate line items
    const items = invoice.invoice_items || []
    if (items.length > 0 && newInv) {
      await supabase.from('invoice_items').insert(
        items.map((item: LineItem) => ({
          invoice_id: newInv.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }))
      )
    }
    toast.success('Duplicated as draft')
    router.push('/dashboard/invoices')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RiLoaderLine className="w-6 h-6 text-[#FF0A54] animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-24">
        <p className="text-white/50 mb-4">Invoice not found</p>
        <Link href="/dashboard/invoices"><Button>Back to Invoices</Button></Link>
      </div>
    )
  }

  const items = invoice.invoice_items || []

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <RiArrowLeftLine className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">{invoice.invoice_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                invoice.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' :
                invoice.status === 'unpaid' ? 'bg-red-500/15 text-red-400' :
                'bg-white/8 text-white/50'
              }`}>{invoice.status}</span>
              {invoice.clients && <span className="text-white/40 text-sm">· {invoice.clients.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'unpaid' && (
            <Button
              variant="outline"
              onClick={() => updateStatus('paid')}
              disabled={actioning}
              className="gap-2 bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <RiCheckLine className="w-4 h-4" /> Mark Paid
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleDownload()}
            disabled={downloadingPdf}
            className="gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5"
          >
            {downloadingPdf ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiDownloadLine className="w-4 h-4" />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            onClick={() => { setEmailSubject(`Invoice ${invoice.invoice_number}`); setEmailBody(''); setSendDialog(true) }}
            className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm"
          >
            <RiSendPlaneLine className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
          <DropdownMenuMore
            onDuplicate={handleDuplicate}
            onDelete={() => setDeleteDialog(true)}
            onMarkPaid={invoice.status === 'unpaid' ? () => updateStatus('paid') : undefined}
          />
        </div>
      </div>

      {/* PDF Preview */}
      <div
        id="invoice-pdf"
        className="bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px' }}
      >
        {/* Header */}
        <div className="px-12 pt-12 pb-8">
          <div className="flex justify-between items-start">
            <div>
              {invoice.sender_logo_url ? (
                <img src={invoice.sender_logo_url} alt="Logo" className="w-14 h-14 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <span className="text-gray-300 text-xs">Logo</span>
                </div>
              )}
              <p className="font-bold text-gray-900 text-base">{invoice.sender_company || invoice.sender_name}</p>
              <p className="text-gray-500 text-xs">{invoice.sender_email}</p>
              <p className="text-gray-500 text-xs">{invoice.sender_address}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black text-gray-900 tracking-widest mb-2">INVOICE</h1>
              <p className="text-[#FF0A54] font-bold text-lg">{invoice.invoice_number}</p>
              <div className={`mt-2 inline-block rounded px-2.5 py-0.5 ${STATUS_STYLES[invoice.status]}`}>
                <span className="text-xs font-semibold uppercase">{invoice.status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-8 mt-6 text-xs text-gray-500">
            <div className="flex gap-3">
              <span className="font-medium text-gray-700 w-20">Issue Date</span>
              <span>{fmtDate(invoice.issue_date)}</span>
            </div>
            <div className="flex gap-3">
              <span className="font-medium text-gray-700 w-20">Due Date</span>
              <span>{fmtDate(invoice.due_date)}</span>
            </div>
          </div>
        </div>

        {/* Bill From / To */}
        <div className="px-12 py-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill From</p>
              <p className="font-semibold text-gray-800">{invoice.sender_company || invoice.sender_name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{invoice.sender_email}</p>
              {invoice.sender_address && <p className="text-gray-500 text-xs">{invoice.sender_address}</p>}
            </div>
            {invoice.clients && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill To</p>
                <p className="font-semibold text-gray-800">{invoice.clients.name}</p>
                {invoice.clients.company && <p className="text-gray-500 text-xs">{invoice.clients.company}</p>}
                <p className="text-gray-500 text-xs">{invoice.clients.email}</p>
                {invoice.clients.phone && <p className="text-gray-500 text-xs">{invoice.clients.phone}</p>}
                {invoice.clients.address && <p className="text-gray-500 text-xs">{invoice.clients.address}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="px-12 pb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Rate</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">{item.description}</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{fmt(item.rate, invoice.currency)}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">{fmt(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-60 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>{fmt(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tax ({invoice.tax_rate}%)</span><span>{fmt(invoice.tax_amount, invoice.currency)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Discount</span><span>-{fmt(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-800 text-base">Total Due</span>
                <span className="font-black text-[#FF0A54] text-lg">{fmt(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-gray-600 text-xs leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-300 tracking-widest uppercase">
            Thank you for your business.
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="bg-[#0a0a0a] border-[#FF0A54]/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl text-white">
              <RiMailLine className="w-5 h-5 text-[#FF0A54]" /> Send Invoice
            </DialogTitle>
            <DialogDescription className="sr-only">
              Compose and send the invoice email to your client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {invoice.clients && (
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/8">
                <div>
                  <p className="text-white/40 text-xs">Sending to</p>
                  <p className="text-white font-medium">{invoice.clients.name}</p>
                  <p className="text-white/50 text-sm">{invoice.clients.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">Amount</p>
                  <p className="text-[#FF0A54] font-bold text-lg">{fmt(invoice.total, invoice.currency)}</p>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={generateAIEmail} disabled={generatingEmail} className="w-full gap-2 bg-transparent border-[#FF0A54]/25 text-[#FF0A54] hover:bg-[#FF0A54]/10">
              {generatingEmail ? <><RiLoaderLine className="w-4 h-4 animate-spin" />Generating...</> : <><RiSparkling2Line className="w-4 h-4" />Generate Email with AI</>}
            </Button>
            <div>
              <Label htmlFor="send-email-subject" className="text-white/50 text-xs">Subject</Label>
              <Input id="send-email-subject" name="email_subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="mt-1.5 bg-[#111] border-white/10 text-white focus-visible:ring-0" />
            </div>
            <div>
              <Label htmlFor="send-email-body" className="text-white/50 text-xs">Message</Label>
              <Textarea id="send-email-body" name="email_body" value={emailBody} onChange={e => setEmailBody(e.target.value)} className="mt-1.5 min-h-36 bg-[#111] border-white/10 text-white focus-visible:ring-0 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendDialog(false)} className="text-white/50 hover:text-white">Cancel</Button>
            <Button onClick={handleSend} disabled={actioning || !emailSubject} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white">
              {actioning ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSendPlaneLine className="w-4 h-4" />}
              Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-[#0a0a0a] border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">This will permanently delete {invoice.invoice_number}. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Small helper component for the "more" dropdown
function DropdownMenuMore({
  onDuplicate, onDelete, onMarkPaid,
}: {
  onDuplicate: () => void
  onDelete: () => void
  onMarkPaid?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5">
          <RiMoreLine className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10">
        {onMarkPaid && (
          <DropdownMenuItem onClick={onMarkPaid} className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 gap-2 cursor-pointer">
            <RiCheckLine className="w-4 h-4" /> Mark as Paid
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDuplicate} className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
          <RiFileCopyLine className="w-4 h-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/8" />
        <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2 cursor-pointer">
          <RiDeleteBinLine className="w-4 h-4" /> Delete Invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
