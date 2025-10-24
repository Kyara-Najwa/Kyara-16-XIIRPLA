"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "../../../components/admin/Sidebar";
import Topbar from "../../../components/admin/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Allow login route without guard
    if (pathname === "/admin/login") {
      setAllowed(true);
      return;
    }

    const checkAuth = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;
      if (!session) {
        setAllowed(false);
        router.replace("/admin/login");
        return;
      }
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error || !prof?.is_admin) {
        await supabase.auth.signOut();
        setAllowed(false);
        router.replace("/admin/login");
        return;
      }
      setAllowed(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAllowed(false);
          router.replace("/admin/login");
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .maybeSingle();
          if (error || !prof?.is_admin) {
            await supabase.auth.signOut();
            setAllowed(false);
            router.replace("/admin/login");
          } else {
            setAllowed(true);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // run only once on mount; `pathname` is read at mount and we only special-case /admin/login
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-gray-400">Checking authentication...</div>
        </div>
      </div>
    );
  }
  
  if (allowed === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50">
            <Sidebar variant="mobile" onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ zoom: 0.8 }}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-80 ml-0">
            <Topbar onOpenMenu={() => setMobileOpen(true)} />
            <main className="flex-1 p-4 md:p-8 bg-black">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
