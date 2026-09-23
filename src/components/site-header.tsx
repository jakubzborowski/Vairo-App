"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Jak to działa?", href: "#jak-to-dziala" },
  { label: "Dla kogo?", href: "#dla-kogo" },
  { label: "O nas", href: "#o-nas" },
] as const;

type NavHref = (typeof navItems)[number]["href"];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavHref>("#home");
  const lockUntil = useRef(0);

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.slice(1));

    const syncFromScroll = () => {
      if (Date.now() < lockUntil.current) return;

      const offset = 120;
      let current: NavHref = "#home";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) {
          current = `#${id}` as NavHref;
        }
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    const syncFromHash = () => {
      const hash = (window.location.hash || "#home") as NavHref;
      if (navItems.some((item) => item.href === hash)) {
        lockUntil.current = Date.now() + 800;
        setActive(hash);
      }
    };

    syncFromHash();
    syncFromScroll();

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("scroll", syncFromScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("scroll", syncFromScroll);
    };
  }, []);

  const activate = useCallback((href: NavHref) => {
    lockUntil.current = Date.now() + 800;
    setActive(href);

    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", "#home");
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#060608]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-9 lg:flex">
          {navItems.map((item) => {
            const isActive = active === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.href === "#home") e.preventDefault();
                  activate(item.href);
                }}
                className={cn(
                  "relative py-2 text-[14px] text-white/65 transition-colors hover:text-white",
                  isActive && "font-medium text-vairo"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-[2px] left-0 h-[2px] w-full rounded-full bg-vairo" />
                )}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3.5 sm:flex">
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-full border border-white/20 px-3.5 text-[13px] font-medium text-white/85 transition hover:border-white/40 hover:bg-white/5"
            aria-label="Zmień język"
          >
            PL
          </button>
          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-[14px] font-medium text-white/70 transition hover:text-white"
          >
            Zaloguj się
          </a>
          <a
            href="/start"
            className="btn-vairo inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white transition"
          >
            Dołącz do alfy
            <span aria-hidden className="text-[12px]">
              ›
            </span>
          </a>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-[#060608] px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#home") e.preventDefault();
                    activate(item.href);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-base text-white/80",
                    isActive && "bg-white/5 text-vairo"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm font-medium text-white"
            >
              PL
            </button>
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[14px] font-medium text-white/70"
            >
              Zaloguj się
            </a>
            <a
              href="/start"
              onClick={() => setOpen(false)}
              className="btn-vairo inline-flex h-11 flex-1 items-center justify-center rounded-full text-[15px] font-semibold text-white"
            >
              Dołącz do alfy ›
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
