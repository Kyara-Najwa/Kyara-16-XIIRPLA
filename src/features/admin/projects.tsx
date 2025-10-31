'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Project, CreateProjectData } from '@/types/project';
import { Plus, Edit, Trash2, ExternalLink, Github, Upload, X } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    slug: '',
    description: '',
    tags: [],
    cover_url: '',
    repo_url: '',
    demo_url: '',
    published: true,
    owner: ''
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const [tagsInput, setTagsInput] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id,title,slug,description,tags,cover_url,repo_url,demo_url,published,owner,created_at,updated_at')
        .eq('owner', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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

  const normalized = (s: string) => s.toLowerCase();
  const matches = (p: Project) => {
    if (!searchQuery) return true;
    const q = normalized(searchQuery);
    return (
      normalized(p.title).includes(q) ||
      normalized(p.description).includes(q) ||
      p.tags.some(t => normalized(t).includes(q))
    );
  };
  const visibleProjects = projects.filter(matches);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const checkBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        console.error('List buckets error details:', {
          message: listError.message,
          name: listError.name
        });
        return false;
      }

      console.log('Available buckets:', buckets?.map(b => b.name));
      const exists = buckets?.some(bucket => bucket.name === bucketName) || false;
      console.log(`Bucket "${bucketName}" exists:`, exists);
      return exists;
    } catch (error) {
      console.error('Error checking bucket:', error);
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      console.log('Attempting upload to project-images bucket...');
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload to project-images bucket failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        });
        
        console.log('Trying fallback to image bucket...');
        const { error: fallbackError } = await supabase.storage
          .from('image')
          .upload(filePath, file);
          
        if (fallbackError) {
          console.error('Upload to image bucket also failed:', fallbackError);
          return null;
        }
        
        const { data: fallbackData } = supabase.storage
          .from('image')
          .getPublicUrl(filePath);
          
        console.log('Upload successful to image bucket, URL:', fallbackData.publicUrl);
        return fallbackData.publicUrl;
      }

      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      console.log('Upload successful to project-images bucket, URL:', data.publicUrl);
      return data.publicUrl;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let coverUrl = formData.cover_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          coverUrl = uploadedUrl;
        } else {
          console.warn('Image upload failed, continuing without image');
          setToast({ type: 'error', message: 'Image upload failed. Please check your Storage bucket or use image URL.' });
        }
      }

      const projectData = {
        ...formData,
        cover_url: coverUrl,
        slug: formData.slug || generateSlug(formData.title),
        owner: user.id
      };

      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create project');
      }
      
      setShowModal(false);
      resetForm();
      fetchProjects();
      setToast({ type: 'success', message: 'Project created successfully' });
    } catch (error) {
      console.error('Error creating project:', error);
      setToast({ type: 'error', message: 'Error creating project: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setUploading(true);

    try {
      let coverUrl = formData.cover_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          coverUrl = uploadedUrl;
        } else {
          console.warn('Image upload failed, continuing without image');
          alert('Image upload failed. Please check your Supabase Storage buckets or use image URL instead.');
        }
      }

      const projectData = {
        ...formData,
        cover_url: coverUrl,
        slug: formData.slug || generateSlug(formData.title)
      };

      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to update project');
      }
      
      setShowModal(false);
      setEditingProject(null);
      resetForm();
      fetchProjects();
      setToast({ type: 'success', message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      setToast({ type: 'error', message: 'Error updating project: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProjects();
      setToast({ type: 'success', message: 'Project deleted' });
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast({ type: 'error', message: 'Error deleting project' });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      slug: project.slug,
      description: project.description,
      tags: project.tags,
      cover_url: project.cover_url || '',
      repo_url: project.repo_url || '',
      demo_url: project.demo_url || '',
      published: project.published,
      owner: project.owner
    });
    setTagsInput(project.tags.join(', '));
    setImagePreview(project.cover_url || '');
    setImageFile(null);
    setSlugManuallyEdited(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      tags: [],
      cover_url: '',
      repo_url: '',
      demo_url: '',
      published: true,
      owner: ''
    });
    setImageFile(null);
    setImagePreview('');
    setSlugManuallyEdited(false);
    setTagsInput('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, cover_url: '' }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 min-w-[260px] max-w-sm p-4 rounded-xl border shadow-lg backdrop-blur bg-black/80 ${toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <div className="text-white text-sm leading-relaxed flex-1">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Projects Management</h1>
        <button
          onClick={() => {
            setEditingProject(null);
            resetForm();
            setShowModal(true);
          }}
          className="w-full sm:w-auto justify-center flex items-center gap-3 bg-white text-black px-5 md:px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-base md:text-lg"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </div>

      
      <div className="sm:hidden space-y-4">
        {visibleProjects.map((project) => (
          <div key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              {project.cover_url && (
                <img src={project.cover_url} alt={project.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold truncate">{project.title}</div>
                <div className="text-xs text-gray-400 truncate">{project.slug} • {new Date(project.created_at).toLocaleDateString()}</div>
                <div className="text-sm text-gray-300 mt-2 line-clamp-2">{project.description}</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.tags.slice(0, 4).map((tag, index) => (
                    <span key={index} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white border border-white/20">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-3">
                    {project.repo_url && (
                      <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(project)} className="text-gray-400 hover:text-white transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      
      <div className="hidden sm:block bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-white uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white uppercase tracking-wider">
                  Technologies
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleProjects.map((project) => (
                <tr key={project.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {project.cover_url && (
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-4"
                          src={project.cover_url}
                          alt={project.title}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {project.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {project.slug} • {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 max-w-xs truncate">
                      {project.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{project.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-3">
                      {project.repo_url && (
                        <a
                          href={project.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
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
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 border border-white/20 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-hide">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <p className="text-gray-400 mt-2">
                  {editingProject ? 'Update your project details' : 'Add a new project to your portfolio'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingProject ? handleUpdate : handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        title,
                        slug: !slugManuallyEdited ? generateSlug(title) : prev.slug
                      }));
                    }}
                    placeholder="Enter project title"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Slug (auto-generated)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                      }}
                      placeholder="project-slug"
                      className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                    />
                  <button
                    type="button"
                    onClick={() => {
                      setSlugManuallyEdited(false);
                      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
                    }}
                    className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm font-medium"
                    title="Reset to auto-generate from title"
                  >
                    {slugManuallyEdited ? 'Reset' : 'Auto'}
                  </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {slugManuallyEdited ? 'Manually edited' : 'Auto-generating from title'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project..."
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Project Image
                </label>
                
                
                {imagePreview && (
                  <div className="mb-6 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-xl border border-white/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-4 rounded-xl hover:bg-white/20 transition-all cursor-pointer group">
                    <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">
                      {imageFile ? 'Change Image' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-medium">or</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    value={formData.cover_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, cover_url: e.target.value }));
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={formData.repo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, repo_url: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.demo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, demo_url: e.target.value }))}
                    placeholder="https://your-demo-site.com"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="React, TypeScript, Tailwind CSS"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-white/5 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">Published</span>
                  <p className="text-gray-400 text-sm">Make this project visible to the public</p>
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/10">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-white text-black py-4 px-8 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                >
                  {uploading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  )}
                  {uploading 
                    ? (editingProject ? 'Updating...' : 'Creating...') 
                    : (editingProject ? 'Update Project' : 'Create Project')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                  disabled={uploading}
                  className="flex-1 bg-white/10 text-white border border-white/20 py-4 px-8 rounded-xl hover:bg-white/20 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
