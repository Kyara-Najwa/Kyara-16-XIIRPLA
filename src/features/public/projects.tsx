'use client';

import { useEffect, useMemo, useState } from 'react';
import { Project } from '@/types/project';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

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
        const rows = (await pr.json()) as any[];
        setProjects(rows as Project[]);

        const uniqueOwners = Array.from(new Set(rows.map((r: any) => r.owner).filter(Boolean)));
        if (uniqueOwners.length) {
          const csv = uniqueOwners.map((id) => `"${id}"`).join(',');
          const ownersUrl = `${base}/rest/v1/profiles?id=in.(${csv})&select=id,display_name`;
          const or = await fetch(ownersUrl, {
            headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
          });
          if (!or.ok) throw new Error(`REST owners fetch failed: ${or.status}`);
          const profs = (await or.json()) as any[];
          const map: OwnerMap = {};
          for (const p of profs || []) map[p.id] = p.display_name || '';
          setOwners(map);
        } else {
          setOwners({});
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load projects');
        setProjects([]);
        setOwners({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = useMemo(() => projects, [projects]);

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
      <div className="max-w-6xl mx-auto px-5 py-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Projects</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((p) => {
            const ownerName = owners[p.owner] || 'Unknown';
            const viewHref = p.demo_url || p.repo_url || '#';
            return (
              <article key={p.id} className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 hover:bg-black/70 transition-colors ring-0 hover:ring-1 hover:ring-white/30">
                {p.cover_url ? (
                  <div className="p-4 pb-0">
                    <img src={p.cover_url} alt={p.title} className="w-full h-40 object-cover rounded-xl" />
                  </div>
                ) : null}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-white mb-1 line-clamp-1">{p.title}</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    {new Date(p.created_at).toLocaleDateString()} 
                    <span className="mx-1">-</span>
                    {ownerName}
                  </p>
                  {p.description ? (
                    <p className="text-gray-300 text-sm mb-10 line-clamp-3">{p.description}</p>
                  ) : (
                    <div className="mb-10" />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2 max-w-[70%]">
                      {(p.tags || []).slice(0, 3).map((t, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-[11px] bg-white/10 border border-white/30 text-white">{t}</span>
                      ))}
                    </div>
                    <a
                      href={viewHref}
                      target={viewHref.startsWith('http') ? '_blank' : undefined}
                      rel={viewHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="ml-auto inline-block"
                    >
                      <HoverBorderGradient
                        as="div"
                        containerClassName="rounded-full border-white/30"
                        className="bg-transparent text-white px-5 py-2 text-sm inline-flex items-center justify-center"
                      >
                        View
                      </HoverBorderGradient>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
