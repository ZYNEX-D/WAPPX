import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your WAPPX Workspace to access your visual flow automation studio, multi-agent live chat, and WhatsApp Cloud API inbox.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
