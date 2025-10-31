"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Image as ImageIcon } from "lucide-react";
import { HomeIcon, FolderIcon, UserIcon, LogoutIcon } from "../icons";

const nav = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/projects", label: "Projects", icon: FolderIcon },
  { href: "/admin/profile", label: "Profile", icon: UserIcon },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/home", label: "User", icon: LogoutIcon },
];

export default function Sidebar({ variant = 'desktop', onClose }: { variant?: 'desktop' | 'mobile'; onClose?: () => void }) {
  const pathname = usePathname();
  const [userInitial, setUserInitial] = useState("K");
  
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
  
  const isMobile = variant === 'mobile';
  const asideClass = isMobile
    ? "w-72 bg-black h-full flex flex-col fixed inset-y-0 left-0 z-50 border-r border-white/10"
    : "hidden md:flex w-80 bg-black border-r border-white/10 h-screen flex-col fixed";

  return (
    <aside className={asideClass}>
      <div className="h-16 md:h-20 border-b border-white/10 flex items-center px-6 md:px-8 flex-shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">{userInitial}</span>
          </div>
          <span className="text-white font-semibold text-lg">Portfolio Admin</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => onClose && onClose()}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-lg ${
                active 
                  ? 'bg-white text-black' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <IconComponent />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
