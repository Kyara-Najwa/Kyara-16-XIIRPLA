"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Upload, X } from 'lucide-react';

interface GalleryImage {
  id: number;
  title: string | null;
  image_url: string;
  created_at: string;
}

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setToast({ type: 'error', message: 'Error loading images' });
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please upload an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File size must be less than 5MB' });
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setImageUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadImageToStorage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = await supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit() {
    if (!imageUrl && !imageFile) {
      setToast({ type: 'error', message: 'Please provide an image URL or upload an image' });
      return;
    }

    try {
      setUploading(true);
      
      let finalImageUrl = imageUrl;
      
      if (imageFile) {
        finalImageUrl = await uploadImageToStorage(imageFile);
      }

      const { data, error } = await supabase
        .from('gallery')
        .insert([
          {
            title: title || null,
            image_url: finalImageUrl
          }
        ])
        .select();

      if (error) throw error;

      setToast({ type: 'success', message: 'Image added successfully!' });
      
      setTitle('');
      setImageUrl('');
      setImageFile(null);
      
      fetchImages();
    } catch (error) {
      console.error('Error adding image:', error);
      setToast({ 
        type: 'error', 
        message: 'Error adding image: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToast({ type: 'success', message: 'Image deleted successfully!' });
      setShowDeleteConfirm(null);
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setToast({ type: 'error', message: 'Error deleting image' });
    }
  }

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 min-w-[260px] max-w-sm p-4 rounded-xl border shadow-lg backdrop-blur bg-black/80 ${toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <div className="text-white text-sm leading-relaxed flex-1">{toast.message}</div>
              <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black/90 border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">Delete Image?</h3>
              <p className="text-gray-400 mb-8">Are you sure you want to delete this image? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 transition-colors font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white/10 text-white border border-white/20 py-3 px-6 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8 text-white">Gallery Management</h1>

        {/* Add New Image Form */}
        <div className="bg-black border border-white/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white">Add New Image</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-white/20 rounded-lg bg-black text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Enter image title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Project Image
              </label>
              
              {imageUrl && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-48 h-48 object-cover rounded-xl border border-white/20 shadow-lg"
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
                    onChange={handleFileUpload}
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
                  value={imageFile ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={!!imageFile}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all disabled:bg-gray-900 disabled:text-gray-500"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Max size: 5MB. Supported: JPG, PNG, GIF, WebP
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              {uploading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              )}
              {uploading ? 'Adding...' : 'Add Image'}
            </button>
          </div>
        </div>

        {/* Existing Images List */}
        <div className="bg-black border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">
            Existing Images ({images.length})
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
              <p className="mt-2 text-gray-400">Loading...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-white/20 rounded-lg">
              No images yet. Add your first image above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="border border-white/20 rounded-lg overflow-hidden hover:border-white/40 transition-all">
                  <div className="aspect-video w-full overflow-hidden bg-gray-900">
                    <img
                      src={image.image_url}
                      alt={image.title || 'Gallery image'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 bg-black">
                    <h3 className="font-semibold truncate mb-2 text-white">
                      {image.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {new Date(image.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(image.id)}
                      className="w-full bg-black border-2 border-white text-white py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}