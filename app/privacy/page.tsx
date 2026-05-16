import Link from 'next/link'
import { RiArrowLeftLine } from 'react-icons/ri'

const titles: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookies: 'Cookie Policy',
  security: 'Security',
}

const slug = 'privacy'
const title = titles[slug]

export const metadata = { title: `${title} · Invoice AI` }

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <h1 className="font-serif text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-white/30 text-sm mb-10">Last updated: May 9, 2026</p>
        <div className="space-y-8 text-white/50 text-sm leading-relaxed">
          <p>This document outlines how Invoice AI handles your data and your rights as a user. We are committed to transparency and protecting your information.</p>
          <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6">
            <h2 className="font-serif text-lg font-bold text-white mb-3">Contact Us</h2>
            <p>For questions about this policy, email <a href="mailto:legal@invoiceai.com" className="text-[#FF0A54] hover:underline">legal@invoiceai.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
