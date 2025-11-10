
import React from 'react';
export const ProductDetailImagesSection = () => {
  return <section className="py-16 bg-background fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title and Subtitle */}
        <div className="text-center mb-16">
          <h2 className="lg:text-[2.7rem] xl:text-[3.24rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[3.24rem]" style={{
          lineHeight: 1.09
        }}>Ximpul Flow</h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Every feature designed with your lifestyle in mind
          </p>
        </div>

        <div className="space-y-0">
          {/* First Image - Premium Water Bottle */}
          <div className="w-full">
            <img src="/ximpul-uploads/ab202bf1-2031-4a76-80cc-37114ab516f6.png" alt="Premium Water Bottle - Double wall 304 stainless steel, BPA free" className="w-full h-auto object-contain" />
          </div>
          
          {/* Second Image - Portable Handle Rope */}
          <div className="w-full">
            <img src="/ximpul-uploads/ba703431-7720-4eba-9738-1e7bd3d1780e.png" alt="Portable Handle Rope - Durable Woven Nylon For Lasting Strength & Grip" className="w-full h-auto object-contain" />
          </div>
          
          {/* Third Image - Temperature Control */}
          <div className="w-full">
            <img src="/ximpul-uploads/829d04af-dcf4-4386-8ea2-1100018700d0.png" alt="Keep Hot/Cold About 20-24 hours - Heat preservation, durable, strong, leak proof, premium quality" className="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
    </section>;
};
