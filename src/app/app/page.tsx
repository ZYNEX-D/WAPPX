"use client";

import React, { Suspense } from "react";
import { ClientWorkspace } from "@/components/workspace/ClientWorkspace";

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F2] flex items-center justify-center font-secondary">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#0A504A]/20 border-t-[#00A86B] rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#0A504A]">Loading WAPPX Workspace...</p>
          </div>
        </div>
      }
    >
      <ClientWorkspace />
    </Suspense>
  );
}
