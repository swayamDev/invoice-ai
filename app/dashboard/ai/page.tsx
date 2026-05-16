'use client'

import { useState } from 'react'
import {
  RiSparkling2Line,
  RiZapLine,
  RiFileCopyLine,
  RiCheckLine,
  RiLoaderLine,
  RiMailLine,
  RiBellLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const features = [
  {
    id: 'invoice',
    title: 'Invoice Description',
    subtitle: 'Generate professional line item descriptions',
    icon: RiSparkling2Line,
    placeholder: 'e.g. Built a landing page with React, integrated Stripe payments, deployed to Vercel. 3 rounds of revisions. Took about 20 hours.',
  },
  {
    id: 'email',
    title: 'Invoice Email',
    subtitle: 'Draft a professional email to send with your invoice',
    icon: RiMailLine,
    placeholder: 'e.g. Sending invoice to Jane at Acme Corp for $5,500 web design project. Due in 14 days.',
  },
  {
    id: 'reminder',
    title: 'Payment Reminder',
    subtitle: 'Generate a polite but firm payment reminder',
    icon: RiBellLine,
    placeholder: 'e.g. Invoice INV-2026-001 for $3,200 is 7 days overdue. Client is Acme Corp, contact is john@acme.com.',
  },
  {
    id: 'terms',
    title: 'Payment Terms',
    subtitle: 'Generate clear payment terms and conditions',
    icon: RiZapLine,
    placeholder: 'e.g. Freelance design agency, projects typically $2k-$20k, international clients, want to protect against late payments.',
  },
]

export default function AIPage() {
  const [selected, setSelected] = useState(features[0].id)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const feature = features.find(f => f.id === selected)!

  const generate = async () => {
    if (!input.trim()) { toast.error('Add some details first'); return }
    setLoading(true)
    setOutput('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected, input }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOutput(data.output || '')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white mb-1">AI Assistant</h1>
        <p className="text-white/40 text-sm">Generate professional invoice content with AI</p>
      </div>

      {/* Feature Selector */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {features.map(f => {
          const Icon = f.icon
          return (
            <button
              key={f.id}
              onClick={() => { setSelected(f.id); setInput(''); setOutput('') }}
              className={`text-left p-4 rounded-xl border transition-all ${
                selected === f.id
                  ? 'border-[#FF0A54]/40 bg-[#FF0A54]/10'
                  : 'border-white/8 bg-[#0a0a0a] hover:border-white/15'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2.5 ${selected === f.id ? 'text-[#FF0A54]' : 'text-white/40'}`} />
              <p className={`text-sm font-semibold ${selected === f.id ? 'text-white' : 'text-white/70'}`}>{f.title}</p>
              <p className="text-white/35 text-xs mt-0.5 leading-snug">{f.subtitle}</p>
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">Your Input</h3>
          <div>
            <Label className="text-white/40 text-xs">Describe what you need</Label>
            <Textarea
              placeholder={feature.placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={8}
              className="mt-1.5 bg-[#111] border-white/8 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/40 resize-none"
            />
          </div>
          <Button
            onClick={generate}
            disabled={loading || !input.trim()}
            className="w-full gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm font-medium"
          >
            {loading
              ? <><RiLoaderLine className="w-4 h-4 animate-spin" />Generating...</>
              : <><RiSparkling2Line className="w-4 h-4" />Generate with AI</>}
          </Button>
        </div>

        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">Generated Output</h3>
          <div
            className={`min-h-48 p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed ${
              output ? 'bg-[#111] border-white/8 text-white' : 'border-white/5 text-white/25'
            }`}
          >
            {output || 'Your AI-generated content will appear here...'}
          </div>
          {output && (
            <Button
              onClick={copy}
              variant="outline"
              className="w-full gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            >
              {copied ? <><RiCheckLine className="w-4 h-4 text-emerald-400" />Copied!</> : <><RiFileCopyLine className="w-4 h-4" />Copy to Clipboard</>}
            </Button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="p-5 rounded-xl border border-[#FF0A54]/15 bg-[#FF0A54]/5">
        <p className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <RiSparkling2Line className="w-4 h-4 text-[#FF0A54]" /> Tips for better results
        </p>
        <ul className="text-white/45 text-xs space-y-1.5">
          <li>• Be specific: include project name, hours, technologies, and client name</li>
          <li>• Include amounts and due dates for emails and reminders</li>
          <li>• Describe your typical work and client type for payment terms</li>
          <li>• Generated content is a starting point — always review before sending</li>
        </ul>
      </div>
    </div>
  )
}
