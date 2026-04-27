"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load content (better performance + fixes hydration edge cases)
const BlackCabContent = dynamic(() => import("./BlackCabContent"), {
  ssr: false,
});

export default function BlackCabPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
          Loading Black Cab...
        </main>
      }
    >
      <BlackCabContent />
    </Suspense>
  );
}