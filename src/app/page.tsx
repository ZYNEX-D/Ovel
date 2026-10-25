import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock,
  ShoppingBag,
  Check,
  ExternalLink,
} from "lucide-react";
import ProgressiveBlur from "@/components/ProgressiveBlur";
import LandingBackground from "@/components/home/LandingBackground";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import ClickLink from "@/components/home/ClickLink";
import SavingsCalculator from "@/components/home/SavingsCalculator";
import HeroShowcase from "@/components/home/HeroShowcase";
import HomeFooter from "@/components/home/HomeFooter";

const DEMO_LINKS = [
  {
    slug: "apex-studio",
    name: "Apex Auto Lab",
    category: "Auto Detailing",
    theme: "Velvet Dark • Space Grotesk",
    bg: "bg-[#090D16] text-[#F8FAFC]",
    accent: "text-[#38BDF8]",
    pill: "bg-[#0284C7] text-white",
    type: "Paint Correction & Detailing",
    sampleUrl: "/l/apex-studio",
  },
  {
    slug: "craft-bakes",
    name: "Velvet Crumb Bakes",
    category: "Artisanal Bakery",
    theme: "Warm Clay • Playfair Display",
    bg: "bg-[#FEFCE8] text-[#451A03]",
    accent: "text-[#D97706]",
    pill: "bg-[#854D0E] text-white",
    type: "Custom Cake Orders & Tastings",
    sampleUrl: "/l/craft-bakes",
  },
  {
    slug: "vance-studio",
    name: "Vance Production Loft",
    category: "Studio Rentals",
    theme: "Hyper Minimal • Syne Font",
    bg: "bg-[#FAFAFA] text-[#18181B]",
    accent: "text-[#6366F1]",
    pill: "bg-[#18181B] text-white",
    type: "Hourly Daylight Cyc Bookings",
    sampleUrl: "/l/vance-studio",
  },
  {
    slug: "My BUsiness",
    name: "L'Éclat Boutique",
    category: "Wellness & Care",
    theme: "Signature Teal • Kaleko 105",
    bg: "bg-[#F6FAF9] text-[#103438]",
    accent: "text-[#63C1BB]",
    pill: "bg-[#105F68] text-white",
    type: "Aesthetic Appointments",
    sampleUrl: "/l/MyBUsiness",
  },
];

const LOOP_STEPS = [
  {
    step: "01",
    name: "Quote",
    desc: "Send interactive digital proposals with e-signature and optional package add-ons.",
    badge: "Auto-Convert",
    icon: FileText,
  },
  {
    step: "02",
    name: "Book & Order",
    desc: "Clients choose slots or items via your customized Ovelink with direct card deposits.",
    badge: "Zero Overlaps",
    icon: Calendar,
  },
  {
    step: "03",
    name: "Remind",
    desc: "Automated 2-way WhatsApp reminders: Client replies '1' to confirm or '2' to reschedule.",
    badge: "-25% No-Shows",
    icon: MessageSquare,
  },
  {
    step: "04",
    name: "Invoice",
    desc: "Instant automated PDF receipts crediting upfront deposits and calculating sales tax.",
    badge: "One-Click PDF",
    icon: Sparkles,
  },
  {
    step: "05",
    name: "Paid",
    desc: "100% of revenue routes straight into your merchant bank account. Ovel takes 0% commission.",
    badge: "0% Commission",
    icon: DollarSign,
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] overflow-x-hidden">
      <LandingBackground
        colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
        rotation={90}
        speed={0.2}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        noise={0.08}
        parallax={0.5}
        iterations={1}
        intensity={1.2}
        bandWidth={6}
        transparent={true}
      />

      <ProgressiveBlur position="top" height="h-24" />

      <header className="sticky top-0 z-40 bg-[#F6FAF9]/85 backdrop-blur-md border-b border-[#105F68]/10 transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="font-['Disolve'] text-2xl sm:text-3xl text-[#105F68] tracking-tight">
              Ovel
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-[#3A9295] font-light">
            <a href="#engines" className="hover:text-[#105F68] transition-colors tracking-tight">
              The 3 Engines
            </a>
            <a href="#demos" className="hover:text-[#105F68] transition-colors tracking-tight">
              Live Demos
            </a>
            <a href="#how-it-works" className="hover:text-[#105F68] transition-colors tracking-tight">
              How It Works
            </a>
            <a href="#savings" className="hover:text-[#105F68] transition-colors tracking-tight">
              0% Commission
            </a>
          </nav>

          <HomeHeaderActions />
        </div>
      </header>

      <main className="w-full">
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-16 sm:pt-24 pb-16 sm:pb-24 flex flex-col items-center justify-center text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/85 border border-[#105F68]/15 text-xs text-[#105F68] font-medium tracking-wide shadow-sm hover:shadow-md transition-all mb-8 opacity-0 animate-[blurFadeUp_1s_cubic-bezier(0.22,1,0.36,1)_forwards]">
            <span className="w-2 h-2 rounded-full bg-[#63C1BB] animate-ping" />
            <span>The Flat-Price Booking-to-Paid Platform</span>
            <span className="text-[#3A9295]">•</span>
            <span className="font-semibold text-[#105F68]">0% Take-Rate</span>
          </div>

          {/* Headline */}
          <h1
            className="font-light text-4xl sm:text-6xl md:text-7xl lg:text-[76px] text-[#105F68] leading-[1.08] tracking-tight max-w-5xl mx-auto mb-6 sm:mb-8 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "150ms" }}
          >
            One <span className="font-['Disolve'] font-normal text-[#105F68]">Ovelink</span> for Everything You{" "}
            <span className="text-[#3A9295] font-normal">Book, Sell, or Schedule.</span>
          </h1>

          {/* Subtitle with improved legibility */}
          <p
            className="text-base sm:text-xl text-[#245D63] font-normal leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "300ms" }}
          >
            Give your clients a pristine, custom-branded link (<span className="font-mono text-[#105F68] font-semibold bg-[#C8E6E2]/40 px-2 py-0.5 rounded-md">ovel.lk/l/your-name</span>) to schedule appointments, reserve time slots, or place custom orders with instant deposits. Zero marketplace commission.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 w-full mb-8 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "450ms" }}
          >
            <ClickLink
              href="/signup"
              className="bg-[#105F68] text-white px-8 py-4 rounded-full text-base sm:text-lg flex justify-center items-center gap-2 hover:bg-[#0D4F57] hover:shadow-xl hover:shadow-[#105F68]/20 hover:-translate-y-1 transition-all duration-300 font-light tracking-tight"
            >
              <span>Create Your Ovelink Free</span>
              <ArrowRight className="w-4 h-4" />
            </ClickLink>

            <a
              href="#engines"
              className="border border-[#105F68]/20 text-[#105F68] bg-white/85 hover:bg-white hover:border-[#105F68]/40 px-7 py-4 rounded-full text-base sm:text-lg flex justify-center items-center gap-1.5 hover:-translate-y-1 transition-all duration-300 font-light tracking-tight shadow-sm"
            >
              <span>Explore The 3 Engines</span>
              <ChevronRight className="w-4 h-4 text-[#3A9295]" />
            </a>
          </div>

          {/* Trust Guarantees */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[#3A9295] tracking-widest uppercase font-medium mb-4 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "550ms" }}
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#105F68]" />
              0% TAKE-RATE
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#105F68]" />
              WHATSAPP 2-WAY RECEIPTS
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#105F68]" />
              FLAT PREDICTABLE PRICING
            </span>
          </div>

          {/* Interactive Hero Showcase */}
          <div
            className="w-full opacity-0 animate-[blurFadeUp_1.3s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "650ms" }}
          >
            <HeroShowcase />
          </div>
        </section>

        <section id="engines" className="py-24 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#105F68]/10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
              ALL BUSINESS TYPES
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
              Three Engines. One Simple Link.
            </h2>
            <p className="text-sm sm:text-base text-[#3A9295] font-light">
              Whether you charge for your time, rent out physical spaces, or craft products to order, Ovel adapts to how you do business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[2rem] bg-white border border-[#105F68]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295]">Engine 01</span>
                <h3 className="text-2xl font-light text-[#105F68] mt-1">Appointments &amp; Services</h3>
                <p className="text-xs text-[#3A9295] mt-2 leading-relaxed">
                  For consultants, salons, trainers, therapists, mechanics, tutors, and doctors. Live slot computation with staff shift schedules and post-service buffer times.
                </p>
              </div>
              <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68]">
                <span>Automated Buffer Engine</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-white border border-[#105F68]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#9ED5D1]/40 text-[#105F68] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295]">Engine 02</span>
                <h3 className="text-2xl font-light text-[#105F68] mt-1">Bookings &amp; Time Rentals</h3>
                <p className="text-xs text-[#3A9295] mt-2 leading-relaxed">
                  For photography lofts, podcast booths, vehicle detailing bays, sports courts, and private venues. Reserve blocks by hour or half-day with direct card deposits.
                </p>
              </div>
              <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68]">
                <span>Hourly / Daily Slot Reservation</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-white border border-[#105F68]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#63C1BB]/30 text-[#105F68] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295]">Engine 03</span>
                <h3 className="text-2xl font-light text-[#105F68] mt-1">Orders &amp; Custom Packages</h3>
                <p className="text-xs text-[#3A9295] mt-2 leading-relaxed">
                  For artisanal bakeries, catering pre-orders, floral arrangements, print workshops, and custom makers. Quantity counters, dietary notes, and pickup dates.
                </p>
              </div>
              <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68]">
                <span>Quantities &amp; Custom Inscriptions</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>
          </div>
        </section>

        <section id="demos" className="py-24 sm:py-32 px-4 sm:px-8 bg-gradient-to-b from-[#F6FAF9] via-[#C8E6E2]/20 to-[#F6FAF9] border-y border-[#105F68]/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                CUSTOMER EXPERIENCE
              </span>
              <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
                Experience What Your Clients See
              </h2>
              <p className="text-sm sm:text-base text-[#3A9295] font-light">
                Each Ovelink features the business’s customized fonts, palette colors, and offering flow. Click any sample below to experience the live customer booking journey:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEMO_LINKS.map((sample) => (
                <div
                  key={sample.slug}
                  className={`p-6 rounded-[2rem] border border-black/10 shadow-lg flex flex-col justify-between space-y-6 ${sample.bg}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${sample.pill}`}>
                        {sample.category}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">/l/{sample.slug}</span>
                    </div>

                    <h4 className="text-xl font-bold tracking-tight">{sample.name}</h4>
                    <p className={`text-xs ${sample.accent}`}>{sample.theme}</p>
                    <p className="text-[11px] opacity-75">{sample.type}</p>
                  </div>

                  <div className="pt-4 border-t border-current/10 flex items-center justify-between">
                    <Link
                      href={sample.sampleUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      <span>Try Customer Experience</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 sm:py-36 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
              TRANSACTION FLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
              Quote → Book → Remind → Invoice → Paid
            </h2>
            <p className="text-sm sm:text-base text-[#3A9295] font-light">
              Stop stitching together multiple separate software subscriptions. Ovel unifies the entire client interaction loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {LOOP_STEPS.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative p-6 rounded-3xl bg-white/80 border border-[#105F68]/10 hover:border-[#105F68]/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-[#3A9295]">{item.step}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C8E6E2]/40 text-[#105F68] font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#C8E6E2]/30 flex items-center justify-center text-[#105F68] mb-4 group-hover:scale-110 transition-transform">
                      <ItemIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-light text-[#105F68] mb-2">{item.name}</h3>
                    <p className="text-xs text-[#3A9295] font-light leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68]">
                    <span className="font-light">Step {idx + 1}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#3A9295] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="savings" className="py-24 sm:py-32 px-4 sm:px-8 bg-gradient-to-b from-[#F6FAF9] via-[#C8E6E2]/20 to-[#F6FAF9] border-y border-[#105F68]/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                THE COMMISSION LIBERATOR
              </span>
              <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-2 mb-4">
                Keep What You Earn.
              </h2>
              <p className="text-sm sm:text-base text-[#3A9295] font-light">
                Marketplace platforms take up to a 20% cut of every transaction. See how much you save with Ovel’s flat $39/mo model:
              </p>
            </div>

            <SavingsCalculator />
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
