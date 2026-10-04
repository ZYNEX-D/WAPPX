"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Lenis from "lenis";
import {
  MessageSquare,
  GitBranch,
  Smartphone,
  Users,
  Settings,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  ChevronRight,
  Layers,
  Sparkles,
  Zap,
  Clock,
  Send,
  Building2,
  Cpu,
  Database,
  Radio,
  Share2,
  ChevronLeft,
  Bot,
  HelpCircle,
} from "lucide-react";
import { ThreeBackground } from "./ThreeBackground";

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
  const lenisRef = useRef<Lenis | null>(null);

  // Pricing state
  const [selectedPricing, setSelectedPricing] = useState<"hobby" | "pro" | "ent">("pro");
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);

  // Testimonials state
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      quote:
        "WAPPX transformed how our sales team handles customer inquiries. Incoming leads get answered in under 2 seconds with visual automated flows.",
      author: "Marcus Alvarez",
      role: "Head of Operations, Velocity Commerce",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      stats: [
        { val: "10x", lbl: "Faster Response" },
        { val: "99.9%", lbl: "Delivery Rate" },
        { val: "< 200ms", lbl: "Response Time" },
      ],
    },
    {
      quote:
        "The visual flow builder paired with official WhatsApp Cloud integration gives us enterprise reliability that unofficial tools could never provide.",
      author: "Sarah Chen",
      role: "VP of Product, RetailFlow Global",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80",
      stats: [
        { val: "84%", lbl: "Automation Rate" },
        { val: "40 hrs", lbl: "Saved Weekly" },
        { val: "Zero", lbl: "Downtime" },
      ],
    },
    {
      quote:
        "Managing multiple client workspaces with dedicated access keys and instant human agent takeover makes WAPPX the best platform for our agency.",
      author: "David Ross",
      role: "Director of Technology, Apex Growth Labs",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80",
      stats: [
        { val: "50k+", lbl: "Messages / Day" },
        { val: "100%", lbl: "Audit Trail" },
        { val: "3.4x", lbl: "Sales Growth" },
      ],
    },
  ];

  const currentTestimonial = testimonials[testimonialIndex];

  // 1. LENIS SMOOTH SCROLL & MESSAGE LIFECYCLE CONTROLLER
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Lifecycle Animation Elements
    const section = document.getElementById("decision-lifecycle");
    const line = document.getElementById("lifecycle-line");
    const steps = section?.querySelectorAll<HTMLElement>(".lifecycle-step");
    const pills = section?.querySelectorAll<HTMLElement>(".lifecycle-nav-pill");

    const thresholds = [
      { start: 0.04, end: 0.19 },
      { start: 0.19, end: 0.35 },
      { start: 0.35, end: 0.51 },
      { start: 0.51, end: 0.67 },
      { start: 0.67, end: 0.83 },
      { start: 0.83, end: 1.01 },
    ];

    function updateLifecycle() {
      if (!section || !line) return;
      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;
      const travel = rect.height - windowH;
      if (travel <= 0) return;

      const scrolled = -rect.top;
      let progress = scrolled / travel;
      progress = Math.max(0, Math.min(1, progress));

      // Line fill
      line.style.height = `${progress * 100}%`;

      // Step Active / Past Classes
      steps?.forEach((step, idx) => {
        const t = thresholds[idx];
        if (!t) return;
        const pill = pills?.[idx];

        if (progress >= t.start && progress < t.end) {
          step.classList.add("active");
          step.classList.remove("past");
          if (pill) {
            pill.classList.add("bg-[#00A86B]", "text-white", "shadow-xs");
            pill.classList.remove("text-slate-500", "text-[#00A86B]");
          }
        } else if (progress >= t.end) {
          step.classList.remove("active");
          step.classList.add("past");
          if (pill) {
            pill.classList.remove("bg-[#00A86B]", "text-white", "shadow-xs");
            pill.classList.add("text-[#00A86B]");
          }
        } else {
          step.classList.remove("active");
          step.classList.remove("past");
          if (pill) {
            pill.classList.remove("bg-[#00A86B]", "text-white", "shadow-xs", "text-[#00A86B]");
            pill.classList.add("text-slate-500");
          }
        }
      });
    }

    // Attach to Lenis scroll AND native window scroll
    lenis.on("scroll", updateLifecycle);
    window.addEventListener("scroll", updateLifecycle, { passive: true });
    window.addEventListener("resize", updateLifecycle);
    updateLifecycle();

    // Smooth navigation anchor interception
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.hash && target.hash.startsWith("#")) {
        const targetEl = document.querySelector(target.hash);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, { offset: -70 });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off("scroll", updateLifecycle);
      window.removeEventListener("scroll", updateLifecycle);
      window.removeEventListener("resize", updateLifecycle);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).lenis;
    };
  }, []);

  // 2. ARCHITECTURE DEF-GRID ANIMATION (FROM DESIGN.EXAMPLE)
  useEffect(() => {
    const grid = document.getElementById("def-grid");
    const line = document.getElementById("def-line-fill");
    const steps = grid?.querySelectorAll<HTMLElement>(".def-step");
    if (!grid || !line || !steps) return;

    // Initial state: subdue all
    steps.forEach((s) => s.classList.add("def-inactive"));

    function activateStep(index: number) {
      if (!line || !steps) return;
      const percentage = index === 0 ? 0 : (index / (steps.length - 1)) * 100;
      line.style.width = percentage + "%";

      steps.forEach((step, i) => {
        if (i === index) {
          step.classList.add("def-active");
          step.classList.remove("def-inactive");
        } else {
          step.classList.remove("def-active");
          step.classList.add("def-inactive");
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let current = 0;
          activateStep(0);

          const interval = setInterval(() => {
            current++;
            if (current >= steps.length) {
              clearInterval(interval);
            } else {
              activateStep(current);
            }
          }, 1000);

          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(grid);

    steps.forEach((step, i) => {
      step.addEventListener("mouseenter", () => activateStep(i));
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleNavTo = (hash: string) => {
    const el = document.querySelector(hash);
    if (el && lenisRef.current) {
      lenisRef.current.scrollTo(el as HTMLElement, { offset: -70 });
    }
  };

  const scrollToLifecycleStage = (index: number) => {
    const section = document.getElementById("decision-lifecycle");
    if (!section || !lenisRef.current) return;
    const rect = section.getBoundingClientRect();
    const currentScroll = window.scrollY;
    const sectionTop = currentScroll + rect.top;
    const windowH = window.innerHeight;
    const travel = rect.height - windowH;
    const targetProgress = [0.10, 0.26, 0.42, 0.58, 0.74, 0.90][index] || 0;
    const targetScrollY = sectionTop + targetProgress * travel;
    lenisRef.current.scrollTo(targetScrollY, { duration: 1.0 });
  };

  return (
    <div className="w-full relative bg-[#F7F7F2] text-[#111111] font-secondary selection:bg-[#A2E4B8] selection:text-[#0A504A] overflow-x-clip min-h-screen">
      {/* 1. BACKGROUND LAYERS */}
      <div className="fixed inset-0 z-0 technical-grid pointer-events-none" />
      <ThreeBackground />

      {/* 2. FIXED HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 md:px-12 flex justify-between items-center bg-[#F7F7F2]/90 backdrop-blur-md border-b border-[#0A504A]/10 transition-all duration-300">
        {/* Brand: Raw transparent icon without background or shadow, generous letter spacing */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/icon.png"
            alt="WAPPX"
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-primary text-lg font-semibold tracking-[-0.01em] text-[#0A504A] pl-1">
            WAPP<span className="text-[#00A86B]">X</span>
          </span>
        </Link>

        {/* Navigation Links with Lenis Smooth Scrolling */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavTo("#features")}
            className="text-xs font-semibold text-slate-500 hover:text-[#0A504A] transition-colors cursor-pointer"
          >
            Platform
          </button>
          <button
            onClick={() => handleNavTo("#decision-lifecycle")}
            className="text-xs font-semibold text-slate-500 hover:text-[#0A504A] transition-colors cursor-pointer"
          >
            Lifecycle
          </button>
          <button
            onClick={() => handleNavTo("#architecture")}
            className="text-xs font-semibold text-slate-500 hover:text-[#0A504A] transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <button
            onClick={() => handleNavTo("#pricing")}
            className="text-xs font-semibold text-slate-500 hover:text-[#0A504A] transition-colors cursor-pointer"
          >
            Pricing
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">

          {authSession ? (
            <button
              onClick={onGoToDashboard || onOpenLogin}
              className="flex items-center gap-2 bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer"
            >
              <span>{authSession.role === "admin" ? "Admin Console" : "Open Workspace"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="hidden sm:block text-xs font-bold text-[#0A504A] hover:text-[#00A86B] transition-colors px-3 py-1.5 cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={onOpenLogin}
                className="group relative isolate overflow-hidden bg-[#0A504A] text-xs font-bold px-5 py-2.5 rounded-full shadow-sm ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.03] hover:bg-[#00A86B] text-white cursor-pointer"
              >
                <div className="shimmer-layer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                <span className="relative z-20">Start Free</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. CONTENT WRAPPER */}
      <div className="z-10 flex flex-col w-full relative">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="relative min-h-[90vh] flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 lg:px-20 pt-32 pb-20 gap-16">
          <div className="max-w-2xl space-y-8 relative z-10">
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A504A]/15 shadow-2xs bg-white">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                <span className="text-[11px] font-bold text-[#0A504A] tracking-tight">
                  Official WhatsApp Cloud Business Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-primary text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-[#0A504A] leading-[1.05]">
                WAPP
                <span className="text-[#00A86B]">X</span>
                <br />
                <span className="text-slate-400 font-light text-4xl md:text-6xl lg:text-7xl tracking-tight">
                  Automation.
                </span>
              </h1>

              {/* Description */}
              <p className="max-w-xl text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                The visual flow builder and live customer intelligence platform for WhatsApp.
                Connect your business phone in minutes, automate 24/7 customer journeys, and
                escalate to live human agents with zero message loss.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={authSession ? onGoToDashboard : onOpenLogin}
                className="group relative isolate overflow-hidden bg-[#0A504A] text-xs md:text-sm font-bold px-7 py-3.5 rounded-full shadow-md transition-all duration-300 hover:scale-[1.03] hover:bg-[#00A86B] active:scale-[0.98] flex items-center gap-2 text-white cursor-pointer"
              >
                <div className="shimmer-layer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
                <span className="relative z-10">
                  {authSession ? "Open Workspace" : "Request Free Demo"}
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onQuickStartSimulator}
                className="px-6 py-3.5 text-[#0A504A] border border-[#0A504A]/20 text-xs md:text-sm font-bold rounded-full shadow-2xs transition-all duration-300 hover:border-[#00A86B] hover:bg-white active:scale-[0.98] bg-white/70 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#00A86B]" />
                <span>Test Live Simulator</span>
              </button>
            </div>

            {/* Trust Pill */}
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#0A504A] text-white flex items-center justify-center font-bold text-[9px] border-2 border-white">
                  AD
                </span>
                <span className="w-6 h-6 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-bold text-[9px] border-2 border-white">
                  TD
                </span>
                <span className="w-6 h-6 rounded-full bg-[#A2E4B8] text-[#0A504A] flex items-center justify-center font-bold text-[9px] border-2 border-white">
                  ZX
                </span>
              </div>
              <span className="font-medium">
                Trusted by <strong>500+</strong> forward-thinking businesses and digital agencies
              </span>
            </div>
          </div>

          {/* Right Hero Visual: Conversation Logic Graph */}
          <div className="relative w-full max-w-lg aspect-square lg:aspect-[4/3] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#A2E4B8]/20 to-transparent blur-3xl rounded-full" />
            <div className="premium-card w-full h-full p-6 relative overflow-hidden rounded-2xl bg-white border border-[#0A504A]/10 shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A86B] to-[#A2E4B8]" />

              <div className="h-full w-full flex flex-col justify-between">
                {/* Visual Header */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#0A504A]">
                      WhatsApp Conversation Logic Graph
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#A2E4B8]/30 text-[10px] font-bold text-[#0A504A]">
                    Live Connection
                  </span>
                </div>

                {/* SVG Visual Node Graph */}
                <div className="flex-1 relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 260">
                    <path d="M50,130 C100,130 110,60 170,60" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                    <path d="M50,130 C100,130 110,200 170,200" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                    <path d="M170,60 C230,60 230,100 270,100" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                    <path d="M170,200 C230,200 230,160 270,160" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                    <path d="M270,100 L340,130" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                    <path d="M270,160 L340,130" fill="none" stroke="#E5E5E5" strokeWidth="2" />

                    {/* Animated Pulsing Signal Path */}
                    <path
                      d="M50,130 C100,130 110,60 170,60 C230,60 230,100 270,100 L340,130"
                      fill="none"
                      stroke="#00A86B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="signal-path"
                    />

                    {/* Inbound Node */}
                    <circle cx="50" cy="130" r="7" fill="#0A504A" />
                    <text x="50" y="155" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0A504A">
                      Inbound
                    </text>

                    {/* Intent Node */}
                    <rect x="130" y="48" width="80" height="24" rx="6" fill="white" stroke="#00A86B" strokeWidth="1.5" />
                    <text x="170" y="64" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0A504A">
                      Intent Filter
                    </text>

                    {/* AI Logic Node */}
                    <rect x="130" y="188" width="80" height="24" rx="6" fill="#F7F7F2" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="170" y="204" textAnchor="middle" fontSize="9" fill="#64748b">
                      Catalog Check
                    </text>

                    {/* Customer CRM Node */}
                    <rect x="235" y="88" width="80" height="24" rx="6" fill="white" stroke="#0A504A" strokeWidth="1.5" />
                    <text x="275" y="104" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0A504A">
                      Customer CRM
                    </text>

                    {/* Outcome Node */}
                    <circle cx="340" cy="130" r="14" fill="#00A86B" />
                    <path d="M335 130 l4 4 l7 -7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <text x="340" y="160" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0A504A">
                      Delivered
                    </text>
                  </svg>

                  {/* Floating Pill Badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A504A] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg text-white flex items-center gap-1.5 border border-white/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A2E4B8]" />
                    <span>Resolution: 99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* LOGOS / INTEGRATION PARTNERS                                              */}
        {/* ========================================================================= */}
        <section className="border-y border-[#0A504A]/10 py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-xs font-bold text-[#0A504A] uppercase tracking-wider whitespace-nowrap md:w-auto w-full text-center md:text-left">
              INTEGRATED ARCHITECTURE
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-10 gap-y-6 opacity-65 hover:opacity-100 transition-opacity">
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">META CLOUD PLATFORM</span>
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">SHOPIFY COMMERCE</span>
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">STRIPE PAYMENTS</span>
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">WOOCOMMERCE</span>
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">SALESFORCE</span>
              <span className="text-sm font-bold text-[#0A504A] tracking-tight">HUBSPOT</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PINNED STICKY SCROLL LIFECYCLE (FAITHFUL IMPLEMENTATION FROM DESIGN.EXAMPLE)*/}
        {/* ========================================================================= */}
        <section
          id="decision-lifecycle"
          className="relative w-full bg-[#F7F7F2] border-b border-[#0A504A]/10"
          style={{ height: "300vh" }}
        >
          <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col items-center justify-between pt-20 pb-6 px-4 md:px-8">
            {/* Background Dot Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0A504A0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Header: Crisp, prominent and always visible */}
            <div id="lifecycle-header" className="text-center shrink-0 mb-1 md:mb-3 z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] text-[11px] font-bold tracking-wider uppercase mb-1 shadow-2xs">
                <Radio className="w-3.5 h-3.5 text-[#00A86B] animate-pulse" />
                <span>Traceability Lifecycle Engine</span>
              </div>
              <h2 className="font-primary text-2xl md:text-3xl font-medium text-[#0A504A] tracking-tight">
                Message Automation Lifecycle
              </h2>
              <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto mt-0.5">
                From initial customer inquiry to verified enterprise delivery in milliseconds.
              </p>
            </div>

            {/* Central Track & Steps Container */}
            <div className="relative w-full max-w-3xl flex-1 flex flex-col justify-center my-auto">
              {/* Static Background Conduit Track */}
              <div className="absolute left-1/2 top-3 bottom-3 w-[2px] bg-slate-200/90 -translate-x-1/2 rounded-full" />

              {/* Animated Glowing Fill Line */}
              <div
                id="lifecycle-line"
                className="absolute left-1/2 top-3 w-[2.5px] bg-gradient-to-b from-[#00A86B] via-[#00A86B] to-[#0A504A] -translate-x-1/2 rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(0,168,107,0.4)]"
                style={{ height: "0%" }}
              />

              {/* 6 Lifecycle Steps with explicit CSS class hooks */}
              <div className="space-y-5 md:space-y-6 py-2 relative">
                {/* Step 1 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.04"
                >
                  <div className="w-[42%] text-right pr-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      01 Context
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Inbound Customer Message
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      Customer initiates conversation with a high-intent product inquiry.
                    </p>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <div className="step-card p-2.5 rounded-xl shadow-2xs inline-block text-left">
                      <span className="text-xs font-semibold text-[#0A504A]">
                        &ldquo;Can I upgrade to the enterprise plan today?&rdquo;
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.19"
                >
                  <div className="w-[42%] text-right pr-6">
                    <div className="step-card p-2.5 rounded-xl shadow-2xs inline-block text-left">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Requirement Detected</span>
                      <span className="text-xs font-semibold text-[#0A504A]">
                        High-volume automated catalog support
                      </span>
                    </div>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      02 Input
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Intent Categorization
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      Visual flow engine classifies inquiry and extracts user parameters.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.35"
                >
                  <div className="w-[42%] text-right pr-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      03 Data
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Live CRM & Inventory Sync
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      Queries live account loyalty tier and stock levels &lt; 10ms.
                    </p>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <div className="step-card p-2.5 rounded-xl shadow-2xs inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                      <span className="text-xs font-bold text-[#0A504A]">Customer CRM: Active VIP</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.51"
                >
                  <div className="w-[42%] text-right pr-6">
                    <div className="step-card p-2.5 rounded-xl shadow-2xs inline-block text-left">
                      <span className="text-xs font-semibold text-[#0A504A]">
                        Tailored catalog cards with instant checkout buttons
                      </span>
                    </div>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      04 Logic
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Flow Decision Branching
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      Automated decision nodes connect customer context to resolution.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.67"
                >
                  <div className="w-[42%] text-right pr-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      05 Result
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Instant Delivery
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      WhatsApp message delivered with official Meta Cloud API 200 OK receipt.
                    </p>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A504A] text-xs font-bold shadow-md text-white">
                      <span>Delivered (&lt; 250ms)</span>
                      <Check className="w-3.5 h-3.5 text-[#A2E4B8]" />
                    </span>
                  </div>
                </div>

                {/* Step 6 */}
                <div
                  className="lifecycle-step group flex items-center justify-between w-full"
                  data-threshold="0.83"
                >
                  <div className="w-[42%] text-right pr-6">
                    <span className="font-mono text-[10px] text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 inline-block font-semibold">
                      TRACE: WAPPX-9821
                    </span>
                  </div>
                  <div className="relative shrink-0 z-10">
                    <div className="step-dot" />
                  </div>
                  <div className="w-[42%] pl-6">
                    <span className="step-num font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                      06 Audit
                    </span>
                    <h3 className="step-title text-sm md:text-base font-bold">
                      Immutable Record
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                      Audit history and conversation notes preserved permanently in CRM.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Interactive Stage Jump Pills */}
            <div className="shrink-0 z-20 flex flex-wrap justify-center items-center gap-1.5 md:gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs max-w-full">
              {[
                { label: "01 Inbound", idx: 0 },
                { label: "02 Intent", idx: 1 },
                { label: "03 CRM Sync", idx: 2 },
                { label: "04 Flow Logic", idx: 3 },
                { label: "05 Instant Pay", idx: 4 },
                { label: "06 Audit Trail", idx: 5 },
              ].map((stage) => (
                <button
                  key={stage.idx}
                  onClick={() => scrollToLifecycleStage(stage.idx)}
                  className="lifecycle-nav-pill text-[10px] md:text-xs px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer text-slate-500 hover:text-[#0A504A]"
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BENTO GRID: STRUCTURED AUTOMATION FEATURES                                */}
        {/* ========================================================================= */}
        <section id="features" className="py-28 px-6 md:px-12 lg:px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-xl">
                <span className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider block mb-2">
                  Engine Architecture
                </span>
                <h2 className="font-primary text-3xl md:text-5xl font-medium text-[#0A504A] tracking-tight leading-[1.1]">
                  Visual Automation.
                  <span className="text-slate-400 block font-light text-2xl md:text-4xl mt-1">
                    Defensible & Scalable.
                  </span>
                </h2>
              </div>
              <button
                onClick={onQuickStartSimulator}
                className="pb-1 border-b-2 border-[#0A504A] text-xs font-bold text-[#0A504A] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Card 1: Visual Flow Lineage (Span 8) */}
              <div className="md:col-span-8 group relative border border-slate-200 rounded-2xl overflow-hidden hover:border-[#00A86B] transition-all duration-500 bg-[#F7F7F2]/50 p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-white border border-[#0A504A]/10 rounded-xl flex items-center justify-center mb-6 text-[#0A504A] shadow-xs">
                    <GitBranch className="w-5 h-5 text-[#00A86B]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-[#0A504A] mb-2 font-primary">
                    Visual Flow Builder
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 max-w-lg leading-relaxed">
                    Build complex branching conversation graphs. Add interactive buttons, media messages,
                    webhook integrations, and conditional logic with zero coding required.
                  </p>
                </div>

                {/* Visual Diagram */}
                <div className="mt-8 pt-6 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                    <span>NODE ENGINE TRACE</span>
                    <span className="text-[#00A86B] font-bold">CONNECTED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#00A86B]" />
                        Start Node
                      </div>
                      <p className="text-xs font-bold text-[#0A504A] mt-1">Order Query</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#0A504A]" />
                        Catalog Step
                      </div>
                      <p className="text-xs font-bold text-[#0A504A] mt-1">Show 3 Items</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#A2E4B8]" />
                        Checkout
                      </div>
                      <p className="text-xs font-bold text-[#0A504A] mt-1">Instant Pay</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Immutable Audit & Realtime CRM (Span 4) */}
              <div className="md:col-span-4 group relative border border-slate-200 rounded-2xl overflow-hidden hover:border-[#00A86B] transition-all duration-500 bg-[#F7F7F2]/50 p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-white border border-[#0A504A]/10 rounded-xl flex items-center justify-center mb-6 text-[#0A504A] shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-[#00A86B]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A504A] mb-2 font-primary">
                    Realtime CRM
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customer contacts, VIP tags, internal agent notes, and delivery statuses synchronized in real-time across your entire team.
                  </p>
                </div>

                {/* Audit Pill Stack */}
                <div className="mt-8 space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0A504A]">Delivery SLA</span>
                    <span className="text-[#00A86B] font-mono font-bold">&lt; 250ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0A504A]">Audit Trail</span>
                    <span className="text-slate-400 font-mono">100% Traceable</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Multi-Agent Dispatch (Span 12) */}
              <div className="md:col-span-12 group relative border border-slate-200 rounded-2xl overflow-hidden hover:border-[#00A86B] transition-all duration-500 bg-[#F7F7F2]/50 p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl">
                    <div className="w-10 h-10 bg-white border border-[#0A504A]/10 rounded-xl flex items-center justify-center mb-4 text-[#0A504A] shadow-xs">
                      <Users className="w-5 h-5 text-[#00A86B]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0A504A] mb-2 font-primary">
                      Multi-Agent Live Inbox & Simulator
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      Instant agent handoff notifications. When a user requests human assistance, WAPPX alerts
                      your team immediately while retaining the full conversational history. Test everything inside our built-in simulator.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={onQuickStartSimulator}
                      className="px-5 py-2.5 rounded-xl bg-[#0A504A] text-white text-xs font-bold hover:bg-[#00A86B] transition-colors cursor-pointer"
                    >
                      Try WhatsApp Simulator
                    </button>
                    <button
                      onClick={onOpenGuide}
                      className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-[#0A504A] text-xs font-bold hover:border-[#00A86B] transition-colors cursor-pointer"
                    >
                      View Setup Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW A CONVERSATION BECOMES FLAWLESS (DEF-GRID FROM DESIGN.EXAMPLE)        */}
        {/* ========================================================================= */}
        <section id="architecture" className="py-24 px-6 md:px-12 lg:px-20 border-b border-[#0A504A]/10 bg-[#F7F7F2]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="font-primary text-3xl font-medium text-[#0A504A] tracking-tight mb-3">
                  How WhatsApp Messaging Becomes Flawless
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  WAPPX preserves the entire customer lifecycle from initial webhook arrival to instant response, ensuring zero rate-limit bans and 100% auditability.
                </p>
              </div>
            </div>

            <div className="relative w-full">
              {/* Dynamic Connecting Line (Desktop) */}
              <div className="absolute top-[1.125rem] left-0 right-0 h-px bg-slate-300 hidden lg:block z-0">
                <div id="def-line-fill" className="h-full bg-[#00A86B] w-0 transition-all duration-700 ease-in-out" />
              </div>

              <div id="def-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12 relative z-10">
                {[
                  { num: "01", title: "Inbound Hook", desc: "Signed webhook with secure encryption secret." },
                  { num: "02", title: "Intent Map", desc: "Flow builder executes instant keyword branch." },
                  { num: "03", title: "Catalog Linked", desc: "Products and prices fetched in real-time." },
                  { num: "04", title: "Bot Logic", desc: "Quick-reply buttons & templates generated." },
                  { num: "05", title: "Instant Delivery", desc: "Delivered directly into customer's WhatsApp app." },
                  { num: "06", title: "Live Audited", desc: "Delivery receipts stored in real-time CRM audit history." },
                ].map((item, idx) => (
                  <div key={idx} className="def-step group flex flex-col gap-4 def-inactive cursor-pointer" data-index={idx}>
                    <div className="flex items-center gap-4">
                      <div className="def-num w-9 h-9 border border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 shadow-2xs transition-all duration-500 z-10 bg-white">
                        {item.num}
                      </div>
                      <div className="h-px flex-1 bg-slate-300 lg:hidden" />
                    </div>
                    <div className="def-content transition-all duration-500">
                      <h3 className="text-sm font-bold text-[#0A504A] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TESTIMONIALS & STATS (DARK SECTION)                                      */}
        {/* ========================================================================= */}
        <section className="py-28 bg-[#0A504A] relative overflow-hidden text-white">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[11px] font-bold text-[#A2E4B8] uppercase tracking-wider block mb-4">
                  Customer Success Stories
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-snug">
                  &ldquo;{currentTestimonial.quote}&rdquo;
                </h2>

                <div className="flex items-center gap-4 mb-10">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#A2E4B8]"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">
                      {currentTestimonial.author}
                    </div>
                    <div className="text-xs text-[#A2E4B8]">
                      {currentTestimonial.role}
                    </div>
                  </div>
                </div>

                {/* Slider Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setTestimonialIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1))
                    }
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setTestimonialIndex((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0))
                    }
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Stats Column */}
              <div className="flex flex-row md:flex-col justify-between gap-6 md:gap-0 md:space-y-12 border-t md:border-t-0 md:border-l pt-8 md:pt-0 md:pl-16 border-white/15">
                {currentTestimonial.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-4xl font-bold mb-1 text-white tracking-tight">
                      {stat.val}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-[#A2E4B8] font-bold">
                      {stat.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TRANSPARENT PRICING                                                       */}
        {/* ========================================================================= */}
        <section id="pricing" className="py-28 px-6 md:px-12 lg:px-20 border-b border-[#0A504A]/10 bg-[#F7F7F2]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider block mb-2">
                Transparent SaaS Plans
              </span>
              <h2 className="font-primary text-3xl md:text-4xl font-medium text-[#0A504A] tracking-tight mb-4">
                Scale Your WhatsApp Engine
              </h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Connect your business phone today. Choose a plan tailored for your message volume.
              </p>

              {/* Monthly / Yearly Toggle */}
              <div className="mt-6 inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300">
                <button
                  onClick={() => setIsYearlyBilling(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !isYearlyBilling
                      ? "bg-[#0A504A] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0A504A]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearlyBilling(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isYearlyBilling
                      ? "bg-[#0A504A] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0A504A]"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00A86B] text-white font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Individual / Starter */}
              <div
                onClick={() => setSelectedPricing("hobby")}
                className={`p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  selectedPricing === "hobby"
                    ? "bg-white border-[#00A86B] shadow-xl scale-[1.02] ring-2 ring-[#00A86B]/20"
                    : "bg-white/70 border-slate-200 opacity-75 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[#0A504A]">Starter</span>
                  </div>
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0A504A]">
                      {isYearlyBilling ? "$39" : "$49"}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Ideal for small businesses and stores automating first customer responses.
                  </p>
                  <ul className="space-y-3 mb-8 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>1 WhatsApp Business Number</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Up to 5 Visual Flow Nodes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Live Inbox (1 Agent Seat)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>WhatsApp Simulator</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0A504A] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-pointer"
                >
                  Start Free Trial
                </button>
              </div>

              {/* Pro / Recommended */}
              <div
                onClick={() => setSelectedPricing("pro")}
                className={`p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  selectedPricing === "pro"
                    ? "bg-[#0A504A] text-white shadow-2xl scale-[1.04] ring-2 ring-[#00A86B]"
                    : "bg-[#0A504A]/90 text-white/90"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[#A2E4B8]">Growth Pro</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A86B] text-white">
                      Popular
                    </span>
                  </div>
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      {isYearlyBilling ? "$119" : "$149"}
                    </span>
                    <span className="text-xs text-white/60">/mo</span>
                  </div>
                  <p className="text-xs text-white/75 mb-6 leading-relaxed">
                    For growing brands needing high-volume catalog routing, webhooks & multi-agent support.
                  </p>
                  <ul className="space-y-3 mb-8 text-xs text-white/90">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#A2E4B8]" />
                      <span>Unlimited WhatsApp Numbers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#A2E4B8]" />
                      <span>Unlimited Visual Flow Nodes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#A2E4B8]" />
                      <span>Multi-Agent Live Inbox (5 Seats)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#A2E4B8]" />
                      <span>Custom Inbound Webhook Verify Token</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#A2E4B8]" />
                      <span>Priority Support & SLA</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="w-full py-3 rounded-xl bg-[#00A86B] hover:bg-[#008f5a] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Get Started with Pro
                </button>
              </div>

              {/* Enterprise */}
              <div
                onClick={() => setSelectedPricing("ent")}
                className={`p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  selectedPricing === "ent"
                    ? "bg-white border-[#00A86B] shadow-xl scale-[1.02] ring-2 ring-[#00A86B]/20"
                    : "bg-white/70 border-slate-200 opacity-75 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[#0A504A]">Enterprise / Agency</span>
                  </div>
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0A504A]">Custom</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    White-label tenant provisioning, dedicated cloud database cluster, and custom CRM integration.
                  </p>
                  <ul className="space-y-3 mb-8 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Multi-Tenant White-Label Workspaces</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Dedicated Webhook Endpoints</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Unlimited Agent Seats</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00A86B]" />
                      <span>Dedicated Technical Account Manager</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0A504A] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER & CREATOR CREDITS                                                  */}
        {/* ========================================================================= */}
        <footer className="py-16 px-6 md:px-12 lg:px-20 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col md:flex-row justify-between gap-12">
              <div className="max-w-xs space-y-4">
                <div className="flex items-center gap-3">
                  <img src="/icon.png" alt="WAPPX" className="w-7 h-7 object-contain" />
                  <span className="font-primary font-semibold text-lg tracking-[-0.01em] text-[#0A504A] pl-1">
                    WAPP<span className="text-[#00A86B]">X</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The visual WhatsApp business automation engine for forward-thinking enterprises.
                </p>
                <div className="text-[11px] text-slate-400">
                  Official WhatsApp Cloud Business Architecture.
                </div>
              </div>

              <div className="flex gap-16">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#0A504A] uppercase tracking-wider">
                    Platform
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li>
                      <button onClick={() => handleNavTo("#features")} className="hover:text-[#0A504A] cursor-pointer">
                        Flow Builder
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleNavTo("#features")} className="hover:text-[#0A504A] cursor-pointer">
                        Live Inbox
                      </button>
                    </li>
                    <li>
                      <button onClick={onQuickStartSimulator} className="hover:text-[#0A504A] cursor-pointer">
                        Simulator
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleNavTo("#pricing")} className="hover:text-[#0A504A] cursor-pointer">
                        Pricing
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#0A504A] uppercase tracking-wider">
                    Resources
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li>
                      <button onClick={onOpenGuide} className="hover:text-[#0A504A] cursor-pointer text-left">
                        Setup Guide (Bilingual)
                      </button>
                    </li>
                    <li>
                      <button onClick={onOpenLogin} className="hover:text-[#0A504A] cursor-pointer text-left">
                        Sign In
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleNavTo("#architecture")} className="hover:text-[#0A504A] cursor-pointer">
                        Architecture
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Credits Bar */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>&copy; {new Date().getFullYear()} WAPPX Inc. All rights reserved.</p>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A2E4B8]/20 border border-[#A2E4B8]/40 text-[#0A504A] text-xs font-medium shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>
                  Designed and developed by <strong className="font-bold text-[#0A504A]">THARUUX</strong> , with <strong className="font-bold text-[#0A504A]">ZYNEX Developments</strong>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
