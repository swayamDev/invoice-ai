'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  RiMoneyDollarCircleLine,
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiArrowRightLine,
  RiRobot2Line,
  RiSparkling2Line,
  RiMailLine,
  RiMoreLine,
  RiPencilLine,
  RiSendPlaneLine,
  RiBellLine,
  RiCheckLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiAddLine,
  RiLoaderLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateWithAIDialog } from '@/components/create-with-ai-dialog'
import { createClient } from '@/lib/supabase/client'
import type { Invoice, Client, InvoiceStatus } from '@/lib/database.types'

type InvoiceWithClient = Invoice & { clients?: Client }

const fmt = (v: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v)
const fmtDate = (s: string) =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
const COLORS = ['bg-purple-500','bg-orange-500','bg-teal-500','bg-indigo-500','bg-pink-500','bg-emerald-500']
const getColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length]

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<string, string> = {
    draft: 'bg-white/8 text-white/50',
    unpaid: 'bg-red-500/12 text-red-400',
    paid: 'bg-emerald-500/12 text-emerald-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white/50 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className={`text-sm ${p.dataKey === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
          {p.dataKey === 'paid' ? 'Paid' : 'Unpaid'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: invData }, { data: profile }] = await Promise.all([
        supabase.from('invoices').select('*, clients(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('full_name, business_name').eq('id', user.id).single(),
      ])

      if (invData) setInvoices(invData as InvoiceWithClient[])
      if (profile) setUserName(profile.full_name || profile.business_name || user.email?.split('@')[0] || '')
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
    if (!error) setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (!error) setInvoices(prev => prev.filter(i => i.id !== id))
  }

  // Stats
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalInvoices = invoices.length
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const unpaidAmount = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total, 0)

  // Build last 6 months chart data
  const chartData = (() => {
    const months: Record<string, { date: string; paid: number; unpaid: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString('en-US', { month: 'short' })
      months[key] = { date: key, paid: 0, unpaid: 0 }
    }
    invoices.forEach(inv => {
      const key = new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short' })
      if (months[key]) {
        if (inv.status === 'paid') months[key].paid += inv.total
        else if (inv.status === 'unpaid') months[key].unpaid += inv.total
      }
    })
    return Object.values(months)
  })()

  const hasChartData = chartData.some(d => d.paid > 0 || d.unpaid > 0)
  const recent = invoices.slice(0, 5)

  const stats = [
    { label: 'Total Revenue', value: fmt(totalRevenue), icon: RiMoneyDollarCircleLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Invoices', value: String(totalInvoices), icon: RiFileTextLine, color: 'text-[#FF0A54]', bg: 'bg-[#FF0A54]/10' },
    { label: 'Paid', value: String(paidCount), icon: RiCheckboxCircleLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding', value: fmt(unpaidAmount), icon: RiErrorWarningLine, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RiLoaderLine className="w-6 h-6 text-[#FF0A54] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/40 text-xs mb-2">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart + AI Card */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-base font-semibold text-white">Revenue Overview</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500 rounded-full" /><span className="text-white/40">Paid</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 rounded-full" /><span className="text-white/40">Unpaid</span></div>
            </div>
          </div>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} />
                <Line type="monotone" dataKey="unpaid" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <RiFileTextLine className="w-7 h-7 text-white/15" />
              </div>
              <p className="text-white/40 text-sm">No data yet</p>
              <p className="text-white/25 text-xs mt-1">Create invoices to see your revenue trend</p>
            </div>
          )}
        </div>

        {/* AI Card */}
        <div className="bg-gradient-to-br from-[#FF0A54]/15 via-[#FF0A54]/8 to-transparent rounded-xl p-6 border border-[#FF0A54]/20 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-[#FF0A54]/15 flex items-center justify-center mb-4">
            <RiRobot2Line className="w-5 h-5 text-[#FF0A54]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white mb-1">AI-Powered</h3>
          <p className="text-white/40 text-xs mb-5 flex-1">Create professional invoices from plain text in seconds.</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-white/60 text-sm">
              <RiSparkling2Line className="w-4 h-4 text-[#FF0A54] flex-shrink-0" /> Generate from description
            </li>
            <li className="flex items-center gap-2 text-white/60 text-sm">
              <RiMailLine className="w-4 h-4 text-[#FF0A54] flex-shrink-0" /> AI email drafts
            </li>
          </ul>
          <Button onClick={() => setShowAI(true)} className="w-full bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white font-medium cherry-glow-sm">
            Try It Now
          </Button>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-[#0a0a0a] border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
          <h3 className="font-serif text-base font-semibold text-white">Recent Invoices</h3>
          <Link href="/dashboard/invoices" className="text-[#FF0A54] text-sm hover:underline flex items-center gap-1">
            View all <RiArrowRightLine className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <RiFileTextLine className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/40 text-sm mb-4">No invoices yet</p>
            <Link href="/dashboard/invoices/new">
              <Button className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white text-sm">
                <RiAddLine className="w-4 h-4" /> Create your first invoice
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Invoice', 'Client', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                    <th key={i} className={`text-left py-3 px-4 sm:px-5 text-xs text-white/30 uppercase tracking-wider font-medium ${i === 2 ? 'hidden sm:table-cell' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-xs text-white/70 hover:text-[#FF0A54] transition-colors">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className={`${getColor(inv.clients?.name)} text-white text-xs font-bold`}>
                            {getInitials(inv.clients?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/70 text-sm truncate max-w-24">{inv.clients?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-white/40 text-sm hidden sm:table-cell">{fmtDate(inv.issue_date)}</td>
                    <td className="py-3.5 px-4 sm:px-5 text-white text-sm font-medium">{fmt(inv.total, inv.currency)}</td>
                    <td className="py-3.5 px-4 sm:px-5"><StatusBadge status={inv.status} /></td>
                    <td className="py-3.5 px-4 sm:px-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/25 hover:text-white hover:bg-white/5">
                            <RiMoreLine className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10">
                          <DropdownMenuItem asChild className="text-white/60 focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
                            <Link href={`/dashboard/invoices/${inv.id}`}><RiPencilLine className="w-4 h-4" /> View / Edit</Link>
                          </DropdownMenuItem>
                          {inv.status === 'unpaid' && (
                            <DropdownMenuItem onClick={() => updateStatus(inv.id, 'paid')} className="text-white/60 focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
                              <RiCheckLine className="w-4 h-4" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/8" />
                          <DropdownMenuItem onClick={() => deleteInvoice(inv.id)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2 cursor-pointer">
                            <RiDeleteBinLine className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateWithAIDialog open={showAI} onOpenChange={setShowAI} />
    </div>
  )
}
