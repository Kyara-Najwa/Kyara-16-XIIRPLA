"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { StarsBackground } from "@/components/backgrounds/StarsBackground";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const forceStyling = () => {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="email"], input[type="password"]');
      inputs.forEach((input) => {
        input.style.setProperty('background-color', 'transparent', 'important');
        input.style.setProperty('color', '#d1d5db', 'important');
        input.style.setProperty('-webkit-box-shadow', '0 0 0 1000px transparent inset', 'important');
        input.style.setProperty('-webkit-text-fill-color', '#d1d5db', 'important');
      });
    };

    // Run immediately and after delays
    forceStyling();
    setTimeout(forceStyling, 100);
    setTimeout(forceStyling, 500);
    setTimeout(forceStyling, 1000);

    // Also run on input events
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="email"], input[type="password"]');
    inputs.forEach((input) => {
      input.addEventListener('input', forceStyling);
      input.addEventListener('change', forceStyling);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', forceStyling);
        input.removeEventListener('change', forceStyling);
      });
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr || !data.session) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    const uid = data.session.user.id;
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", uid)
      .maybeSingle();

    if (profErr || !prof?.is_admin) {
      await supabase.auth.signOut();
      setError("Akun ini bukan admin.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
  };

  return (
    <>
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        input[type="email"]:-webkit-autofill,
        input[type="password"]:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: #d1d5db !important;
          background-color: transparent !important;
          background: transparent !important;
          color: #d1d5db !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
        
        input[type="email"],
        input[type="password"] {
          background-color: transparent !important;
          background: transparent !important;
          color: #d1d5db !important;
        }
      `}</style>
      <div
        className="min-h-screen flex items-center justify-center px-4 text-white relative overflow-hidden"
        style={{
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(1000px 500px at 110% 120%, rgba(255,255,255,0.04), transparent 40%)",
        }}
      >
      <StarsBackground 
        starDensity={0.00008}
        allStarsTwinkle={true}
        twinkleProbability={0.5}
        minTwinkleSpeed={0.8}
        maxTwinkleSpeed={1.5}
      />
      
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors z-20"
      >
        ← Back
      </button>

      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-black/20 backdrop-blur-md p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border border-white/30 bg-white/10 mb-6 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/40"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Admin Access</h1>
          <p className="text-sm text-white/70">
            Portfolio Management Panel
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Admin email"
              className="w-full rounded-lg bg-transparent border-2 border-white/40 px-4 py-3 text-gray-300 placeholder-white/60 outline-none focus:border-white/80 transition-colors"
              style={{
                WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                WebkitTextFillColor: '#d1d5db !important',
                backgroundColor: 'transparent !important',
                color: '#d1d5db !important'
              }}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg bg-transparent border-2 border-white/40 px-4 py-3 text-gray-300 placeholder-white/60 outline-none focus:border-white/80 transition-colors"
              style={{
                WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                WebkitTextFillColor: '#d1d5db !important',
                backgroundColor: 'transparent !important',
                color: '#d1d5db !important'
              }}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          
          {/* Primary Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white/10 border border-white/40 text-white py-3 font-medium disabled:opacity-60 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            {loading ? "Authenticating..." : "Access Admin Panel"}
          </button>
        </form>

        <div className="mt-8 text-xs text-white/50 text-center">
          Secure access to portfolio management system
        </div>
      </div>
      </div>
    </>
  );
}
