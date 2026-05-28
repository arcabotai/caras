"use client";

import { Suspense } from "react";
import { SearchPageInner } from "./search-inner";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
