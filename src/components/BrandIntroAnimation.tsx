import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface BrandIntroAnimationProps {
  forceShow?: boolean;
}

// Module-level check for fresh browser session/reload
let isFreshBrowserLoad = true;

export const BrandIntroAnimation: React.FC<BrandIntroAnimationProps> = ({
  forceShow = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show modal on fresh browser reload / load
    if (!isFreshBrowserLoad && !forceShow) {
      setIsOpen(false);
      return;
    }

    isFreshBrowserLoad = false;
    setIsOpen(true);
  }, [forceShow]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSeeIt = () => {
    setIsOpen(false);
    navigate('/new-lineup');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"
          />

          {/* Centered Luxury Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl bg-black border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 text-center text-white"
          >
            {/* Background Texture Image */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80">
              <img
                src="/ximpul-uploads/ChatGPT Image Aug 3, 2026, 04_12_39 PM.png"
                alt="Fabric Background"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Close (Cross) Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Modal Content - Identical Aesthetic as New Lineup Page */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto">
              
              {/* 1. Official Ximpul Logo */}
              <div className="flex flex-col items-center mb-5 sm:mb-6">
                <img
                  src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png"
                  alt="XIMPUL"
                  className="h-5 sm:h-7 w-auto object-contain invert brightness-200 tracking-[0.45em] drop-shadow-md"
                />
              </div>

              {/* 2. Sub-header Tag & Accent Line */}
              <div className="flex flex-col items-center mb-5 sm:mb-6">
                <span className="text-gray-300 text-[10px] sm:text-xs tracking-[0.4em] uppercase font-light">
                  NEW LINEUP
                </span>
                <div className="w-8 h-[1px] bg-white/40 mt-2 sm:mt-3" />
              </div>

              {/* 3. Main Headline */}
              <h2 className="text-lg sm:text-3xl md:text-4xl font-light text-white tracking-[0.14em] sm:tracking-[0.18em] leading-tight uppercase mb-3 sm:mb-4 font-sans drop-shadow-xl">
                A TRADITION REIMAGINED.
              </h2>

              {/* 4. Subheadline */}
              <p className="text-gray-200/90 text-xs sm:text-base font-light tracking-wide mb-8 sm:mb-10 font-sans drop-shadow-md max-w-md">
                Some traditions deserve a second look.
              </p>

              {/* 5. Accent Line & SEE IT Action Button */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-[1px] bg-white/40 mb-5 sm:mb-6" />
                <button
                  onClick={handleSeeIt}
                  className="group relative pb-1 border-b border-white/70 hover:border-white text-white transition-all duration-300 text-xs sm:text-sm tracking-[0.35em] font-light uppercase flex items-center gap-3 cursor-pointer bg-transparent"
                >
                  <span>SEE IT</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 opacity-80 group-hover:opacity-100" />
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntroAnimation;
