"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { LoginModal } from "@/components/auth/LoginModal";
import { SetupGuideModal } from "@/components/guide/SetupGuideModal";
import {
  getStoredSession,
  saveStoredSession,
  isSuperAdmin,
  AuthUser,
} from "@/lib/auth-session";

export default function Home() {
  const router = useRouter();
  const [authSession, setAuthSession] = useState<AuthUser | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setAuthSession(session);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    saveStoredSession(user);
    setAuthSession(user);
    setIsLoginOpen(false);

    if (isSuperAdmin(user)) {
      router.push("/admin");
    } else {
      router.push("/app");
    }
  };

  const handleGoToDashboard = () => {
    if (!authSession) {
      setIsLoginOpen(true);
      return;
    }
    if (isSuperAdmin(authSession)) {
      router.push("/admin");
    } else {
      router.push("/app");
    }
  };

  const handleQuickStartSimulator = () => {
    if (authSession) {
      router.push("/app?tab=simulator");
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <LandingPage
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onQuickStartSimulator={handleQuickStartSimulator}
        authSession={authSession}
        onGoToDashboard={handleGoToDashboard}
      />

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Bilingual Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        verifyToken="zynex_meta_webhook_secret_2026"
        webhookUrl="https://zynexwpp.loca.lt/api/webhook"
      />
    </>
  );
}
