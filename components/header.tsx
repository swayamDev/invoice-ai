'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  RiSparkling2Line,
  RiAddLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { CreateWithAIDialog } from '@/components/create-with-ai-dialog'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/invoices': 'Invoices',
  '/dashboard/invoices/new': 'New Invoice',
  '/dashboard/clients': 'Clients',
  '/dashboard/settings': 'Settings',
  '/dashboard/ai': 'AI Assistant',
}

export function Header() {
  const pathname = usePathname()
  const [showAI, setShowAI] = useState(false)

  let title = pageTitles[pathname]
  if (!title) {
    if (pathname.startsWith('/dashboard/invoices/') && pathname !== '/dashboard/invoices/new') {
      title = 'Invoice Details'
    } else {
      title = 'Dashboard'
    }
  }

  return (
    <>
      <header className="h-16 bg-[#050505] border-b border-[#FF0A54]/10 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-10" />
          <h1 className="font-serif text-xl font-bold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAI(true)}
            className="hidden sm:flex gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-[#FF0A54]/30"
          >
            <RiSparkling2Line className="w-4 h-4 text-[#FF0A54]" />
            <span className="hidden md:inline text-sm">Create with AI</span>
          </Button>

          <Link href="/dashboard/invoices/new">
            <Button className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm text-sm">
              <RiAddLine className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
          </Link>
        </div>
      </header>

      <CreateWithAIDialog open={showAI} onOpenChange={setShowAI} />
    </>
  )
}
