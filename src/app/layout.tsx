import type { Metadata, Viewport } from "next";
import { Michroma, Onest } from "next/font/google";
import "./globals.css";

const michroma = Michroma({
  weight: "400",
  variable: "--font-michroma",
  subsets: ["latin"],
  display: "swap",
});

const onest = Onest({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0A504A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wappx.zynexdev.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "WAPPX — WhatsApp Business Automation & CRM Engine",
    template: "%s | WAPPX",
  },
  description:
    "Transform WhatsApp into an automated sales, CRM, and customer support machine. Official Meta Cloud API v22.0 integration, visual drag-and-drop flow builder, real-time live chat inbox, and automated order routing.",
  applicationName: "WAPPX",
  authors: [{ name: "ZYNEX Developments", url: "https://zynexdevelopments.com" }],
  generator: "Next.js",
  keywords: [
    "WhatsApp Business Automation",
    "WhatsApp CRM",
    "WhatsApp Cloud API v22.0",
    "Visual Flow Builder WhatsApp",
    "WhatsApp Chatbot Builder",
    "Multi-Agent WhatsApp Live Chat",
    "WhatsApp Order Management",
    "WhatsApp Automation Sri Lanka",
    "Meta Cloud API Webhook",
    "ZYNEX Developments WAPPX",
    "Customer Engagement Automation",
    "Conversational Commerce WhatsApp",
  ],
  referrer: "origin-when-cross-origin",
  creator: "ZYNEX Developments",
  publisher: "ZYNEX Developments",
  category: "business",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WAPPX — WhatsApp Business Automation & CRM Engine",
    description:
      "Scale customer conversations, automate order processing, and streamline Meta Cloud WhatsApp workflows with visual flow automation and multi-agent CRM.",
    url: APP_URL,
    siteName: "WAPPX",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WAPPX — WhatsApp Business Automation & CRM Engine",
    description:
      "Scale customer conversations, automate order processing, and streamline Meta Cloud WhatsApp workflows.",
    creator: "@zynexdev",
    site: "@zynexdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WAPPX",
    url: APP_URL,
    description: "Enterprise-grade WhatsApp Business Automation & CRM Platform",
    publisher: {
      "@type": "Organization",
      name: "ZYNEX Developments",
      url: "https://zynexdevelopments.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WAPPX",
    legalName: "ZYNEX Developments",
    url: APP_URL,
    logo: `${APP_URL}/icon.png`,
    foundingDate: "2026",
    sameAs: ["https://zynexdevelopments.com"],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WAPPX",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Cloud SaaS, Meta WhatsApp Cloud API",
    softwareVersion: "2.2.0",
    description:
      "Enterprise WhatsApp Business Automation & CRM engine featuring visual drag-and-drop conversational workflows, official Meta Cloud API v22.0 connectivity, live multi-agent support inbox, and automated order tracking.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "1500",
        priceCurrency: "LKR",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: `${APP_URL}#pricing`,
      },
      {
        "@type": "Offer",
        name: "Pro Business Plan",
        price: "2700",
        priceCurrency: "LKR",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: `${APP_URL}#pricing`,
      },
      {
        "@type": "Offer",
        name: "Enterprise Scale Plan",
        price: "4200",
        priceCurrency: "LKR",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: `${APP_URL}#pricing`,
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is WAPPX?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WAPPX is an enterprise-grade WhatsApp Business Automation and CRM platform powered by the official Meta Cloud API v22.0. It provides visual flow building, automated customer responses, catalog order management, and live multi-agent chat.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need coding skills to build WhatsApp workflows in WAPPX?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No coding skills are required. WAPPX includes an intuitive visual drag-and-drop canvas to build branching logic, buttons, list menus, and customer journeys with zero code.",
        },
      },
      {
        "@type": "Question",
        name: "What currency are WAPPX subscription plans priced in?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WAPPX plans are priced transparently in Sri Lankan Rupees (LKR) starting at Rs. 1,500/month for Starter, Rs. 2,700/month for Pro Business, and Rs. 4,200/month for Enterprise Scale, with a 20% discount on yearly billing.",
        },
      },
      {
        "@type": "Question",
        name: "Does WAPPX support official Meta Cloud API v22.0?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, WAPPX is fully built on official Meta Cloud API v22.0 webhooks with 99.9% uptime SLA, verified message delivery, and support for interactive message templates.",
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${michroma.variable} ${onest.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-secondary bg-[#F7F7F2] text-[#0A504A]">
        {children}
      </body>
    </html>
  );
}
