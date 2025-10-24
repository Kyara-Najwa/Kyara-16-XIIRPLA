"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type OwnerContacts = {
  email_contact?: string | null;
  number_contact?: string | null;
  github_url?: string | null;
};

export default function Contact() {
  const [owner, setOwner] = useState<OwnerContacts>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const loadOwner = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!base || !key) return;
        const url = `${base}/rest/v1/profiles?select=email_contact,number_contact,github_url&limit=1`;
        const r = await fetch(url, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
          cache: "no-store",
        });
        if (!r.ok) return;
        const rows = (await r.json()) as Array<{
          email_contact?: string | null;
          number_contact?: string | null;
          github_url?: string | null;
        }>;
        const row = rows?.[0] || {};
        setOwner({
          email_contact: row.email_contact || null,
          number_contact: row.number_contact || null,
          github_url: row.github_url || null,
        });
      } catch (e) {
        console.error(e);
      }
    };
    loadOwner();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setToast({ type: "error", message: "Please fill required fields" });
      return;
    }
    try {
      setLoading(true);
      const res = await supabase.from("contact_messages").insert({
        sender_name: form.name,
        sender_email: form.email,
        message: form.message,
        status: "new",
        created_at: new Date().toISOString(),
      });
      // Debug visibility
      console.log("contact_messages insert response:", res);
      if (res.error) throw res.error;
      // Try to send email to site owner via API route (best-effort)
      if (owner.email_contact) {
        try {
          const r = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: owner.email_contact,
              name: form.name,
              fromEmail: form.email,
              message: form.message,
            }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j?.ok === false) {
            console.warn("contact email failed:", j);
          }
        } catch (e) {
          console.warn("contact email error:", e);
        }
      }

      setForm({ name: "", email: "", message: "" });
      setToast({ type: "success", message: "Message sent successfully" });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to send message";
      setToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative z-10">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 text-white">
        {toast && (
          <div className={`mb-8 p-3 rounded-lg border ${toast.type === "success" ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"}`}>
            <div className="text-sm">{toast.message}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left big message + info */}
          <div className="space-y-8">
            <div className="leading-[0.9] select-none">
              <div className="text-[56px] sm:text-[80px] md:text-[112px] lg:text-[132px] font-semibold tracking-tight">just</div>
              <div className="text-[56px] sm:text-[80px] md:text-[112px] lg:text-[132px] font-semibold tracking-tight">send it<span className="text-white">.</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="border-t border-white/15 pt-3 text-sm text-white/70">You don&apos;t like forms?</div>
                <p className="text-white/80 text-sm">Reach me directly using the channels below.</p>
                <div className="flex flex-wrap gap-3">
                  {owner.email_contact ? (
                    <a href={`mailto:${owner.email_contact}`} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-sm inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.01L12 13l8-6.99V6H4Zm16 12V8l-8 7L4 8v10h16Z"/>
                      </svg>
                      <span>{owner.email_contact}</span>
                    </a>
                  ) : null}
                  {owner.number_contact ? (
                    <a href={`tel:${owner.number_contact}`} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-sm inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V21c0 .55-.45 1-1 1C10.29 22 2 13.71 2 3c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z"/>
                      </svg>
                      <span>{owner.number_contact}</span>
                    </a>
                  ) : null}
                  {owner.github_url ? (
                    <a href={owner.github_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-sm inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 .5C5.73.5.99 5.24.99 11.53c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-1.13-.02-2.05-3.05.66-3.7-1.3-3.7-1.3-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.66.08-.66 1.1.08 1.67 1.14 1.67 1.14.98 1.67 2.57 1.19 3.2.9.1-.71.38-1.19.69-1.47-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.18 1.14-2.95-.11-.28-.5-1.41.11-2.93 0 0 .94-.3 3.07 1.13a10.6 10.6 0 0 1 2.8-.38c.95 0 1.9.13 2.8.38 2.13-1.43 3.06-1.13 3.06-1.13.61 1.52.22 2.65.11 2.93.71.77 1.14 1.75 1.14 2.95 0 4.22-2.57 5.15-5.01 5.42.39.34.73 1 .73 2.03 0 1.47-.01 2.66-.01 3.02 0 .29.2.64.75.53A11.06 11.06 0 0 0 23 11.53C23 5.24 18.27.5 12 .5Z"/>
                      </svg>
                      <span>GitHub</span>
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3">
                <div className="border-t border-white/15 pt-3 text-sm text-white/70">Looking to do great work?</div>
                <p className="text-white/80 text-sm">Tell me about your project and I&apos;ll get back soon.</p>
              </div>
            </div>
          </div>

          {/* Right form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-[#232323] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-[#232323] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tell us about your project</label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-[#232323] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 resize-none"
                placeholder="Message..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-full border border-white/30 text-white hover:bg-white/10 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
