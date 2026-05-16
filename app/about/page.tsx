import Link from 'next/link'
import { RiSparkling2Line, RiArrowLeftLine } from 'react-icons/ri'

export const metadata = { title: 'About · Invoice AI' }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#FF0A54] cherry-glow-sm flex items-center justify-center">
            <RiSparkling2Line className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-2xl font-bold text-white">Invoice AI</span>
        </div>
        <h1 className="font-serif text-4xl font-bold text-white mb-6">About Us</h1>
        <div className="space-y-6 text-white/50 leading-relaxed text-sm">
          <p>Invoice AI is built for freelancers and agencies who are tired of chasing payments. We believe billing should be effortless — so you can focus on the work that matters.</p>
          <p>Founded in 2024, our team is laser-focused on making invoicing intelligent. From AI-generated invoice drafts to automated payment reminders, every feature is designed to save time and get you paid faster.</p>
          <p>We&apos;re a remote-first company serving thousands of businesses across 60+ countries.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {[
            { label: '10,000+', desc: 'Active users' },
            { label: '$50M+', desc: 'Invoices processed' },
            { label: '60+', desc: 'Countries served' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-[#FF0A54] font-serif">{s.label}</p>
              <p className="text-white/40 text-sm mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
