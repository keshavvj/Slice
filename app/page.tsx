
import { SignInButton } from "@/components/SignInButton"
import { Sparkles, ArrowRight, ShieldCheck, Users, TrendingUp, ChevronRight, Play } from "lucide-react"
import Link from "next/link"

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Slice</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#community" className="hover:text-white transition-colors">Community</Link>
          <Link href="#security" className="hover:text-white transition-colors">Security</Link>
        </nav>

        <div className="flex items-center gap-4">
          <SignInButton className="hidden md:block text-sm font-medium text-white/60 hover:text-white transition-colors bg-transparent border-0 h-auto p-0">
            Log in
          </SignInButton>
          <div className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-full p-[1px]">
            <SignInButton className="rounded-full px-6 bg-transparent border-0 hover:bg-transparent text-white">
              Get Started
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center mt-10 md:mt-20 mb-20">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-sm font-medium text-indigo-300 mb-8 hover:scale-105 transition-transform cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Social Banking Reimagined
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-8 max-w-5xl mx-auto drop-shadow-2xl">
          Money moves<br />better together.
        </h1>

        <p className="text-lg md:text-2xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12">
          Slice is the financial OS for your social life. Split bills instantly, invest with your squad, and crush goals without the awkward conversations.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md sm:max-w-none justify-center">
          <div className="group relative w-full sm:w-auto">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 opacity-75 blur transition duration-500 group-hover:opacity-100 animate-gradient-x"></div>
            <div className="relative bg-black rounded-full">
              <SignInButton className="w-full sm:w-auto rounded-full px-8 py-6 text-lg font-bold bg-black hover:bg-black/90 border-0">
                Join for Free <ArrowRight className="ml-2 w-5 h-5" />
              </SignInButton>
            </div>
          </div>

          <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-all text-white font-medium group">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* Dashboard Preview / Floating UI Elements */}
        <div className="mt-24 relative w-full max-w-5xl mx-auto perspective-[2000px]">
          <div className="relative z-10 p-2 rounded-3xl bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl border border-white/10 rotate-x-12 transform-gpu shadow-2xl shadow-indigo-500/20">
            <div className="rounded-2xl overflow-hidden bg-black/80 aspect-[16/9] relative border border-white/5 flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 opacity-50"></div>
              <div className="text-center space-y-2">
                <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Internal Preview</p>
                <h3 className="text-2xl font-bold text-white">Slice Dashboard</h3>
              </div>

              {/* Floating Cards Mockup */}
              <div className="absolute top-10 left-10 p-4 rounded-xl bg-gray-900/90 border border-white/10 w-48 shadow-xl animate-float-slow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">$</div>
                  <div className="text-xs text-white/60">Safe to Spend</div>
                </div>
                <div className="text-xl font-bold text-white">$1,240.50</div>
              </div>

              <div className="absolute bottom-10 right-10 p-4 rounded-xl bg-gray-900/90 border border-white/10 w-56 shadow-xl animate-float-delayed">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Users className="w-4 h-4" /></div>
                  <div className="text-xs text-white/60">Ski Trip Split</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">$450.00</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Paid</span>
                </div>
              </div>

            </div>
          </div>

          {/* Glow behind preview */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 blur-[150px] -z-10 rounded-full"></div>
        </div>

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

      <footer className="relative z-10 py-12 text-center text-white/20 text-sm border-t border-white/5">
        <p>© 2026 Slice Financial Inc. Not a bank.</p>
      </footer>
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
