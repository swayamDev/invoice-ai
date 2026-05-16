'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiSparkling2Line,
  RiCloseLine,
  RiLoaderLine,
  RiArrowRightLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const examples = [
  'Built a landing page with React and Stripe for Acme Corp. 15 hours at $150/hr. Due in 14 days.',
  'Logo design and brand kit for StartUp Inc. Flat rate $2,500. Client: jane@startup.com',
  'Monthly retainer for SEO and content — 10 blog posts + keyword research. $1,800/month.',
]

export function CreateWithAIDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Describe what you did and who you did it for')
      return
    }
    setLoading(true)
    try {
      // Pass the text to the new invoice page via query param
      onOpenChange(false)
      setText('')
      router.push(`/dashboard/invoices/new?ai=${encodeURIComponent(text)}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-[#FF0A54]/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-white">
            <div className="w-8 h-8 rounded-lg bg-[#FF0A54]/15 flex items-center justify-center">
              <RiSparkling2Line className="w-4 h-4 text-[#FF0A54]" />
            </div>
            Create Invoice with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-white/50 text-sm">
            Describe the work you did in plain language. AI will auto-fill your invoice.
          </p>

          <Textarea
            placeholder="e.g. I built a React landing page with Stripe checkout for Acme Corp (billing@acme.com). Took 20 hours at $120/hr. Payment due in 14 days."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            className="bg-[#111] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus:border-[#FF0A54]/40 resize-none"
          />

          {/* Examples */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Try an example</p>
            <div className="space-y-1.5">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setText(ex)}
                  className="w-full text-left text-xs text-white/40 hover:text-white/70 p-2.5 rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all leading-relaxed"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-white/40 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="flex-1 gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm"
            >
              {loading
                ? <><RiLoaderLine className="w-4 h-4 animate-spin" />Processing...</>
                : <><RiSparkling2Line className="w-4 h-4" />Create Invoice<RiArrowRightLine className="w-4 h-4" /></>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
