"use client";

import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [brand, setBrand] = useState<string>("Portfolio");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const loadName = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!base || !key) return;
        const url = `${base}/rest/v1/profiles?select=display_name&limit=1`;
        const r = await fetch(url, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
          cache: 'no-store',
        });
        if (!r.ok) return;
        const rows = (await r.json()) as any[];
        const name = rows?.[0]?.display_name;
        if (name) setBrand(String(name));
      } catch {}
    };
    loadName();
  }, []);

  return (
    <nav
      className={
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300 backdrop-blur " +
        (scrolled
          ? "bg-black/75 border-b border-white/15 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"
          : "bg-black/50 border-b border-white/10")
      }
    >
      <div className="max-w-6xl mx-auto px-5 py-5 md:py-6 flex items-center justify-between">
        <a href="/home" className="font-bold tracking-wide text-lg md:text-xl">{brand}</a>
        <div className="flex items-center gap-8 text-base md:text-lg">
          <a href="/home#about" className="hover:underline">About</a>
          <a href="/home#projects" className="hover:underline">Projects</a>
          <a href="/home#contact" className="hover:underline">Contact</a>
        </div>
      </div>
    </nav>
  );
}
