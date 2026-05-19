"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  RiBarChartBoxLine,
  RiGlobalLine,
  RiCheckLine,
  RiArrowRightLine,
  RiSparkling2Line,
  RiMenu3Line,
  RiCloseLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { FiZap } from "react-icons/fi";

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#FF0A54] cherry-glow-sm flex items-center justify-center">
        <RiSparkling2Line className="w-5 h-5 text-white" />
      </div>
      <span className="font-serif text-xl font-bold text-white tracking-tight">
        Invoice AI
      </span>
    </div>
  );
}

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav border-b border-[#FF0A54]/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              Login
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white text-sm px-5 py-2 h-9 cherry-glow-sm transition-all hover:cherry-glow font-medium">
                Sign Up
              </Button>
            </Link>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <RiCloseLine className="w-6 h-6" />
            ) : (
              <RiMenu3Line className="w-6 h-6 text-[#FF0A54]" />
            )}
          </button>
        </div>
      </div>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed inset-0 top-16 bg-[#050505]/98 backdrop-blur-lg md:hidden"
        >
          <div className="flex flex-col items-center justify-center gap-8 h-full">
            <Link
              href="#features"
              className="text-white text-xl"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-white text-xl"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-white text-xl"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
              <Button className="bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white px-8 py-6 text-lg cherry-glow">
                Sign Up
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex items-center bg-[#050505] pt-20 overflow-hidden relative">
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#FF0A54]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-12 lg:py-20 w-full">
        <div className="grid lg:grid-cols-[52%_48%] gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Get paid <span className="text-[#FF0A54]">faster.</span>
              <br />
              Work less.
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-lg leading-relaxed">
              Create professional invoices in seconds. Track payments. Automate
              reminders. All in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white text-base px-8 py-6 w-full sm:w-auto animate-pulse-cherry font-medium"
                >
                  Get Started Free <RiArrowRightLine className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <RiCheckLine className="w-4 h-4 text-emerald-500" /> No credit
                card required
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <RiCheckLine className="w-4 h-4 text-emerald-500" /> Free
                forever
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl glass-card p-1">
              <div className="bg-[#0a0a0a] rounded-xl p-5 sm:p-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-white/30 text-xs">
                    Invoice AI Dashboard
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      label: "Revenue",
                      value: "$12,450",
                      color: "text-emerald-400",
                    },
                    {
                      label: "Invoice AI",
                      value: "74",
                      color: "text-[#FF0A54]",
                    },
                    { label: "Pending", value: "5", color: "text-yellow-400" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-[#111] rounded-lg p-3 border border-white/5"
                    >
                      <p className="text-white/40 text-xs mb-1">{s.label}</p>
                      <p className={`font-bold text-sm ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">
                    Recent Invoices
                  </p>
                  {[
                    {
                      id: "INV-2026-004",
                      name: "Acme Corp",
                      amount: "$2,400",
                      status: "Paid",
                      sc: "text-emerald-400 bg-emerald-500/15",
                    },
                    {
                      id: "INV-2026-003",
                      name: "Design Studio",
                      amount: "$1,850",
                      status: "Unpaid",
                      sc: "text-red-400 bg-red-500/15",
                    },
                    {
                      id: "INV-2026-002",
                      name: "NextWave Inc",
                      amount: "$3,200",
                      status: "Paid",
                      sc: "text-emerald-400 bg-emerald-500/15",
                    },
                  ].map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="text-white/80 text-xs font-mono">
                          {inv.id}
                        </p>
                        <p className="text-white/40 text-xs">{inv.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-medium">
                          {inv.amount}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${inv.sc}`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#FF0A54]/20 to-transparent border border-[#FF0A54]/20 flex items-center gap-3">
                  <RiSparkling2Line className="w-4 h-4 text-[#FF0A54] flex-shrink-0" />
                  <span className="text-white/60 text-xs">
                    AI-Powered Invoicing · Ready to generate invoices
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-[#FF0A54]/8 blur-3xl rounded-full -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustedBySection() {
  const brands = [
    "Voxel Studio",
    "Linear Labs",
    "Raycast Pro",
    "Figma Freelancers",
    "Notion Consultants",
    "Arc Collective",
    "Shopify Partners",
    "Stripe Agency",
    "Vercel Studio",
  ];
  return (
    <section className="py-10 bg-[#080808] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <p className="text-center text-white/30 text-xs mb-6 tracking-widest uppercase">
          Trusted by freelancers and agencies worldwide
        </p>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="mx-10 text-white/25 hover:text-white/50 transition-colors text-sm font-medium tracking-wide"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Smart Automation",
      description:
        "Let AI handle repetitive billing tasks. Auto-generate invoices from text, emails, and meeting notes with intelligent parsing.",
      icon: FiZap,
      wide: true,
    },
    {
      title: "Instant Analytics",
      description:
        "Real-time revenue dashboards with predictive insights. Track payments, overdue invoices, and cash flow at a glance.",
      icon: RiBarChartBoxLine,
    },
    {
      title: "Global Payments",
      description:
        "Accept payments in 135+ currencies. Automatic conversion, tax calculations, and compliance built-in.",
      icon: RiGlobalLine,
    },
  ];
  return (
    <section id="features" className="py-24 sm:py-32 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <AnimatedSection className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything you need to{" "}
            <span className="text-[#FF0A54]">bill smarter</span>
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            A complete invoicing toolkit powered by artificial intelligence
          </p>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          {features.map((feature, i) => (
            <AnimatedSection
              key={i}
              delay={i * 0.1}
              className={feature.wide ? "md:col-span-2" : ""}
            >
              <div className="h-full p-6 sm:p-8 rounded-2xl bg-[#0a0a0a] border border-white/8 hover:border-[#FF0A54]/25 transition-all duration-300 group">
                <div className="w-11 h-11 rounded-xl bg-[#FF0A54]/10 flex items-center justify-center mb-5 group-hover:bg-[#FF0A54]/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-[#FF0A54]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/45 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function RevenueSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} className="py-24 sm:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Revenue tracking,{" "}
              <span className="text-[#FF0A54]">simplified.</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              Stop chasing payments. Our intelligent dashboard shows exactly who
              owes what, when it is due, and how to follow up — automatically.
            </p>
            <ul className="space-y-3.5">
              {[
                "Real-time payment status across all invoices",
                "Automated overdue reminders with AI-generated copy",
                "Revenue forecasting based on historical data",
                "One-click export to accounting software",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#FF0A54]/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <RiCheckLine className="w-3 h-3 text-[#FF0A54]" />
                  </div>
                  <span className="text-white/60 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl bg-[#0a0a0a] border border-white/8 p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
                    INVOICE
                  </p>
                  <p className="text-white/50 text-xs font-mono">
                    INV-2026-0041
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/25">
                  Paid
                </span>
              </div>
              <div className="mb-5">
                <p className="text-white text-sm font-semibold">
                  Acme Corporation
                </p>
                <p className="text-white/40 text-xs">San Francisco, CA</p>
                <div className="flex gap-6 mt-2">
                  <div>
                    <p className="text-white/30 text-xs">DATE</p>
                    <p className="text-white/60 text-xs">May 8, 2026</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">DUE</p>
                    <p className="text-white/60 text-xs">May 22, 2026</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/8 pt-5 space-y-3">
                <div className="grid grid-cols-4 gap-2 text-xs text-white/30 uppercase tracking-wider pb-2">
                  <span className="col-span-2">Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {[
                  { desc: "Brand Strategy", qty: 1, total: "$3,500" },
                  { desc: "UI/UX Design", qty: 40, total: "$3,800" },
                  { desc: "Development", qty: 80, total: "$7,200" },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 text-xs">
                    <span className="col-span-2 text-white/70">
                      {item.desc}
                    </span>
                    <span className="text-right text-white/40">{item.qty}</span>
                    <span className="text-right text-white">{item.total}</span>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Subtotal</span>
                    <span>$14,500.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Tax (8%)</span>
                    <span>$1,160.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span className="text-white">Total</span>
                    <span className="text-[#FF0A54]">$15,660.00</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-[#FF0A54]/5 blur-3xl rounded-full -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section
      ref={ref}
      className="py-24 sm:py-32 relative overflow-hidden bg-[#050505]"
    >
      <div className="absolute inset-0 bg-gradient-radial from-[#FF0A54]/12 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF0A54]/8 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF0A54]/8 blur-[100px] rounded-full" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to automate
            <br />
            your billing?
          </h2>
          <p className="text-white/40 text-sm mb-10">
            Join thousands of freelancers and agencies who have streamlined
            their invoicing workflow with AI.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-[#050505] hover:bg-white/90 text-base px-10 py-7 font-bold"
            >
              <RiSparkling2Line className="mr-2 w-5 h-5" />
              Get Started Free
              <RiArrowRightLine className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/25 text-xs mt-5">
            No credit card required · Free forever · All your data
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "AI Invoice Parser", href: "/dashboard/ai" },
        { label: "PDF Export", href: "/dashboard/invoices" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "Security", href: "/security" },
      ],
    },
  ];
  return (
    <footer className="py-16 bg-[#050505] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2">
            <Logo className="mb-4" />
            <p className="text-white/30 text-sm max-w-xs leading-relaxed">
              AI-powered invoicing for modern businesses. Generate, track, and
              get paid faster.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-white text-sm font-semibold mb-4">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/35 hover:text-white/70 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} Invoice AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF0A54] animate-pulse" />

            <a
              href="https://swayam.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-xs tracking-wide hover:text-[#FF0A54] transition-colors"
            >
              Built by Swayam
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-[#050505] min-h-screen">
      <Navigation />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <RevenueSection />
      <CTASection />
      <Footer />
    </main>
  );
}
