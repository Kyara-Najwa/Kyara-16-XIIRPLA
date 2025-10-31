"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SearchIcon } from "../icons";

export default function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userInitial, setUserInitial] = useState("K");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const initial = user.email.charAt(0).toUpperCase();
        setUserInitial(initial);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const q = searchParams?.get('q') || '';
    setSearchQuery(q);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-search', { detail: q }));
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-search', { detail: value }));
    }
    const params = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    if (value) params.set('q', value); else params.delete('q');
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <header className="h-16 md:h-20 border-b border-white/10 bg-black flex items-center justify-between px-4 md:px-8 gap-3">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => onOpenMenu && onOpenMenu()}
          className="md:hidden p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25A.75.75 0 014.5 11h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full md:w-80 px-4 md:px-5 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 text-base md:text-lg"
          />
          <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6 pl-2 flex-shrink-0">
        <span className="hidden sm:inline text-gray-300 text-sm md:text-lg">{currentDate}</span>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-base md:text-lg font-medium">{userInitial}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
