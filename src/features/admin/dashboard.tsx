"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  title: string | null;
  slug: string | null;
  published: boolean | null;
  created_at: string | null;
  views?: number;
  cover_url?: string | null;
};

type Analytics = {
  totalViews: number;
  monthlyViews: number;
  topProjects: Project[];
  recentActivity: Array<{
    id: string;
    action: string;
    project: string;
    time: string;
    slug: string;
  }>;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    monthlyViews: 0,
    topProjects: [],
    recentActivity: []
  });
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch projects data
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("id, title, slug, published, created_at, cover_url")
          .order("created_at", { ascending: false });

        if (projectsError) throw projectsError;

        // Calculate metrics
        const totalProjects = projects?.length || 0;
        const publishedProjects = projects?.filter(p => p.published).length || 0;
        const draftProjects = totalProjects - publishedProjects;
        
        // Generate recent activity from projects data
        const recentActivity = projects?.slice(0, 5).map(project => ({
          id: project.id,
          action: project.published ? "Project published" : "Project created",
          project: project.title || 'Untitled',
          time: project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown',
          slug: project.slug || 'no-slug'
        })) || [];

        const mockAnalytics: Analytics = {
          totalViews: Math.floor(Math.random() * 10000) + 5000,
          monthlyViews: Math.floor(Math.random() * 2000) + 1000,
          topProjects: projects?.slice(0, 5) || [],
          recentActivity: recentActivity
        };

        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto slideshow index
  useEffect(() => {
    const withCovers = (analytics.topProjects || []).filter(p => p.cover_url);
    if (withCovers.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % withCovers.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [analytics.topProjects]);

  // Sync search from URL and global events
  useEffect(() => {
    const q = searchParams?.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setSearchQuery(ce.detail || '');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('admin-search', handler as EventListener);
      return () => window.removeEventListener('admin-search', handler as EventListener);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return analytics;
    const topProjects = analytics.topProjects.filter(p =>
      (p.title || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q)
    );
    const recentActivity = analytics.recentActivity.filter(a =>
      (a.project || '').toLowerCase().includes(q) || (a.action || '').toLowerCase().includes(q)
    );
    return { ...analytics, topProjects, recentActivity } as Analytics;
  }, [analytics, searchQuery]);

  // Current month projects (for right card)
  const monthlyProjects = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return analytics.topProjects.filter(p => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }, [analytics.topProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Projects" 
          value={filtered.topProjects.length} 
          period="From Jan 01, 2024 To Dec 31, 2024"
        />
        <MetricCard 
          title="Published" 
          value={filtered.topProjects.filter(p => p.published).length} 
          period="From Jan 01, 2024 To Dec 31, 2024"
        />
        <MetricCard 
          title="Unpublished" 
          value={filtered.topProjects.filter(p => !p.published).length} 
          period="From Jan 01, 2024 To Dec 31, 2024"
        />
        <MetricCard 
          title="Monthly Views" 
          value={analytics.monthlyViews.toLocaleString()} 
          period="From Jan 01, 2024 To Dec 31, 2024"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auto slideshow of project covers */}
        <div className="bg-black border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Showcase</h3>
          <div className="h-64 bg-white/5 rounded-lg overflow-hidden relative flex items-center justify-center">
            {(() => {
              const covers = filtered.topProjects.filter(p => p.cover_url);
              if (covers.length === 0) {
                return <div className="text-gray-400">No project images</div>;
              }
              const current = covers[slideIndex % covers.length];
              return (
                <>
                  <img
                    key={current.id}
                    src={current.cover_url as string}
                    alt={current.title || 'Project'}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white font-semibold truncate">{current.title || 'Untitled Project'}</div>
                    <div className="text-gray-300 text-sm truncate">{current.slug || ''}</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Current month projects only */}
        <div className="bg-black border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">This Month&apos;s Projects</h3>
          <div className="h-64 bg-white/5 rounded-lg overflow-y-auto scrollbar-hide p-4 space-y-3">
            {monthlyProjects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No projects this month</div>
            ) : (
              monthlyProjects.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  {p.cover_url && (
                    <img src={p.cover_url} alt={p.title || ''} className="w-12 h-12 rounded-md object-cover" />
                  )}
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{p.title || 'Untitled'}</div>
                    <div className="text-gray-400 text-xs truncate">{p.slug || ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Top Projects</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filtered.topProjects.slice(0, 5).map((project, index) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{project.title || 'Untitled'}</div>
                      <div className="text-gray-400 text-sm">{project.slug || 'no-slug'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{Math.floor(Math.random() * 1000) + 100}</div>
                    <div className="text-gray-400 text-sm">views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filtered.recentActivity.length > 0 ? (
                filtered.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{activity.action}</div>
                      <div className="text-gray-400 text-sm">{activity.project}</div>
                    </div>
                    <div className="text-gray-400 text-sm">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">No recent activity</div>
                  <div className="text-gray-500 text-sm mt-1">Create your first project to see activity here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  period 
}: { 
  title: string; 
  value: string | number; 
  period: string;
}) {
  return (
    <div className="bg-black border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-xs text-gray-500">{period}</div>
    </div>
  );
}
