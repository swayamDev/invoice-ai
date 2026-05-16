'use client'

import Link from 'next/link'
import { RiArrowLeftLine, RiMailLine, RiTwitterXLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Message sent! We'll get back to you within 24 hours.")
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Contact</h1>
        <p className="text-white/40 text-base mb-10">We typically respond within 24 hours.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: RiMailLine, label: 'Email', value: 'support@invoiceai.com' },
            { icon: RiTwitterXLine, label: 'Twitter', value: '@invoiceai' },
          ].map((c) => (
            <div key={c.label} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF0A54]/10 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-5 h-5 text-[#FF0A54]" />
              </div>
              <div>
                <p className="text-white/30 text-xs">{c.label}</p>
                <p className="text-white text-sm font-medium">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label className="text-white/50 text-sm">Name</Label>
              <Input placeholder="Your name" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
            </div>
            <div>
              <Label className="text-white/50 text-sm">Email</Label>
              <Input type="email" placeholder="you@example.com" className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50" />
            </div>
          </div>
          <div>
            <Label className="text-white/50 text-sm">Message</Label>
            <Textarea placeholder="How can we help?" rows={5} className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/50 resize-none" />
          </div>
          <Button type="submit" className="w-full bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white font-medium cherry-glow-sm">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  )
}
