import Link from 'next/link'
import { RiArrowLeftLine } from 'react-icons/ri'

export const metadata = { title: 'Careers · Invoice AI' }

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Careers</h1>
        <p className="text-white/40 text-base mb-12">Join us in building the future of invoicing.</p>
        <div className="bg-[#0a0a0a] border border-white/8 rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF0A54]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-white mb-2">No open roles right now</h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            We&apos;re a lean team building something big. Send your resume to{' '}
            <a href="mailto:careers@invoiceai.com" className="text-[#FF0A54] hover:underline">careers@invoiceai.com</a>
            {' '}and we&apos;ll keep you in mind.
          </p>
        </div>
      </div>
    </div>
  )
}
