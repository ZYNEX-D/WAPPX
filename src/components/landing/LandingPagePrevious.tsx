"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  Send,
  Lock,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Crown,
  Play,
  BarChart3,
  Globe,
  Star,
  Check,
  Clock,
  RefreshCw,
  Calendar,
  Rocket,
  ShieldCheck,
  Wallet,
  TrendingUp,
  HeartHandshake,
  AlertTriangle,
  UserX,
  PhoneCall,
  UserCheck,
  Cpu,
  Database,
  Headphones,
  Paperclip,
  Mic,
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenGuide: () => void;
  onQuickStartSimulator: () => void;
  authSession?: { email: string; role: "admin" | "client"; name?: string; clientId?: string } | null;
  onGoToDashboard?: () => void;
}

export function LandingPage({
  onOpenLogin,
  onOpenGuide,
  onQuickStartSimulator,
  authSession,
  onGoToDashboard,
}: LandingPageProps) {
  // Interactive Phone Demo state
  const [selectedDemoOption, setSelectedDemoOption] = useState<string>("pricing");
  const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    businessName: "",
    picName: "",
    phone: "",
    category: "",
    need: "",
  });

  const handleDemoSelect = (option: string) => {
    setSelectedDemoOption(option);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#334155] font-secondary overflow-x-hidden selection:bg-[#A2E4B8] selection:text-[#0A504A]">
      {/* 1. NAVIGATION BAR */}
      <nav className="fixed w-full z-50 top-0 left-0 bg-[#F7F7F2]/90 backdrop-blur-md border-b border-[#0A504A]/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img
              src="/icon.png"
              alt="WPPX Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold tracking-tighter text-[#0A504A] font-primary">
              WPPX
            </span>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-[#64748b]">
            <a href="#solutions" className="hover:text-[#00A86B] transition-colors">
              Solutions
            </a>
            <a href="#features" className="hover:text-[#00A86B] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#00A86B] transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-[#00A86B] transition-colors">
              Pricing
            </a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Bilingual Guide Trigger */}
            <button
              onClick={onOpenGuide}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-[#0A504A] bg-[#A2E4B8]/30 hover:bg-[#A2E4B8]/50 px-3 py-1.5 rounded-full border border-[#A2E4B8] transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Setup Guide / උපදෙස්</span>
            </button>

            {/* Auth Dependent Navigation Buttons */}
            {authSession ? (
              <button
                id="landing-dashboard-btn"
                onClick={onGoToDashboard || onOpenLogin}
                className="flex items-center gap-2 bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer"
              >
                <span>{authSession.role === "admin" ? "Admin Console" : "Open Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                {/* Login Button */}
                <button
                  id="landing-login-btn"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0A504A] hover:text-[#00A86B] px-3.5 py-2 rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                {/* Get Started CTA */}
                <button
                  onClick={onOpenLogin}
                  className="bg-[#0A504A] hover:bg-[#00A86B] text-[#F7F7F2] text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer font-primary"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="relative z-10">
            {/* Pill Badge */}
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A2E4B8]/25 border border-[#A2E4B8] text-[#0A504A] text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A86B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A86B]"></span>
              </span>
              The #1 WhatsApp Automation & CRM Engine for Growing Businesses
            </div> */}

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-8xl font-bold tracking-widest text-[#0A504A] leading-[1.18] mb-6 font-primary">
              WPP
              <span className="text-[#00A86B]">X</span>
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-[#64748b] mb-8 leading-relaxed max-w-lg font-secondary">
              <strong className="text-[#0A504A]">WPPX</strong> empowers businesses and agencies to save time,
              eliminate support costs, and drive recurring revenue with visual no-code WhatsApp bots & official Meta Cloud API v22.0.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] text-white rounded-full font-bold hover:bg-[#0A504A] hover:shadow-lg hover:shadow-[#00A86B]/20 transition-all duration-300 font-primary text-xs cursor-pointer"
              >
                Request Free Demo
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onQuickStartSimulator}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#0A504A]/20 text-[#0A504A] rounded-full font-semibold hover:bg-slate-50 transition-colors text-xs font-secondary shadow-xs cursor-pointer"
              >
                <Play className="w-4 h-4 fill-[#00A86B] text-[#00A86B]" />
                Test Live Simulator
              </button>
            </div>

            {/* Trust Proof */}
            <div className="mt-8 flex items-center gap-4 text-sm text-[#94a3b8]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#A2E4B8] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#0A504A]">
                  AD
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00A86B] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  TD
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0A504A] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  ZX
                </div>
              </div>
              <p className="text-xs font-medium text-[#64748b]">
                Trusted by <strong className="text-[#0A504A]">500+ Businesses & Agencies</strong>
              </p>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* Background glowing blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#A2E4B8]/40 rounded-full blur-3xl -z-10" />

            {/* Main Dashboard Card */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-[#0A504A]/10 border border-slate-100 overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              {/* Window Header */}
              <div className="bg-[#F7F7F2] border-b border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-[#00A86B]" />
                </div>
                <div className="text-xs font-mono font-medium text-[#64748b]">
                  WPPX Platform Engine
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Order Notification pill */}
                <div className="flex items-start gap-4 p-3 bg-[#A2E4B8]/20 rounded-xl border border-[#A2E4B8]/50">
                  <div className="w-10 h-10 bg-[#A2E4B8] rounded-full flex items-center justify-center text-[#0A504A]">
                    <UserCheck className="w-5 h-5 text-[#0A504A]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A504A]">New Order Captured</p>
                    <p className="text-xs text-[#64748b]">Customer #4920 • via WhatsApp</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-[#00A86B]">$85.00</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 bg-[#A2E4B8]/40 rounded-full" />
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                </div>

                {/* Chat Simulation */}
                <div className="space-y-3 mt-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-[#64748b]">
                      C
                    </div>
                    <div className="bg-slate-100 p-3 rounded-r-xl rounded-bl-xl text-xs text-slate-700 max-w-[80%]">
                      Hi, do you have this item in stock?
                    </div>
                  </div>

                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[#00A86B] shrink-0 flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#00A86B] text-white p-3 rounded-l-xl rounded-br-xl text-xs max-w-[80%] shadow-lg shadow-[#00A86B]/20">
                      Hello! 👋 Yes, it is in stock. How many units would you like to order?
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card 1: API Status */}
            <div className="absolute -right-2 sm:-right-4 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#A2E4B8]/30 rounded-lg flex items-center justify-center text-[#00A86B]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#94a3b8]">Status API</div>
                  <div className="text-sm font-bold text-[#00A86B]">Connected v22.0</div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Auto Follow-up */}
            <div className="absolute -left-2 sm:-left-4 bottom-16 bg-white p-4 rounded-xl shadow-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A504A]/10 rounded-lg flex items-center justify-center text-[#0A504A]">
                  <RefreshCw className="w-5 h-5 text-[#00A86B]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0A504A]">Auto Follow-up</div>
                  <div className="text-xs text-[#64748b]">Sent to 120 leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="py-20 bg-white border-y border-slate-100" id="solutions">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-4 font-primary">
              Common WhatsApp Challenges Faced by Growing Businesses
            </h2>
            <p className="text-[#64748b] text-sm">
              Handling customer conversations manually on individual phones creates bottlenecks and costs you sales.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-4 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                Piled Up Chats & Slow Response Times
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Customers leave for competitors when inquiry replies take more than 5 minutes during peak hours.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                Forgotten Follow-ups & Lost Revenue
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Hot prospective deals go cold because staff forget to re-engage previous inquiries and abandoned carts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                Founders Trapped Doing Manual CS
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Valuable executive hours wasted answering repetitive FAQs instead of focusing on growth and business strategy.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                Risk of WhatsApp Number Bans
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Using unofficial chrome extensions or scrapers puts your primary business contact at severe risk of permanent ban.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                Low Broadcast Conversion Rates
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Generic blast messages get flagged as spam. Without event-driven personalization, ROI remains minimal.
              </p>
            </div>

            {/* Card 6: Positive solution teaser */}
            <div className="bg-[#A2E4B8]/20 p-6 rounded-2xl border border-[#A2E4B8] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#00A86B] rounded-xl flex items-center justify-center text-white mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0A504A] mb-2 font-secondary">
                  The WPPX Solution
                </h3>
                <p className="text-xs text-[#0A504A]/80 leading-relaxed">
                  A unified platform powered by official Meta Cloud API v22.0 to automate chats, sync CRM data, and protect your business identity.
                </p>
              </div>
              <button
                onClick={onOpenLogin}
                className="mt-4 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] flex items-center gap-1 cursor-pointer"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOLUTION SECTION */}
      <section className="py-20 bg-[#F7F7F2]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Description */}
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-6 font-primary">
                One Unified System for Complete Operations
              </h2>
              <p className="text-[#64748b] mb-8 leading-relaxed text-sm">
                <strong className="text-[#0A504A]">WPPX</strong> is far more than a basic autoresponder. It is a complete
                conversational engine that connects marketing, sales, support, and CRM directly inside WhatsApp.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#A2E4B8] flex items-center justify-center text-[#0A504A] mt-1 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A504A] text-sm">Intelligent 24/7 WhatsApp Chatbots</h4>
                    <p className="text-xs text-[#64748b] mt-1">Autonomous conversational flows that answer questions and qualify leads naturally.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#A2E4B8] flex items-center justify-center text-[#0A504A] mt-1 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A504A] text-sm">Automated Sales Pipeline & CRM</h4>
                    <p className="text-xs text-[#64748b] mt-1">Automatically capture contact details, apply tags, and trigger timely follow-up sequences.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#A2E4B8] flex items-center justify-center text-[#0A504A] mt-1 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A504A] text-sm">100% Official Meta Cloud API</h4>
                    <p className="text-xs text-[#64748b] mt-1">Safe, legal, zero ban risk, and support for official Green Tick Verified Badges.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Workflow Diagram */}
            <div className="order-1 lg:order-2 bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#A2E4B8_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Step 1 */}
                <div className="bg-[#F7F7F2] p-4 rounded-xl shadow-xs border border-slate-200 flex items-center gap-3 w-64">
                  <div className="w-10 h-10 bg-[#A2E4B8]/40 rounded-lg flex items-center justify-center text-[#0A504A]">
                    <Users className="w-5 h-5 text-[#00A86B]" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#0A504A]">Customer</div>
                    <div className="text-[#64748b]">Sends WhatsApp Message</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-[#00A86B]" />

                {/* Step 2 */}
                <div className="bg-[#00A86B] p-4 rounded-xl shadow-lg shadow-[#00A86B]/20 border border-[#00A86B] flex items-center gap-3 w-64 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold font-primary">WPPX Engine</div>
                    <div className="text-[#A2E4B8]">Processes & Replies &lt;18ms</div>
                  </div>
                </div>

                {/* Step 3 Splitting Branches */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-xs relative mt-1">
                  <div className="bg-[#F7F7F2] p-3 rounded-xl shadow-xs border border-slate-200 text-center">
                    <Database className="w-5 h-5 text-[#00A86B] mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-[#0A504A]">Sync Database</div>
                    <div className="text-[10px] text-[#64748b]">PostgreSQL CRM</div>
                  </div>

                  <div className="bg-[#F7F7F2] p-3 rounded-xl shadow-xs border border-slate-200 text-center">
                    <Headphones className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-[#0A504A]">Alert Team</div>
                    <div className="text-[10px] text-[#64748b]">Live Inbox Handoff</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURE SECTION */}
      <section className="py-20 bg-white border-y border-slate-100" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-4 font-primary">
              Core Platform Features
            </h2>
            <p className="text-slate-500 text-sm">
              Cutting-edge WhatsApp infrastructure designed for maximum conversion and reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* F1 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-[#A2E4B8]/30 rounded-lg flex items-center justify-center text-[#00A86B] mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">24/7 Autonomous Bot</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Operates non-stop answering questions, checking order statuses, and scheduling appointments while your team sleeps.
              </p>
            </div>

            {/* F2 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">Smart Auto Follow-Up</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Re-engage prospective buyers automatically with tailored reminders and abandoned cart incentives.
              </p>
            </div>

            {/* F3 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">Contact CRM & Tags</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clean customer profiles with conversation history, internal team notes, and behavioral segmentation tags.
              </p>
            </div>

            {/* F4 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">Multi-Tenant Workspaces</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Onboard separate business clients with isolated WhatsApp numbers, dedicated inboxes, and dynamic verify tokens.
              </p>
            </div>

            {/* F5 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 mb-4">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">Visual Flow Builder</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drag-and-drop conversational node canvas powered by React Flow with triggers, interactive buttons, and logic splits.
              </p>
            </div>

            {/* F6 */}
            <div className="bg-[#F7F7F2] p-6 rounded-2xl border border-slate-100 hover:border-[#A2E4B8] transition-colors group shadow-xs">
              <div className="w-10 h-10 bg-[#0A504A]/10 rounded-lg flex items-center justify-center text-[#0A504A] mb-4">
                <BarChart3 className="w-5 h-5 text-[#00A86B]" />
              </div>
              <h3 className="font-bold text-[#0A504A] mb-2 text-base font-secondary">Analytics & Live Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Real-time tracking of message volume, bot resolution rate, webhook latency, and team performance metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. USE CASE SECTION */}
      <section className="py-20 bg-[#F7F7F2]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-12 text-center font-primary">
            Trusted Across Diverse Industries
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[#334155] text-xs font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-default shadow-xs">
              🛍️ E-Commerce & Retail Stores
            </div>
            <div className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[#334155] text-xs font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-default shadow-xs">
              🏥 Clinics & Healthcare Services
            </div>
            <div className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[#334155] text-xs font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-default shadow-xs">
              🏠 Real Estate & Property Consultants
            </div>
            <div className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[#334155] text-xs font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-default shadow-xs">
              🎓 Educational Academies & Institutes
            </div>
            <div className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[#334155] text-xs font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-default shadow-xs">
              💼 Digital Marketing Agencies & SaaS
            </div>
          </div>
        </div>
      </section>

      {/* 7. DEMO SECTION (INTERACTIVE PHONE SIMULATION) */}
      <section className="py-20 bg-[#0A504A] relative overflow-hidden" id="how-it-works">
        {/* Background Geometric Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`,
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Text & Steps */}
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 font-primary text-[#F7F7F2]">
              How the Automation Works
            </h2>
            <p className="text-[#A2E4B8] mb-8 text-base font-light leading-relaxed">
              Experience how <strong className="text-white font-semibold">WPPX</strong> handles incoming inquiries autonomously.
              From greeting and interactive menu branching to closing sales without human delays.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <p className="text-xs sm:text-sm text-[#F7F7F2]">Customer sends a message: "Hi, I need pricing info"</p>
              </div>
              <div className="w-px h-6 bg-[#A2E4B8]/30 ml-4" />

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <p className="text-xs sm:text-sm text-[#F7F7F2]">Bot instantly responds with Interactive Options</p>
              </div>
              <div className="w-px h-6 bg-[#A2E4B8]/30 ml-4" />

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <p className="text-xs sm:text-sm text-[#F7F7F2]">Customer chooses an option; Bot logs lead and executes action</p>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={onQuickStartSimulator}
                className="bg-[#F7F7F2] text-[#0A504A] px-6 py-3 rounded-full font-bold hover:bg-[#A2E4B8] transition-colors inline-flex items-center gap-2 cursor-pointer text-xs font-primary shadow-lg"
              >
                <span>Launch Interactive Sandbox</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Phone Demo UI (Realistic & Clickable) */}
          <div className="flex justify-center">
            <div className="w-[320px] h-[600px] bg-white rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20" />

              {/* WhatsApp Header */}
              <div className="bg-[#0A504A] p-4 pt-10 flex items-center gap-3 text-white z-10 shadow-md">
                <img src="/icon.png" alt="WPPX" className="w-7 h-7 rounded-full object-contain bg-white p-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate flex items-center gap-1">
                    <span>WPPX Assistant</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] fill-[#00A86B]" />
                  </div>
                  <div className="text-[10px] text-[#A2E4B8]">Official Business Account</div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 bg-[#efe7dd] p-4 overflow-y-auto space-y-3 relative no-scrollbar">
                {/* Chat Background Pattern */}
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                    backgroundSize: "300px",
                  }}
                />

                {/* Message 1: Customer */}
                <div className="bg-white p-2.5 px-3 rounded-r-lg rounded-bl-lg max-w-[85%] text-xs shadow-sm ml-auto text-slate-800">
                  Hi, I would like to learn about WPPX plans!
                  <div className="text-[9px] text-slate-400 text-right mt-1">10:00 AM</div>
                </div>

                {/* Message 2: Bot Reply */}
                <div className="bg-white p-2.5 px-3 rounded-l-lg rounded-br-lg max-w-[90%] text-xs shadow-sm mr-auto text-slate-800 flex flex-col gap-1.5">
                  <div>Hello! 👋 Welcome to WPPX Automation 🤖</div>
                  <div>Please select an option below:</div>
                  <div className="text-[9px] text-slate-400 text-right">10:00 AM</div>
                </div>

                {/* Interactive Clickable Buttons */}
                <div className="w-full flex flex-col gap-1.5">
                  <button
                    onClick={() => handleDemoSelect("pricing")}
                    className={`text-xs font-semibold py-2 px-3 rounded-lg shadow-xs border transition-all cursor-pointer ${selectedDemoOption === "pricing"
                      ? "bg-[#00A86B] text-white border-[#00A86B]"
                      : "bg-white text-[#0A504A] border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    Pricing Plans
                  </button>
                  <button
                    onClick={() => handleDemoSelect("agent")}
                    className={`text-xs font-semibold py-2 px-3 rounded-lg shadow-xs border transition-all cursor-pointer ${selectedDemoOption === "agent"
                      ? "bg-[#00A86B] text-white border-[#00A86B]"
                      : "bg-white text-[#0A504A] border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    Talk to Support Agent
                  </button>
                </div>

                {/* Response based on user click */}
                {selectedDemoOption === "pricing" && (
                  <>
                    <div className="bg-white p-2 px-3 rounded-r-lg rounded-bl-lg max-w-[80%] text-xs shadow-sm ml-auto text-slate-800">
                      Pricing Plans
                      <div className="text-[9px] text-slate-400 text-right mt-0.5">10:01 AM</div>
                    </div>
                    <div className="bg-white p-2.5 px-3 rounded-l-lg rounded-br-lg max-w-[90%] text-xs shadow-sm mr-auto text-slate-800 animate-in fade-in">
                      Starter plan begins at $29/mo, including auto-reply flows, contacts CRM, and official Meta Cloud API sync!
                      <div className="text-[9px] text-slate-400 text-right mt-1">10:01 AM</div>
                    </div>
                  </>
                )}

                {selectedDemoOption === "agent" && (
                  <>
                    <div className="bg-white p-2 px-3 rounded-r-lg rounded-bl-lg max-w-[80%] text-xs shadow-sm ml-auto text-slate-800">
                      Talk to Support Agent
                      <div className="text-[9px] text-slate-400 text-right mt-0.5">10:01 AM</div>
                    </div>
                    <div className="bg-white p-2.5 px-3 rounded-l-lg rounded-br-lg max-w-[90%] text-xs shadow-sm mr-auto text-slate-800 animate-in fade-in">
                      Connecting you to our team specialist now. Queue position: #1 ⏱️
                      <div className="text-[9px] text-slate-400 text-right mt-1">10:01 AM</div>
                    </div>
                  </>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white flex items-center gap-2 border-t border-slate-200">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <div className="flex-1 bg-slate-100 rounded-full h-8 px-3 text-xs flex items-center text-slate-400">
                  Type a reply...
                </div>
                <Mic className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="py-20 bg-[#F7F7F2]" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-4 font-primary">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-500 text-sm">Choose the plan that matches your current messaging volume.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-bold text-[#0A504A] text-lg font-primary">Starter</h3>
              <p className="text-xs text-slate-500 mb-6 mt-1">For single shops and emerging businesses.</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-[#0A504A] font-primary">$29</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-3 mb-8 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>1 Connected WhatsApp Number</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>React Flow Visual Builder (10 Flows)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Live Team Inbox (2 Agents)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Bilingual Setup Wizard</span>
                </li>
              </ul>
              <button
                onClick={onOpenLogin}
                className="block w-full py-3 text-center border border-slate-200 rounded-xl text-xs font-bold text-[#0A504A] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-pointer"
              >
                Choose Starter
              </button>
            </div>

            {/* Business Growth (Highlighted) */}
            <div className="bg-white p-8 rounded-2xl border-2 border-[#00A86B] shadow-xl relative transform scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00A86B] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-primary shadow-sm">
                Most Popular
              </div>
              <h3 className="font-bold text-[#0A504A] text-lg font-primary">Business Growth</h3>
              <p className="text-xs text-slate-500 mb-6 mt-1">For growing brands and digital agencies.</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-[#0A504A] font-primary">$89</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-3 mb-8 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span className="font-bold text-[#0A504A]">5 Client Workspaces (Multi-Tenant)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Unlimited Visual React Flow Diagrams</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Dynamic Isolated Webhook Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Central Super Admin Console</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Green Tick Assistance</span>
                </li>
              </ul>
              <button
                onClick={onOpenLogin}
                className="block w-full py-3 text-center bg-[#00A86B] text-white rounded-xl text-xs font-bold hover:bg-[#0A504A] transition-colors shadow-lg shadow-[#00A86B]/20 cursor-pointer font-primary"
              >
                Start Growth Plan
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-bold text-[#0A504A] text-lg font-primary">Enterprise</h3>
              <p className="text-xs text-slate-500 mb-6 mt-1">Dedicated cloud instance & custom integrations.</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-[#0A504A] font-primary">Custom</span>
              </div>
              <ul className="space-y-3 mb-8 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Unlimited WhatsApp Numbers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Custom CRM & ERP Webhook Integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                  <span>Dedicated Support 24/7 SLA</span>
                </li>
              </ul>
              <a
                href="#demo"
                className="block w-full py-3 text-center border border-slate-200 rounded-xl text-xs font-bold text-[#0A504A] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-pointer"
              >
                Contact Sales
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-8">
            *Meta conversational fees are paid directly to Meta based on actual usage. WPPX provides transparent pricing with zero markup.
          </p>
        </div>
      </section>

      {/* 9. WHY US SECTION */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-12 text-center font-primary">
            Why Choose WPPX?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-[#A2E4B8]/30 rounded-full flex items-center justify-center text-[#00A86B] mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-[#0A504A] mb-2 text-sm font-secondary">Official Meta Cloud API</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct integration with Graph API v22.0. Guaranteed reliability with zero risk of phone number bans.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-[#A2E4B8]/30 rounded-full flex items-center justify-center text-[#00A86B] mx-auto mb-4">
                <Wallet className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-[#0A504A] mb-2 text-sm font-secondary">Drastic Cost Reduction</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Autonomous bots resolve up to 84% of incoming queries, drastically reducing customer support payroll.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-[#A2E4B8]/30 rounded-full flex items-center justify-center text-[#0A504A] mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-[#0A504A] mb-2 text-sm font-secondary">Infinite Scalability</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Whether you receive 10 or 100,000 inquiries daily, our Supabase PostgreSQL engine handles it seamlessly.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-[#A2E4B8]/30 rounded-full flex items-center justify-center text-[#0A504A] mx-auto mb-4">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-[#0A504A] mb-2 text-sm font-secondary">Guided Onboarding</h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Interactive step-by-step setup wizard in both Sinhala (සිංහල) and English for 2-minute configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. LEAD & CONSULTATION DEMO FORM */}
      <section className="py-20 bg-[#F7F7F2]" id="demo">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0A504A] tracking-tight mb-4 font-primary">
                Book a Free Consultation & Demo
              </h2>
              <p className="text-slate-500 text-sm">
                Submit this quick form and our WhatsApp automation specialists will connect with you directly.
              </p>
            </div>

            {leadFormSubmitted ? (
              <div className="p-8 text-center bg-[#A2E4B8]/20 rounded-2xl border border-[#A2E4B8] animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-[#00A86B] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#0A504A] font-primary">Request Received!</h3>
                <p className="text-xs text-[#0A504A] mt-2">
                  Thank you! Our team will reach out to your WhatsApp ({leadFormData.phone || "number provided"}) shortly.
                </p>
                <button
                  onClick={() => setLeadFormSubmitted(false)}
                  className="mt-5 px-5 py-2 bg-[#00A86B] text-white rounded-full text-xs font-bold cursor-pointer font-primary"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Business Name</label>
                    <input
                      type="text"
                      required
                      value={leadFormData.businessName}
                      onChange={(e) => setLeadFormData({ ...leadFormData, businessName: e.target.value })}
                      placeholder="e.g. Apex Commerce / Zynex"
                      className="w-full px-4 py-3 rounded-xl bg-[#F7F7F2] border border-slate-200 focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden transition-all text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      value={leadFormData.picName}
                      onChange={(e) => setLeadFormData({ ...leadFormData, picName: e.target.value })}
                      placeholder="Your Full Name"
                      className="w-full px-4 py-3 rounded-xl bg-[#F7F7F2] border border-slate-200 focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="+94 72 973 1508 / +1 ..."
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F7F2] border border-slate-200 focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business Category</label>
                  <select
                    value={leadFormData.category}
                    onChange={(e) => setLeadFormData({ ...leadFormData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F7F2] border border-slate-200 focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden transition-all text-xs text-slate-600"
                  >
                    <option value="" disabled>Select Category</option>
                    <option value="retail">Retail / E-Commerce</option>
                    <option value="service">Professional Services</option>
                    <option value="fnb">Food & Beverage</option>
                    <option value="education">Education & Coaching</option>
                    <option value="agency">Agency & White-Label</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Primary Requirement</label>
                  <select
                    value={leadFormData.need}
                    onChange={(e) => setLeadFormData({ ...leadFormData, need: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F7F2] border border-slate-200 focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden transition-all text-xs text-slate-600"
                  >
                    <option value="" disabled>Select Requirement</option>
                    <option value="chatbot">Automated 24/7 Chatbot</option>
                    <option value="broadcast">Targeted Broadcast Campaigns</option>
                    <option value="crm">Lead Capture & Customer CRM</option>
                    <option value="api">Multi-Tenant Agency & API</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00A86B] text-white font-bold py-3.5 rounded-xl hover:bg-[#0A504A] transition-all shadow-lg shadow-[#00A86B]/20 mt-4 cursor-pointer font-primary text-xs"
                >
                  Request Free Demo
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="WPPX" className="w-8 h-8 rounded-lg object-contain shadow-xs" />
            <span className="text-lg font-bold tracking-tighter text-[#0A504A] font-primary">
              WPPX
            </span>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            <p className="mb-2">Effortless WhatsApp Automation & Business Operations</p>
            <div className="flex items-center justify-center md:justify-end gap-3 text-[11px]">
              <a href="#solutions" className="hover:text-[#00A86B]">Solutions</a>
              <span>•</span>
              <a href="#features" className="hover:text-[#00A86B]">Features</a>
              <span>•</span>
              <a href="#pricing" className="hover:text-[#00A86B]">Pricing</a>
              <span>•</span>
              <button onClick={onOpenLogin} className="hover:text-[#00A86B] font-bold cursor-pointer">
                Client & Admin Login
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">© 2026 WPPX Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
