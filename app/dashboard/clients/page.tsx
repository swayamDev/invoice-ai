'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RiAddLine,
  RiMailLine,
  RiPhoneLine,
  RiMoreLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiFileTextLine,
  RiTeamLine,
  RiGridLine,
  RiListCheck,
  RiCalendarLine,
  RiLoaderLine,
  RiMapPinLine,
  RiBuildingLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient as createSupabase } from '@/lib/supabase/client'
import type { Client } from '@/lib/database.types'
import Link from 'next/link'

const AVATAR_COLORS = [
  'bg-purple-500','bg-orange-500','bg-teal-500','bg-indigo-500',
  'bg-pink-500','bg-emerald-500','bg-yellow-500','bg-blue-500',
]
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', d: 'numeric', year: 'numeric' })

const BLANK = { name: '', email: '', phone: '', company: '', address: '' }

type ViewMode = 'grid' | 'list'

export default function ClientsPage() {
  const supabase = createSupabase()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [showAdd, setShowAdd] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const loadClients = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [])

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase())
    ), [clients, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openAdd = () => { setForm(BLANK); setShowAdd(true) }
  const openEdit = (c: Client) => {
    setEditClient(c)
    setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', address: c.address || '' })
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editClient) {
        const { error } = await supabase.from('clients').update({
          name: form.name, email: form.email, phone: form.phone || null,
          company: form.company || null, address: form.address || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editClient.id).eq('user_id', user.id)
        if (error) throw error
        toast.success('Client updated')
        setEditClient(null)
      } else {
        const { error } = await supabase.from('clients').insert({
          user_id: user.id, name: form.name, email: form.email,
          phone: form.phone || null, company: form.company || null,
          address: form.address || null,
        })
        if (error) throw error
        toast.success('Client added')
        setShowAdd(false)
      }
      await loadClients()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', deleteId)
      if (error) throw error
      setClients(prev => prev.filter(c => c.id !== deleteId))
      toast.success('Client deleted')
    } catch {
      toast.error('Failed to delete client')
    } finally {
      setDeleteId(null)
    }
  }

  const ClientForm = () => (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-white/50 text-xs uppercase tracking-wider">Full Name *</Label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-white/50 text-xs uppercase tracking-wider">Company</Label>
          <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-white/50 text-xs uppercase tracking-wider">Email *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@acme.com" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-white/50 text-xs uppercase tracking-wider">Phone</Label>
          <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
        </div>
        <div className="col-span-2">
          <Label className="text-white/50 text-xs uppercase tracking-wider">Address</Label>
          <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="88 Soho Loft, New York, NY 10012" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
        </div>
      </div>
    </div>
  )

  const ActionMenu = ({ client }: { client: Client }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5">
          <RiMoreLine className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10">
        <DropdownMenuItem onClick={() => openEdit(client)} className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
          <RiPencilLine className="w-4 h-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
          <Link href={`/dashboard/invoices?client=${client.id}`}>
            <RiFileTextLine className="w-4 h-4" /> View Invoices
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/8" />
        <DropdownMenuItem onClick={() => setDeleteId(client.id)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2 cursor-pointer">
          <RiDeleteBinLine className="w-4 h-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-white">Clients</h1>
          <span className="px-2 py-0.5 rounded-full bg-[#FF0A54]/15 text-[#FF0A54] text-xs font-semibold">{clients.length}</span>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
          <RiAddLine className="w-4 h-4" /> Add Client
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-[#0a0a0a] border-white/8 text-white placeholder:text-white/25 focus-visible:ring-0 focus:border-[#FF0A54]/40"
          />
        </div>
        <div className="flex items-center border border-white/8 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-[#FF0A54]/15 text-[#FF0A54]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <RiGridLine className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-[#FF0A54]/15 text-[#FF0A54]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <RiListCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RiLoaderLine className="w-6 h-6 text-[#FF0A54] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0a0a0a] border border-white/8 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#FF0A54]/10 flex items-center justify-center mb-4">
            <RiTeamLine className="w-8 h-8 text-[#FF0A54]" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-1">
            {search ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-white/40 text-sm mb-5">
            {search ? `No results for "${search}"` : 'Add your first client to get started'}
          </p>
          {!search && (
            <Button onClick={openAdd} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white">
              <RiAddLine className="w-4 h-4" /> Add Client
            </Button>
          )}
        </div>
      ) : view === 'grid' ? (
        /* ─── Grid View ─── */
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(client => (
              <div key={client.id} className="bg-[#0a0a0a] border border-white/8 hover:border-[#FF0A54]/25 rounded-xl p-5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className={`w-10 h-10 ${getColor(client.name)}`}>
                      <AvatarFallback className={`${getColor(client.name)} text-white text-sm font-bold`}>
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 text-xs">Active</span>
                    </div>
                  </div>
                  <ActionMenu client={client} />
                </div>

                <div className="mb-4">
                  <p className="text-white font-semibold">{client.name}</p>
                  {client.company && <p className="text-white/40 text-xs mt-0.5">{client.company}</p>}
                </div>

                <div className="space-y-1.5 text-xs text-white/40">
                  <div className="flex items-center gap-2">
                    <RiMailLine className="w-3.5 h-3.5 text-[#FF0A54] flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <RiPhoneLine className="w-3.5 h-3.5 text-[#FF0A54] flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <RiCalendarLine className="w-3.5 h-3.5 text-[#FF0A54] flex-shrink-0" />
                    <span>Added {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ─── List View ─── */
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Client', 'Contact', 'Company', 'Address', 'Added', ''].map((h, i) => (
                    <th key={i} className="text-left py-3 px-5 text-xs text-white/30 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(client => (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`${getColor(client.name)} text-white text-xs font-bold`}>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">{client.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-emerald-400 text-xs">Active</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <RiMailLine className="w-3 h-3 text-[#FF0A54]" />{client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <RiPhoneLine className="w-3 h-3 text-[#FF0A54]" />{client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-white/50 text-sm">
                      {client.company ? (
                        <div className="flex items-center gap-1.5">
                          <RiBuildingLine className="w-3.5 h-3.5 text-white/30" />
                          {client.company}
                        </div>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="py-3.5 px-5 text-white/40 text-xs max-w-32 truncate">
                      {client.address ? (
                        <div className="flex items-center gap-1.5">
                          <RiMapPinLine className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                          {client.address}
                        </div>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="py-3.5 px-5 text-white/40 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <RiCalendarLine className="w-3 h-3" />
                        {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <ActionMenu client={client} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} clients</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm transition-colors ${n === page ? 'bg-[#FF0A54] text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {n}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0a0a0a] border-[#FF0A54]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-white flex items-center gap-2">
              <RiAddLine className="w-5 h-5 text-[#FF0A54]" /> Add New Client
            </DialogTitle>
          </DialogHeader>
          <ClientForm />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-white/50 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white">
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiAddLine className="w-4 h-4" />}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editClient} onOpenChange={v => !v && setEditClient(null)}>
        <DialogContent className="bg-[#0a0a0a] border-[#FF0A54]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-white flex items-center gap-2">
              <RiPencilLine className="w-5 h-5 text-[#FF0A54]" /> Edit Client
            </DialogTitle>
          </DialogHeader>
          <ClientForm />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditClient(null)} className="text-white/50 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white">
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiPencilLine className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Client</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will permanently delete this client. Their invoices will remain in your records.
            </AlertDialogDescription>
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
