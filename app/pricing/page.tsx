import Link from 'next/link'
import { RiArrowLeftLine, RiCheckLine } from 'react-icons/ri'

export const metadata = { title: 'Pricing · Invoice AI' }

const plans = [
  {
    name: 'Free',
    price: '$0',
    desc: 'For freelancers just getting started',
    features: ['5 invoices/month', 'PDF export', 'Basic analytics', 'Email support'],
    cta: 'Get Started',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: 'For growing businesses',
    features: ['Unlimited invoices', 'AI generation', 'Advanced analytics', 'Recurring invoices', 'Custom branding', 'Priority support'],
    cta: 'Start Free Trial',
    href: '/auth/signup',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$39',
    desc: 'For teams and agencies',
    features: ['Everything in Pro', 'Team members', 'Client portal', 'API access', 'White-label', 'Dedicated support'],
    cta: 'Contact Sales',
    href: '/contact',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">Simple Pricing</h1>
          <p className="text-white/40">Start free. Scale as you grow.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-6 flex flex-col ${plan.highlight ? 'bg-[#0a0a0a] border-2 border-[#FF0A54]/40 relative' : 'bg-[#0a0a0a] border border-white/8'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF0A54] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-white font-semibold">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white font-serif">{plan.price}</span>
                  <span className="text-white/30 text-sm">/mo</span>
                </div>
                <p className="text-white/40 text-xs mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
                    <RiCheckLine className="w-4 h-4 text-[#FF0A54] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={`w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${plan.highlight ? 'bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white' : 'border border-white/15 text-white/70 hover:bg-white/5 hover:text-white'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
