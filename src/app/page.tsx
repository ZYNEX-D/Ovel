"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  ShieldCheck,
  TrendingUp,
  Layers,
  Phone
} from "lucide-react";
import ThreeCanvas from "@/components/ThreeCanvas";
import ProgressiveBlur from "@/components/ProgressiveBlur";
import { AudioToggle, useAudio } from "@/components/AudioController";
import UserAuthNav from "@/components/UserAuthNav";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(18000);
  const { playClick } = useAudio();
  const { profile, isLoading } = useAuth();

  const marketplaceCut = Math.round(monthlyRevenue * 0.2);
  const ovelFlat = 39;
  const monthlySavings = marketplaceCut - ovelFlat;

  return (
    <div className="relative min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] overflow-x-hidden">
      {/* Three.js Ambient Fluid Particle Canvas */}
      <ThreeCanvas />

      {/* Progressive Blurs */}
      <ProgressiveBlur position="top" height="h-24" />
      <ProgressiveBlur position="bottom" height="h-20" />

      {/* Ambient Gradient Glow Spheres */}
      <div className="absolute -top-[15%] -right-[10%] w-[700px] h-[700px] bg-[#C8E6E2]/70 rounded-full blur-[120px] -z-10 pointer-events-none animate-gradientFlow1"></div>
      <div className="absolute top-[35%] -left-[12%] w-[600px] h-[600px] bg-[#9ED5D1]/55 rounded-full blur-[130px] -z-10 pointer-events-none animate-gradientFlow2"></div>

      {/* Public Marketing Top Header */}
      <header className="sticky top-0 z-40 bg-[#F6FAF9]/85 backdrop-blur-md border-b border-[#105F68]/10 transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6 flex items-center justify-center">
              <Image src="/icon.svg" alt="Ovel Icon" width={38} height={38} priority />
            </div>
            <span className="font-['Disolve'] text-2xl sm:text-3xl text-[#105F68] tracking-tight">
              ovel
            </span>
          </Link>

          {/* Public Navigation */}
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

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AudioToggle />
            <UserAuthNav />

            {/* Public CTA */}
            {!profile && !isLoading && <Link
              href="/signup"
              onClick={() => playClick()}
              className="group bg-[#105F68] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-light tracking-tight hover:bg-[#0D4F57] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <span>Get Your Ovelink</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="w-full">
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-16 sm:pt-28 pb-20 sm:pb-32 flex flex-col justify-center min-h-[calc(100vh-6rem)]">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 text-xs text-[#105F68] font-light tracking-wide w-fit mb-8 opacity-0 animate-[blurFadeUp_1s_cubic-bezier(0.22,1,0.36,1)_forwards]">
            <span className="w-2 h-2 rounded-full bg-[#63C1BB] animate-ping"></span>
            <span>One Link for Appointments, Bookings &amp; Orders • 0% Commission</span>
          </div>

          {/* Main Headline */}
          <h1 
            className="font-light text-4xl sm:text-6xl md:text-7xl lg:text-[76px] text-[#105F68] leading-[1.08] tracking-tight mb-8 sm:mb-12 max-w-5xl opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]" 
            style={{ animationDelay: "150ms" }}
          >
            One <span className="font-['Disolve'] font-normal text-[#105F68]">Ovelink</span> for Everything You{" "}
            <span className="text-[#3A9295] font-normal">Book, Sell, or Schedule.</span>
          </h1>

          {/* Subtitle & Public CTAs */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 w-full">
            <div 
              className="max-w-2xl opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]" 
              style={{ animationDelay: "300ms" }}
            >
              <p className="text-lg sm:text-2xl text-[#3A9295] font-light leading-relaxed tracking-tight">
                Give your clients a clean, custom-branded link (<span className="font-mono text-[#105F68]">ovel.app/l/your-name</span>) to schedule appointments, reserve time slots, or place custom orders with instant deposits. Zero marketplace commissions. Fully customizable with your <span className="text-[#105F68] font-medium">brand colors &amp; fonts</span>.
              </p>
            </div>

            <div 
              className="flex flex-col items-start lg:items-end gap-5 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]" 
              style={{ animationDelay: "450ms" }}
            >
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <Link
                  href="/signup"
                  onClick={() => playClick()}
                  className="bg-[#105F68] text-white px-7 py-4 rounded-full text-sm sm:text-base flex justify-center items-center gap-2 hover:bg-[#0D4F57] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-light tracking-tight"
                >
                  <span>Create Your Ovelink Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/l/apex-studio"
                  target="_blank"
                  className="border border-[#105F68]/25 text-[#105F68] bg-white/70 hover:bg-white px-6 py-4 rounded-full text-sm sm:text-base flex justify-center items-center gap-1.5 hover:-translate-y-1 transition-all duration-300 font-light tracking-tight"
                >
                  <span>See Live Customer Demo</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center gap-6 text-[11px] sm:text-xs text-[#3A9295] tracking-widest uppercase font-light">
                <span>0% TAKE-RATE</span>
                <span>•</span>
                <span>WHATSAPP 2-WAY RECEIPTS</span>
                <span>•</span>
                <span>FLAT PREDICTABLE PRICING</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: The 3 Core Business Engines */}
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
            {/* Engine 1 */}
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

            {/* Engine 2 */}
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

            {/* Engine 3 */}
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

        {/* Section 2: Real Ovelinks Live Showcase */}
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
              {[
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
                  slug: "leclat",
                  name: "L'Éclat Boutique",
                  category: "Wellness & Care",
                  theme: "Signature Teal • Kaleko 105",
                  bg: "bg-[#F6FAF9] text-[#103438]",
                  accent: "text-[#63C1BB]",
                  pill: "bg-[#105F68] text-white",
                  type: "Aesthetic Appointments",
                  sampleUrl: "/l/leclat",
                },
              ].map((sample) => (
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

        {/* Section 3: The 5-Step Commercial Loop */}
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
            {[
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
            ].map((item, idx) => {
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

        {/* Section 4: 0% Commission Savings Calculator */}
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

            <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border border-[#105F68]/15 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Slider (7 cols) */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs uppercase tracking-wider text-[#3A9295] font-light">
                      Monthly Business Revenue:
                    </span>
                    <span className="text-2xl font-light text-[#105F68]">
                      ${monthlyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="60000"
                    step="1000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full h-2 bg-[#C8E6E2] rounded-lg appearance-none cursor-pointer accent-[#105F68]"
                  />
                  <div className="flex justify-between text-[11px] text-[#3A9295] mt-1 font-mono">
                    <span>$3,000/mo</span>
                    <span>$30,000/mo</span>
                    <span>$60,000/mo</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-100">
                    <span>Marketplace 20% Take-Rate:</span>
                    <span className="font-semibold">-${marketplaceCut.toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between text-xs p-3 rounded-xl bg-[#C8E6E2]/30 text-[#105F68] border border-[#9ED5D1]/50">
                    <span>Ovel Flat Subscription:</span>
                    <span className="font-semibold">${ovelFlat}.00 / mo</span>
                  </div>
                </div>
              </div>

              {/* Result Callout (5 cols) */}
              <div className="md:col-span-5 p-6 rounded-3xl bg-[#105F68] text-white flex flex-col justify-between text-center space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#C8E6E2] font-light">
                    Your Annual Savings
                  </span>
                  <div className="text-4xl sm:text-5xl font-light text-white my-3">
                    ${(monthlySavings * 12).toLocaleString()}
                  </div>
                  <p className="text-xs text-[#9ED5D1] font-light leading-relaxed">
                    That is ${(monthlySavings).toLocaleString()} extra in your pocket each month — zero commission taken, ever.
                  </p>
                </div>
                <Link
                  href="/signup"
                  onClick={() => playClick()}
                  className="w-full py-3 rounded-full bg-[#63C1BB] hover:bg-[#3A9295] text-[#103438] hover:text-white text-xs font-medium tracking-tight transition-all shadow-md text-center"
                >
                  Start Saving Today
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Marketing Footer */}
      <footer className="bg-[#105F68] text-white py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-['Disolve'] text-3xl">ovel</span>
            <span className="text-white/40">•</span>
            <span className="text-[#C8E6E2]">The Zero-Commission Operating Platform for All Businesses</span>
          </div>

          <div className="flex items-center gap-6 text-[#C8E6E2]">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Create Account</Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">Features</a>
            <a href="#savings" className="hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 text-center sm:text-left text-[11px] text-[#9ED5D1]">
          © 2026 Ovel. 0% transaction commission fees. Built for modern businesses.
        </div>
      </footer>
    </div>
  );
}
