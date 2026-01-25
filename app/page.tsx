
import { SignInButton } from "@/components/SignInButton"
import { CTASection } from "@/components/ui/hero-dithering-card"
import { HeroScrollDemo } from "@/components/hero-scroll-demo"
import { FloatingNav } from "@/components/FloatingNav"
import { Footer } from "@/components/ui/footer"
import { Sparkles, ArrowRight, ShieldCheck, Users, TrendingUp, ChevronRight, Play, Twitter, Instagram, Linkedin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { LOGO_DATA_URI } from "@/lib/logo-data"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white selection:bg-indigo-500 selection:text-white font-sans">

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-600/20 blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <header className="relative z-50 w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img
            src={LOGO_DATA_URI}
            alt="Slice Logo"
            width={480}
            height={160}
            className="h-32 w-auto object-contain"
          />
        </div>

        <FloatingNav />

        <div className="flex items-center gap-4">
          <SignInButton className="hidden md:block text-sm font-medium text-white/60 hover:text-white hover:bg-transparent data-[state=open]:bg-transparent transition-colors bg-transparent border-0 h-auto p-0 shadow-none">
            Log in
          </SignInButton>
          <SignInButton className="rounded-full px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-0 text-white transition-colors">
            Get Started
          </SignInButton>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-0 mt-10 md:mt-10 mb-20 w-full">
        <CTASection
          ctaButton={
            <SignInButton className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-12 text-base font-bold text-black transition-all duration-300 hover:bg-white/90 hover:scale-105 active:scale-95 border-0 hover:ring-0">
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            </SignInButton>
          }
        />
        <HeroScrollDemo />
      </main>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BentoCard
            title="Smart Splitting"
            desc="Connect cards, pick transactions, and split instantly. We handle the math and the awkward reminders."
            icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
            className="md:col-span-2"
          />
          <BentoCard
            title="Squad Goals"
            desc="Save for that trip to Bali together. High yield, zero stress."
            icon={<TrendingUp className="w-6 h-6 text-fuchsia-400" />}
          />
          <BentoCard
            title="Social Feed"
            desc="See where your friends are spending (if they let you). React, comment, and roast."
            icon={<Users className="w-6 h-6 text-cyan-400" />}
          />
          <BentoCard
            title="Bank Grade Security"
            desc="256-bit encryption. FDIC insured partners. Your money is safe with us."
            icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
            className="md:col-span-2"
          />
        </div>
      </section>

      <Footer
        logo={
          <img
            src={LOGO_DATA_URI}
            alt="Slice Logo"
            width={420}
            height={140}
            className="h-28 w-auto object-contain"
          />
        }
        brandName=""
        socialLinks={[
          {
            icon: <Twitter className="h-4 w-4" />,
            href: "https://twitter.com",
            label: "Twitter",
          },
          {
            icon: <Instagram className="h-4 w-4" />,
            href: "https://instagram.com",
            label: "Instagram",
          },
          {
            icon: <Linkedin className="h-4 w-4" />,
            href: "https://linkedin.com",
            label: "LinkedIn",
          },
        ]}
        mainLinks={[
          { href: "#features", label: "Features" },
          { href: "#community", label: "Community" },
          { href: "#security", label: "Security" },
          { href: "/login", label: "Login" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
          { href: "/cookie-policy", label: "Cookie Policy" },
        ]}
        copyright={{
          text: "© 2026 Slice Financial Inc.",
          license: "Not a bank. Banking services provided by partner banks.",
        }}
      />
    </div>
  )
}

function BentoCard({ title, desc, icon, className }: { title: string, desc: string, icon: React.ReactNode, className?: string }) {
  return (
    <div className={`p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed text-lg">{desc}</p>
    </div>
  )
}
