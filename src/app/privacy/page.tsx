import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, Trash2, ArrowLeft, Mail, Globe, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | WAPPX & ZYNEX Developments",
  description: "Official Privacy Policy for WAPPX WhatsApp Cloud, Facebook Messenger, and Instagram Automation by ZYNEX Developments.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F2] text-slate-800 font-secondary flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-[#0A504A] hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to WAPPX Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-primary font-bold text-base tracking-wider text-[#0A504A]">
              WAPP<span className="text-[#00A86B]">X</span>
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-600">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Title Banner */}
        <div className="space-y-4 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#00A86B] text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Meta Platform Compliant &bull; Official Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-primary font-medium text-[#0A504A] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">
            Last Updated: <strong>October 10, 2026</strong> &bull; Effective Date: <strong>January 1, 2025</strong>
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            This Privacy Policy outlines how <strong>ZYNEX Developments</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates 
            <strong> WAPPX</strong> and collects, protects, processes, and respects user information when you interact with our platform, 
            including services connecting to the <strong>Meta WhatsApp Business Cloud API</strong>, <strong>Facebook Messenger Platform</strong>, 
            and <strong>Instagram Graph API</strong>.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-[#0A504A]">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00A86B] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">1. Information We Collect</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you use WAPPX to automate customer engagement or message our connected businesses, we may collect and process the following categories of information:
          </p>
          <ul className="space-y-2.5 text-sm text-slate-600 pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
              <span><strong>Account &amp; Workspace Credentials:</strong> Name, business name, email address, phone number, and encrypted Meta System User access tokens used solely for API authorization.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
              <span><strong>Messaging Data:</strong> Customer phone numbers, WhatsApp User IDs (WAID), Facebook Page-Scoped User IDs (PSID), Instagram Scoped User IDs (IGSID), inbound messages, outbound replies, and media attachments sent to connected channels.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
              <span><strong>Commerce &amp; Catalog Data:</strong> Inquiries relating to products, cart items, order status, and transaction references generated through WhatsApp catalog messages.</span>
            </li>
          </ul>
        </section>

        {/* Section 2: How We Use Your Data */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-[#0A504A]">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0064E0] flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">2. How We Use Information</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use collected data strictly to deliver enterprise-grade messaging and conversational commerce features:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
            <li>To route inbound customer inquiries from WhatsApp, Facebook Messenger, and Instagram to your multi-agent Live Inbox.</li>
            <li>To execute automated chatbot workflows, auto-replies, and AI-assisted responses configured by your team.</li>
            <li>To synchronize customer contact profiles, tag leads, and update order statuses.</li>
            <li>To monitor platform uptime, diagnose delivery webhook issues, and verify API token validity.</li>
          </ul>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong>Zero Advertising / Sale of Data:</strong> We do NOT sell, rent, or monetize your personal or customer data to third-party advertisers, data brokers, or marketing networks.
          </p>
        </section>

        {/* Section 3: Meta Platform Policy Compliance */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-[#0A504A]">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">3. Meta Platform &amp; API Compliance</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            WAPPX adheres strictly to the <strong>Meta Platform Terms</strong>, <strong>Developer Policies</strong>, 
            and <strong>WhatsApp Business Messaging Policies</strong>:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
            <li>Customer data obtained through Meta APIs is used exclusively to facilitate communication between the end user and the business they are contacting.</li>
            <li>Tokens and private keys are stored in secure encrypted vaults with row-level security (RLS).</li>
            <li>We do not transfer or share Meta user data across unrelated client accounts or external third parties.</li>
          </ul>
        </section>

        {/* Section 4: Data Retention & Security */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-[#0A504A]">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">4. Data Retention &amp; Security Measures</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            We employ modern encryption protocols (TLS 1.3 in transit, AES-256 at rest) to safeguard your data. Data is retained 
            only for the duration necessary to provide customer support services or as required by law. Users may request permanent 
            erasure of their records at any time.
          </p>
        </section>

        {/* Section 5: User Rights & Deletion */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-[#0A504A]">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">5. Your Data Rights &amp; Data Deletion</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            You retain full ownership and rights over your data. You may request access to, correction of, or permanent deletion 
            of your stored information at any time.
          </p>
          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-rose-800">Need to delete your data or revoke permissions?</p>
              <p className="text-rose-700 mt-0.5">Visit our official User Data Deletion Instructions page to submit a request or follow in-app steps.</p>
            </div>
            <Link
              href="/data-deletion"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors shrink-0"
            >
              Data Deletion Instructions &rarr;
            </Link>
          </div>
        </section>

        {/* Section 6: Contact Information */}
        <section className="space-y-3 bg-[#0A504A] text-white p-6 sm:p-8 rounded-2xl">
          <h2 className="text-lg font-bold">6. Contact Our Data Protection Team</h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            If you have any questions about this Privacy Policy, your rights, or data practices, please contact us:
          </p>
          <div className="pt-2 space-y-1.5 text-xs text-white">
            <p className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#A2E4B8]" />
              <span><strong>Entity:</strong> ZYNEX Developments (Pvt) Ltd</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#A2E4B8]" />
              <span><strong>Privacy Email:</strong> <a href="mailto:privacy@zynexdev.com" className="underline">privacy@zynexdev.com</a> / <a href="mailto:support@zynexdev.com" className="underline">support@zynexdev.com</a></span>
            </p>
            <p className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#A2E4B8]" />
              <span><strong>Website:</strong> <a href="https://wappx.zynexdev.com" className="underline">https://wappx.zynexdev.com</a></span>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} ZYNEX Developments. All rights reserved. &bull; WAPPX Enterprise Platform</p>
      </footer>
    </div>
  );
}
