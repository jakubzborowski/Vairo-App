"use client";

import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#home"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        history.replaceState(null, "", "#home");
      }}
      className={cn("inline-flex items-center", className)}
    >
      <BrandLogo height={34} priority />
    </a>
  );
}
