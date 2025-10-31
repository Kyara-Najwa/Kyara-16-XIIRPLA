'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types/project';

type OwnerMap = Record<string, string>;

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [owners, setOwners] = useState<OwnerMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
        if (!base || !apiKey) throw new Error('Supabase env not configured');

        const projectsUrl = `${base}/rest/v1/projects?select=id,title,slug,description,tags,cover_url,repo_url,demo_url,published,owner,created_at,updated_at&published=eq.true&order=created_at.desc`;
        const pr = await fetch(projectsUrl, {
          headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
        });
        if (!pr.ok) throw new Error(`REST fetch failed: ${pr.status}`);
        const rows = (await pr.json()) as Project[];
        setProjects(rows);

        const uniqueOwners = Array.from(new Set(rows.map((r) => r.owner).filter(Boolean)));
        if (uniqueOwners.length) {
          const csv = uniqueOwners.map((id) => `"${id}"`).join(',');
          const ownersUrl = `${base}/rest/v1/profiles?id=in.(${csv})&select=id,display_name`;
          const or = await fetch(ownersUrl, {
            headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
          });
          if (!or.ok) throw new Error(`REST owners fetch failed: ${or.status}`);
          const profs = (await or.json()) as Array<{ id: string; display_name?: string | null }>;
          const map: OwnerMap = {};
          for (const p of profs || []) map[p.id] = p.display_name || '';
          setOwners(map);
        } else {
          setOwners({});
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load projects';
        setError(message);
        setProjects([]);
        setOwners({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = useMemo(() => projects, [projects]);

  // Only images that have a cover_url
  const imageProjects = useMemo(() => cards.filter((p) => !!p.cover_url), [cards]);
  const rows: string[][] = useMemo(() => {
    const urls = imageProjects.map((p) => p.cover_url as string);
    // Split into 4 rows to mimic the gallery layout
    const chunkCount = 4;
    const out: string[][] = Array.from({ length: chunkCount }, () => []);
    urls.forEach((u, i) => out[i % chunkCount].push(u));
    return out;
  }, [imageProjects]);

  if (loading) {
    return (
      <section className="text-white">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-gray-300">Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="text-white">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-red-400">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="text-white">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_420px] gap-12 items-start">
          {/* Left: infinite moving gallery (marquee) */}
          <div className="relative h-[80vh] lg:h-[84vh] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="absolute inset-0 p-5">
              <div className="flex flex-col gap-3 h-full -translate-y-8 -translate-x-6 scale-[1.06] transform-gpu">
                <div className="flex gap-5 animate-marquee rotate-[-10deg] -translate-y-4 origin-center transform-gpu">
                  {[...(rows[0] || []), ...(rows[0] || [])].map((src, i) => (
                    <div key={`r1-${i}`} className="shrink-0 w-96">
                      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src={src} alt="project" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 animate-marquee-reverse animate-marquee-slow rotate-[-10deg] -translate-y-4 origin-center transform-gpu">
                  {[...(rows[1] || []), ...(rows[1] || [])].map((src, i) => (
                    <div key={`r2-${i}`} className="shrink-0 w-96">
                      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src={src} alt="project" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 animate-marquee animate-marquee-fast rotate-[-10deg] -translate-y-4 origin-center transform-gpu">
                  {[...(rows[2] || []), ...(rows[2] || [])].map((src, i) => (
                    <div key={`r3-${i}`} className="shrink-0 w-96">
                      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src={src} alt="project" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 animate-marquee-reverse rotate-[-10deg] -translate-y-4 origin-center transform-gpu">
                  {[...(rows[3] || []), ...(rows[3] || [])].map((src, i) => (
                    <div key={`r4-${i}`} className="shrink-0 w-96">
                      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src={src} alt="project" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: descriptive text (static) */}
          <div className="relative h-[80vh] lg:h-[84vh] overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-6 pr-4">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">Projects Showcase</h1>
              <p className="text-gray-200 text-base md:text-lg lg:text-xl leading-7 md:leading-8">
                The projects I worked on at 3PM encompass various strategic initiatives designed to enhance efficiency, innovation, and collaboration. Each project focuses on delivering sustainable outcomes through analytical approaches and creative solutions tailored to the needs of both clients and the organization.
              </p>
              <div className="mt-6">
                <Link href="/project-detail" className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-white/30 text-white hover:bg-white/10 transition">
                  View
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
