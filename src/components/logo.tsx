"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#home"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        history.replaceState(null, "", "#home");
      }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={34}
        height={34}
        priority
        className="size-[34px] object-contain"
      />
      <span className="font-heading text-[1.4rem] font-bold tracking-tight text-white lowercase">
        vairo
      </span>
    </a>
  );
}
