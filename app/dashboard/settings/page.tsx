'use client'

import { useState, useEffect } from 'react'
import {
  RiSaveLine,
  RiLogoutBoxLine,
  RiBuilding2Line,
  RiBellLine,
  RiShieldLine,
  RiUserLine,
  RiLoaderLine,
  RiCheckLine,
  RiReceiptLine,
  RiImageLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'SGD']
const TERMS = ['7', '14', '30', '45', '60', '90']

const tabs = [
  { id: 'profile', label: 'Profile', icon: RiUserLine },
  { id: 'company', label: 'Company', icon: RiBuilding2Line },
  { id: 'invoice', label: 'Invoice', icon: RiReceiptLine },
  { id: 'notifications', label: 'Notifications', icon: RiBellLine },
  { id: 'security', label: 'Security', icon: RiShieldLine },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Profile
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Company
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  // Invoice
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState('0')
  const [paymentTerms, setPaymentTerms] = useState('14')
  const [invoicePrefix, setInvoicePrefix] = useState('INV-')
  const [invoiceNotes, setInvoiceNotes] = useState('')

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [invoiceReminders, setInvoiceReminders] = useState(true)
  const [paymentReceipts, setPaymentReceipts] = useState(true)

  // Security
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
        setBusinessName(profile.business_name || '')
        setBusinessEmail(profile.business_email || user.email || '')
        setBusinessPhone(profile.business_phone || '')
        setBusinessAddress(profile.business_address || '')
        setLogoUrl(profile.logo_url || '')
        setCurrency(profile.default_currency || 'USD')
        setTaxRate(String(profile.default_tax_rate || 0))
        setPaymentTerms(String(profile.default_payment_terms || 14))
        setInvoicePrefix(profile.invoice_prefix || 'INV-')
        setInvoiceNotes(profile.default_notes || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('Profile saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveCompany = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        business_name: businessName,
        business_email: businessEmail,
        business_phone: businessPhone,
        business_address: businessAddress,
        logo_url: logoUrl || null,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('Company info saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveInvoiceDefaults = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        default_currency: currency,
        default_tax_rate: parseFloat(taxRate) || 0,
        default_payment_terms: parseInt(paymentTerms) || 14,
        invoice_prefix: invoicePrefix,
        default_notes: invoiceNotes,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('Invoice defaults saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!newPw || !confirmPw) { toast.error('Fill in all fields'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast.success('Password updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RiLoaderLine className="w-6 h-6 text-[#FF0A54] animate-spin" />
      </div>
    )
  }

  const fieldClass = 'bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50'

  return (
    <div className="max-w-3xl space-y-6">
      {/* Tab Nav */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/8 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF0A54] text-white cherry-glow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border border-[#FF0A54]/20">
              <AvatarFallback className="bg-[#FF0A54]/10 text-[#FF0A54] text-xl font-bold">
                {fullName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">{fullName || 'Your Name'}</p>
              <p className="text-white/40 text-sm">{userEmail}</p>
              <p className="text-white/25 text-xs mt-0.5">Avatar auto-generated from your name</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={`mt-1.5 ${fieldClass}`} />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Email Address</Label>
              <Input value={userEmail} disabled className={`mt-1.5 ${fieldClass} opacity-50 cursor-not-allowed`} />
              <p className="text-white/25 text-xs mt-1">Email cannot be changed here</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-white/40 hover:text-red-400 hover:bg-red-500/10">
              <RiLogoutBoxLine className="w-4 h-4" /> Sign Out
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSaveLine className="w-4 h-4" />}
              Save Profile
            </Button>
          </div>
        </div>
      )}

      {/* ── Company Tab ── */}
      {activeTab === 'company' && (
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-white font-semibold mb-1">Company Information</p>
            <p className="text-white/40 text-sm">This info appears on your invoices as the sender.</p>
          </div>

          <div>
            <Label className="text-white/50 text-xs uppercase tracking-wider">Logo URL</Label>
            <div className="flex gap-3 mt-1.5">
              <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                  : <RiImageLine className="w-5 h-5 text-white/20" />}
              </div>
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://your-logo-url.com/logo.png" className={fieldClass} />
            </div>
            <p className="text-white/25 text-xs mt-1">Enter a public image URL for your logo</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Business Name</Label>
              <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" className={`mt-1.5 ${fieldClass}`} />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Business Email</Label>
              <Input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="billing@acme.com" className={`mt-1.5 ${fieldClass}`} />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Phone</Label>
              <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="+1 555 000 0000" className={`mt-1.5 ${fieldClass}`} />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Address</Label>
              <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="123 Main St, New York" className={`mt-1.5 ${fieldClass}`} />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button onClick={saveCompany} disabled={saving} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSaveLine className="w-4 h-4" />}
              Save Company Info
            </Button>
          </div>
        </div>
      )}

      {/* ── Invoice Defaults Tab ── */}
      {activeTab === 'invoice' && (
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-white font-semibold mb-1">Invoice Defaults</p>
            <p className="text-white/40 text-sm">These values are pre-filled when you create a new invoice.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className={`mt-1.5 ${fieldClass}`}>
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
              <Label className="text-white/50 text-xs uppercase tracking-wider">Default Tax Rate (%)</Label>
              <Input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="0" className={`mt-1.5 ${fieldClass}`} />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Payment Terms (days)</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className={`mt-1.5 ${fieldClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10">
                  {TERMS.map(t => (
                    <SelectItem key={t} value={t} className="text-white/70 focus:bg-[#FF0A54]/10 focus:text-white">Net {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Invoice Prefix</Label>
              <Input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV-" className={`mt-1.5 ${fieldClass}`} />
            </div>
          </div>

          <div>
            <Label className="text-white/50 text-xs uppercase tracking-wider">Default Notes / Terms</Label>
            <textarea
              value={invoiceNotes}
              onChange={e => setInvoiceNotes(e.target.value)}
              placeholder="Payment due within specified terms. Late payments subject to 1.5% monthly interest."
              rows={3}
              className={`mt-1.5 w-full rounded-md border px-3 py-2 text-sm resize-none ${fieldClass}`}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button onClick={saveInvoiceDefaults} disabled={saving} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
              {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiSaveLine className="w-4 h-4" />}
              Save Defaults
            </Button>
          </div>
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === 'notifications' && (
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-white font-semibold mb-1">Notification Preferences</p>
            <p className="text-white/40 text-sm">Choose what emails you receive from Invoice AI.</p>
          </div>

          {[
            { label: 'Email Notifications', sub: 'Receive general product updates and announcements', value: emailNotifs, set: setEmailNotifs },
            { label: 'Invoice Reminders', sub: 'Get notified when invoices are due or overdue', value: invoiceReminders, set: setInvoiceReminders },
            { label: 'Payment Receipts', sub: 'Receive confirmation when a payment is received', value: paymentReceipts, set: setPaymentReceipts },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.sub}</p>
              </div>
              <Switch
                checked={item.value}
                onCheckedChange={item.set}
                className="data-[state=checked]:bg-[#FF0A54]"
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => toast.success('Notification preferences saved')}
              className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm"
            >
              <RiCheckLine className="w-4 h-4" /> Save Preferences
            </Button>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-white font-semibold mb-1">Change Password</p>
              <p className="text-white/40 text-sm">Use a strong password with at least 8 characters.</p>
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">New Password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="New password"
                className={`mt-1.5 ${fieldClass}`}
              />
            </div>
            <div>
              <Label className="text-white/50 text-xs uppercase tracking-wider">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                className={`mt-1.5 ${fieldClass}`}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={changePassword} disabled={saving || !newPw || !confirmPw} className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
                {saving ? <RiLoaderLine className="w-4 h-4 animate-spin" /> : <RiShieldLine className="w-4 h-4" />}
                Update Password
              </Button>
            </div>
          </div>

          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-6">
            <p className="text-white font-semibold mb-1">Danger Zone</p>
            <p className="text-white/40 text-sm mb-4">Permanently delete your account and all data.</p>
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
              Delete Account
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
