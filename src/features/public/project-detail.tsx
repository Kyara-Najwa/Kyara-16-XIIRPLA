'use client';

import { useState, useEffect } from 'react';
import { Github, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AnimatedList from '@/components/AnimatedList';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  cover_url: string | null;
  repo_url: string | null;
  demo_url: string | null;
  owner: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProjectsGrid() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, title, slug, description, tags, cover_url, repo_url, demo_url, owner, published, created_at, updated_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        throw fetchError;
      }

      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    console.log('Opening project modal:', project.title);
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setSelectedProject(null);
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-300 hover:bg-white/10 group">
      <div className="flex flex-col sm:flex-row gap-6 p-6">
        {/* Cover Image - Left Side with Padding */}
        <div className="relative w-full sm:w-80 h-48 sm:h-44 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
          {project.cover_url ? (
            <img
              src={project.cover_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl text-white/20 font-bold">
                {project.title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div>
            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
              {project.title}
            </h3>
            
            {/* Description */}
            <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
              {project.description}
            </p>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 text-white text-xs rounded-full border border-white/20 font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 4 && (
                  <span className="text-xs text-gray-400 flex items-center px-2">
                    +{project.tags.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer with Owner and View Button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
            <div className="flex items-center gap-3">
              {/* Owner Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center text-sm font-semibold text-white border border-white/10">
                {project.owner.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white font-medium">
                  {project.owner}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(project.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              {/* Links */}
              <div className="flex gap-2 ml-4">
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Repository"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Live Demo"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* View Button */}
            <button
              onClick={() => handleViewProject(project)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <span>View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Github className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={fetchProjects}
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedProject && (
        <style>{`
          body { overflow: hidden; }
          .modal-content::-webkit-scrollbar { display: none; }
          .modal-content { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      )}
      <div className={`min-h-screen bg-black text-white pt-20 transition-all duration-200 ${selectedProject ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative">
          <button 
            onClick={() => router.back()}
            className="absolute top-16 left-4 sm:left-6 text-white/60 hover:text-white transition-colors z-20 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Header */}
          <div className="mb-12">
          </div>

          {/* Projects List with AnimatedList */}
          {projects.length > 0 ? (
            <div className="px-2">
              <AnimatedList
                items={projects.map(project => <ProjectCard key={project.id} project={project} />)}
                showGradients={false}
                enableArrowNavigation={false}
                displayScrollbar={false}
                itemClassName="project-item"
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Github className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
              <p className="text-gray-400">There are no published projects at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Backdrop */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={handleCloseModal} />
      )}

      {/* Modal */}
      {selectedProject && (
        <div className="fixed left-0 right-0 bottom-0 top-1/7 flex items-center justify-center z-[9999] p-4 pointer-events-none">
          <div 
            className="bg-black border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Cover Image */}
              {selectedProject.cover_url && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-white/5 mb-6">
                  <img
                    src={selectedProject.cover_url}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-2">
                {selectedProject.title}
              </h2>

              {/* Owner and Date */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center text-sm font-semibold text-white border border-white/10">
                  {selectedProject.owner.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {selectedProject.owner}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedProject.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Links Icons */}
                <div className="flex gap-3">
                  {selectedProject.repo_url && (
                    <a
                      href={selectedProject.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                      title="Repository"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {selectedProject.demo_url && (
                    <a
                      href={selectedProject.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                      title="Live Demo"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Description
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Tags */}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-white/10 text-white text-sm rounded-full border border-white/20 font-medium hover:border-white/40 hover:bg-white/20 transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button at Bottom */}
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}