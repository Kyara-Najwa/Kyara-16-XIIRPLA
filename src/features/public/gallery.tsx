"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import DomeGallery from './DomeGallery';

interface GalleryImage {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-lg text-white">Loading gallery...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-lg text-gray-400">No images in gallery yet.</div>
      </div>
    );
  }

  // Transform data untuk DomeGallery
  const galleryImages = images.map(img => ({
    src: img.image_url,
    alt: img.title || 'Gallery image'
  }));

  return (
    <div className="w-full h-screen bg-black overflow-visible">
      <DomeGallery 
        images={galleryImages}
        fit={0.68}
        fitBasis="width"
        segments={18}
        overlayBlurColor="#000000"
        imageBorderRadius="28px"
        openedImageBorderRadius="28px"
        grayscale={false}
        dragSensitivity={20}
        maxVerticalRotationDeg={5}
        minRadius={500}
        maxRadius={1000}
        padFactor={0.35}
      />
    </div>
  );
}