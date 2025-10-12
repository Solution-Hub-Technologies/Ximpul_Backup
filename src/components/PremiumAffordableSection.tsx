import React from 'react';
import { Link } from 'react-router-dom';
export const PremiumAffordableSection = () => {
  return <section className="bg-background fade-on-scroll py-[10px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-[31px]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Text content */}
          <div className="order-1 lg:order-1 text-center lg:text-left">
            <h2 className="lg:text-[2.7rem] xl:text-[3.24rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-8 text-[3.24rem]" style={{
            lineHeight: 1.09
          }}>Premium But Affordable</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              World-class quality without breaking the bank.<br />
              Premium materials and thoughtful design — delivered at a price that finally makes sense at <Link to="/trueprice" onClick={() => window.scrollTo(0, 0)} className="text-primary hover:underline font-medium">#TruePrice</Link>.
            </p>
          </div>
          
          {/* Right side - Product image */}
          <div className="order-2 lg:order-2">
            <div className="relative">
              <img src="/ximpul-uploads/bb4f7329-6e04-437c-b4c8-b96a09551e0d.png" alt="Premium water bottle with textured grip design" className="w-full h-auto object-contain rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
