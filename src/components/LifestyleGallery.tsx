import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ZoomIn, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';

interface VideoItem {
  id: string;
  title: string;
  isShort?: boolean;
}

export const LifestyleGallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const productImages = [{
    image: '/ximpul-uploads/a44c6b1e-d7be-4764-be5b-56df9fac3e9a.png',
    title: 'Complete Set'
  }, {
    image: '/ximpul-uploads/7176b950-e718-4577-a7f9-5e65c1811e58.png',
    title: 'Textured Grip'
  }, {
    image: '/ximpul-uploads/1e2abc2a-2836-4dad-ad5b-7962aa9b7f98.png',
    title: 'Side Profile'
  }, {
    image: '/ximpul-uploads/banoful 2.png',
    title: 'Custom Branding Concept'
  }, {
    image: '/ximpul-uploads/841e3dea-d23a-4419-8563-82c217d2bed2.png',
    title: 'Ergonomic Design'
  }, {
    image: '/ximpul-uploads/22ab9da4-fbda-4981-bc1a-1e93c16d2c5d.png',
    title: 'Color Options'
  }, {
    image: '/ximpul-uploads/8b1016d0-9003-4b84-ba91-b76e53d0751a.png',
    title: 'Premium Cap'
  }, {
    image: '/ximpul-uploads/98251ec1-0e5e-40b7-962a-e9989c247749.png',
    title: 'Cap Detail'
  }, {
    image: '/ximpul-uploads/1902deae-2847-44b6-ab69-7c7183e4b48b.png',
    title: 'Bottle Cap'
  }, {
    image: '/ximpul-uploads/00e04cfe-21e9-43f5-999f-de65c95b042a.png',
    title: 'Interior View'
  }, {
    image: '/ximpul-uploads/a2c202be-17b1-4dd1-9b5d-a7412ff6cf1a.png',
    title: 'Top View'
  }, {
    image: '/ximpul-uploads/1c49a7b6-451a-4563-8f46-c9195df603c2.png',
    title: 'Full Bottle Black'
  }, {
    image: '/ximpul-uploads/cf4d7d09-de2d-4916-ac25-875ba3566f2c.png',
    title: 'Carry Strap Detail'
  }, {
    image: '/ximpul-uploads/4b860037-5da5-4f05-9f57-44c26a976c1f.png',
    title: 'Side Profile Premium'
  }, {
    image: '/ximpul-uploads/e59b7dea-5f41-47bb-807c-2514529f2d82.png',
    title: 'Cap Mechanism'
  }, {
    image: '/ximpul-uploads/MOEID. remove bgpng.png',
    title: 'Custom Branding Example'
  }, {
    image: '/ximpul-uploads/7e464cce-b9a0-4b39-b6fa-47d5b11e6a0f.png',
    title: 'Cleaning Brush'
  }, {
    image: '/ximpul-uploads/d272d0d8-b289-4813-9bf6-0234161a1b19.png',
    title: 'Carabiner Black'
  }, {
    image: '/ximpul-uploads/23701c94-3ba7-4802-95a3-c2e8712f08da.png',
    title: 'Carabiner Silver'
  }, {
    image: '/ximpul-uploads/f6a20326-95c9-43eb-bb1d-3482df957c7c.png',
    title: 'Premium Cap Silver'
  }, {
    image: '/ximpul-uploads/1b91a224-7043-4b36-9360-4fcac97442e5.png',
    title: 'Glass Straws'
  }, {
    image: '/ximpul-uploads/a74e49fa-1bce-40fd-ac1a-28e505b52dc3.png',
    title: 'Silver Cap Top View'
  }, {
    image: '/ximpul-uploads/ximpul - maersk logo without bg (1).png',
    title: 'Custom Branding'
  }];

  const videos: VideoItem[] = [
    { id: 'vDaA02pMqII', title: 'Ximpul Flow' },
    { id: 'MvNgPx2GF_Y', title: 'Ximpul Flow' },
    { id: 'AGtwbu8ENlI', title: 'Ximpul Flow', isShort: true },
    { id: '3QRH1kzw1MQ', title: 'Ximpul Flow', isShort: true },
    { id: 'iMLDizW4zSc', title: 'Ximpul Flow', isShort: true },
    { id: '6A7EhdtcUtk', title: 'Ximpul Flow', isShort: true },
    { id: 'LE6x3NH1ETY', title: 'Ximpul Flow', isShort: true },
    { id: '0b_Djn60pgg', title: 'Ximpul Flow', isShort: true },
    { id: '86t5ERfQLYU', title: 'Ximpul Flow', isShort: true },
  ];

  // Image carousel - autoplay scrolling LEFT (scrollNext)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start'
  });

  // Video carousel - same as image carousel but scrolls RIGHT (scrollPrev)
  const [videoEmblaRef, videoEmblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start'
  });

  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = () => {
      emblaApi.scrollNext();
    };
    const interval = setInterval(autoplay, 3000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  // Video carousel scrolls RIGHT
  useEffect(() => {
    if (!videoEmblaApi) return;
    const autoplay = () => {
      videoEmblaApi.scrollPrev();
    };
    const interval = setInterval(autoplay, 3000);
    return () => clearInterval(interval);
  }, [videoEmblaApi]);

  // Lock body scroll when video modal is open
  useEffect(() => {
    if (selectedVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedVideo]);

  const ImageZoomModal = ({
    imageSrc,
    title,
    isOpen,
    onClose
  }: {
    imageSrc: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
        <X size={32} />
      </button>
      <div className="relative max-w-4xl max-h-full flex items-center justify-center">
        <img src={imageSrc} alt={title} className="max-w-full max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <h3 className="text-white text-xl font-medium text-center">{title}</h3>
        </div>
      </div>
    </div>;
  };

  return <><section id="gallery" className="py-16 bg-background fade-on-scroll">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight tracking-tight apple-gradient-text mb-6">
          Every Detail Matters
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto py-0 my-0">
          Explore the premium craftsmanship and thoughtful design that makes Ximpul Flow extraordinary.
        </p>
      </div>

      {/* ── Image Carousel (scrolls LEFT) ── */}
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex -ml-2 md:-ml-4 py-[40px]">
            {productImages.map((item, index) => <div key={index} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-0 shrink-0">
              <div className="group relative">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg overflow-hidden bg-white py-0">
                  <CardContent className="p-0 relative py-[14px]">
                    <div className="relative overflow-hidden aspect-square py-0">
                      <img src={item.image} alt="" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-4 md:p-6" />

                      {/* Zoom overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center cursor-pointer" onClick={() => setSelectedImage(item.image)}>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 backdrop-blur-sm">
                          <ZoomIn className="w-6 h-6 text-gray-800" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>)}
          </div>
        </div>

        {/* Mobile swipe indicator */}
        <div className="flex md:hidden justify-center mt-6 space-x-2">
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <span>Swipe to explore</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Image count indicator */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Premium real detail shots • Tap any image to zoom
        </p>
      </div>

      {/* ── Video Carousel (scrolls RIGHT — same Embla structure as image carousel) ── */}
      <div className="relative">
        <div ref={videoEmblaRef} className="overflow-hidden">
          <div className="flex -ml-2 md:-ml-4 py-[40px]">
            {videos.map((video, index) => <div key={video.id} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-0 shrink-0">
              <div className="group relative">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden bg-white py-0 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                  <CardContent className="p-0 relative py-[14px]">
                    <div className="relative overflow-hidden aspect-square py-0">
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white/90 group-hover:bg-white rounded-full p-3 md:p-4 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-all duration-300">
                          <Play className="w-5 h-5 md:w-6 md:h-6 text-gray-800 fill-gray-800 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>)}
          </div>
        </div>

        {/* Mobile swipe indicator for videos */}
        <div className="flex md:hidden justify-center mt-6 space-x-2">
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <span>Swipe to watch</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Video indicator */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Watch Ximpul Flow in action • Tap any video to play
        </p>
      </div>
    </div>
  </section>

    {/* Portaled modals — rendered at body level to escape transform stacking context */}
    {selectedImage && createPortal(
      <ImageZoomModal imageSrc={selectedImage} title={productImages.find(img => img.image === selectedImage)?.title || ''} isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} />,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedVideo(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`relative w-full z-10 ${selectedVideo.isShort ? 'max-w-sm' : 'max-w-3xl'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Video player card */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
                <div className={`bg-black ${selectedVideo.isShort ? 'aspect-[9/16]' : 'aspect-video'}`}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>;
};
