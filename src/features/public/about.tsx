"use client";

import { useEffect, useState } from "react";

type PublicProfile = {
  display_name: string;
  avatar_url: string;
  city_name: string;
  city_image_url: string;
  bio?: string;
  profession?: string;
};

export default function About() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hover, setHover] = useState<{
    show: boolean;
    x: number;
    y: number;
    url: string;
  }>({ show: false, x: 0, y: 0, url: "" });

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        if (!base || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Supabase env not configured");
        }
        const url = `${base}/rest/v1/profiles?select=display_name,avatar_url,city_name,city_image_url,bio,profession&limit=1`;
        const r = await fetch(url, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        });
        if (!r.ok) throw new Error(`REST fetch failed: ${r.status}`);
        const rows = (await r.json()) as Array<{
          display_name?: string;
          avatar_url?: string;
          city_name?: string;
          city_image_url?: string;
          bio?: string;
          profession?: string;
        }>;
        const row = rows?.[0] || {};
        setProfile({
          display_name: row.display_name || "",
          avatar_url: row.avatar_url || "",
          city_name: row.city_name || "",
          city_image_url: row.city_image_url || "",
          bio: row.bio || "",
          profession: row.profession || "",
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load profile";
        setError(message);
        setProfile({ display_name: "", avatar_url: "", city_name: "", city_image_url: "", bio: "", profession: "" });
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProfile();
  }, []);

  const onEnter = (url: string) => {
    if (!url) return;
    setHover((h) => ({ ...h, show: true, url }));
  };
  const onMove = (e: React.MouseEvent) => {
    if (!hover.show) return;
    setHover((h) => ({ ...h, x: e.clientX + 16, y: e.clientY + 16 }));
  };
  const onLeave = () => setHover({ show: false, x: 0, y: 0, url: "" });

  return (
    <section className="relative text-white" onMouseMove={onMove}>
      <div className="max-w-6xl mx-auto px-5 scroll-mt-24">
        <div className="min-h-[calc(100svh-96px)] grid place-content-center">
          <div className="w-full max-w-4xl mt-24 md:mt-40">
            {error ? (
              <div className="text-red-400">{error}</div>
            ) : loading ? (
              <div className="text-gray-300">Loading...</div>
            ) : (
              <div className="space-y-5 text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-100 tracking-tight">
                  Hi i&apos;m{" "}
                  <span
                    className={`font-semibold text-white ${profile?.avatar_url ? "cursor-pointer underline decoration-white/40 underline-offset-4" : ""}`}
                    onMouseEnter={() => onEnter(profile?.avatar_url || "")}
                    onMouseLeave={onLeave}
                  >
                    {profile?.display_name || "Your Name"}
                  </span>
                </h1>
                <p className="text-3xl md:text-4xl text-white">
                  {(profile?.profession || "Your Profession")} based in{" "}
                  <span
                    className={`${profile?.city_image_url ? "cursor-pointer underline decoration-white/30 underline-offset-4" : ""}`}
                    onMouseEnter={() => onEnter(profile?.city_image_url || "")}
                    onMouseLeave={onLeave}
                  >
                    {profile?.city_name || "Your City"}
                  </span>
                </p>
                {profile?.bio ? (
                  <p className="text-2xl md:text-3xl text-white leading-relaxed max-w-4xl">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {hover.show && hover.url ? (
        <div
          className="pointer-events-none fixed z-50 shadow-2xl rounded-xl overflow-hidden border border-white/20"
          style={{ left: hover.x, top: hover.y, width: 320 }}
        >
          <img src={hover.url} alt="preview" className="w-full h-full object-cover bg-black" />
        </div>
      ) : null}
    </section>
  );
}
