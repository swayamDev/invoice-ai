'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { RiSparkling2Line, RiArrowLeftLine, RiMailLine } from 'react-icons/ri'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-[#FF0A54] cherry-glow flex items-center justify-center">
              <RiSparkling2Line className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-white">Invoice AI</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-white/40 text-sm mt-2">
            {sent ? "Check your inbox" : "Enter your email to get a reset link"}
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/8 rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <RiMailLine className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white/60 text-sm">
                We sent a password reset link to <span className="text-white font-medium">{email}</span>.
                Check your inbox and spam folder.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-white/10 text-white/60 hover:bg-white/5 hover:text-white mt-2">
                  <RiArrowLeftLine className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-white/60 text-sm">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-[#FF0A54]/50 focus-visible:ring-0"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white font-medium py-6 cherry-glow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending link...
                  </span>
                ) : 'Send Reset Link'}
              </Button>

              <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition-colors mt-2">
                <RiArrowLeftLine className="w-4 h-4" />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
