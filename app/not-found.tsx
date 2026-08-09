import Link from 'next/link'
import { RiSparkling2Line, RiArrowLeftLine, RiFileSearchLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center px-6 overflow-hidden relative">
      {/* Ambient glow, matching the homepage hero */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FF0A54]/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#FF0A54]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[#FF0A54] cherry-glow-sm flex items-center justify-center">
            <RiSparkling2Line className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl font-bold text-white tracking-tight">
            Invoice AI
          </span>
        </Link>

        <div className="relative mb-6">
          <div className="absolute -inset-6 bg-[#FF0A54]/10 blur-3xl rounded-full -z-10" />
          <p className="font-serif text-8xl sm:text-9xl font-bold text-white cherry-glow-text leading-none">
            404
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#FF0A54]/10 border border-[#FF0A54]/20 flex items-center justify-center mb-5">
          <RiFileSearchLine className="w-5 h-5 text-[#FF0A54]" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
          This invoice doesn&apos;t exist
        </h1>
        <p className="text-white/50 text-sm sm:text-base mb-8 leading-relaxed">
          The page you&apos;re looking for was moved, deleted, or never billed in the first
          place. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm transition-all hover:cherry-glow font-medium">
              <RiArrowLeftLine className="w-4 h-4" />
              Back to home
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white font-medium"
            >
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
