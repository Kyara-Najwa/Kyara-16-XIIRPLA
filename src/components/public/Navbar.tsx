"use client";

import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [brand, setBrand] = useState<string>("Portfolio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        const rows = (await r.json()) as Array<{ display_name?: string | null }>;
        const name = rows?.[0]?.display_name;
        if (name) setBrand(String(name));
      } catch {}
    };
    loadName();
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

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
        <a href="/" className="font-bold tracking-wide text-lg md:text-xl">{brand}</a>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-base md:text-lg">
          <a href="/#about" className="hover:underline">About</a>
          <a href="/#projects" className="hover:underline">Projects</a>
          <a href="/#gallery" className="hover:underline">Gallery</a>
          <a href="/#contact" className="hover:underline">Contact</a>
          <a href="/admin" className="hover:underline">Admin</a>
        </div>

        {/* Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 w-6 h-6 justify-center"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-full bg-white transition-all duration-300 ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-full bg-white transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-full bg-white transition-all duration-300 ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 flex flex-col gap-4 text-base border-t border-white/10">
          <a href="/#about" onClick={handleLinkClick} className="hover:underline pt-4">About</a>
          <a href="/#projects" onClick={handleLinkClick} className="hover:underline">Projects</a>
          <a href="/#gallery" onClick={handleLinkClick} className="hover:underline">Gallery</a>
          <a href="/#contact" onClick={handleLinkClick} className="hover:underline">Contact</a>
          <a href="/admin" onClick={handleLinkClick} className="hover:underline">Admin</a>
        </div>
      </div>
    </nav>
  );
}