'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadName?: string;
}

/**
 * Full-screen lightbox for viewing a single image, with a Download button.
 * The image is shown as large as possible inside the viewport. Clicking
 * outside the image (on the overlay) closes the lightbox.
 */
export default function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
  downloadName,
}: ImageLightboxProps) {
  if (!src) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = downloadName || `photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-slate-700">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Download button */}
          <div className="absolute top-3 left-3 z-10">
            <Button
              type="button"
              onClick={handleDownload}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* The image */}
          { }
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
