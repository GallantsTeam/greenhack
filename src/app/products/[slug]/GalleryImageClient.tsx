'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'; // Added DialogTitle

interface GalleryImageClientProps {
  src: string;
  alt: string;
}

const GalleryImageClient: React.FC<GalleryImageClientProps> = ({ src, alt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity">
          <Image 
            src={src} 
            alt={alt} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint="software menu screenshot" 
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] p-2 bg-background border-border shadow-xl">
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{`Enlarged image: ${alt}`}</DialogTitle>
        <div className="relative w-full h-[75vh]">
            <Image src={src} alt={`${alt} - enlarged`} layout="fill" objectFit="contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryImageClient;
