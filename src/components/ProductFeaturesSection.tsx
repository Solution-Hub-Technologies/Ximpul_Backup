
import React from 'react';
import { Check, Shield, Thermometer } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ProductFeaturesSection = () => {
  const navigate = useNavigate();
  const goToSpecs = () => {
    navigate('/specs');
  };
  
  return (
    <section className="apple-spacing bg-background fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="lg:text-[2.7rem] xl:text-[2.916rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[3.24rem]" style={{
            lineHeight: 1.09
          }}>
            Ximpul Flow
          </h2>
        </div>

        {/* Mobile-first responsive grid - 2 columns on mobile, responsive on larger screens */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Updated large feature card */}
          

          {/* Smaller feature cards - updated as requested */}
          

          

          

          {/* Updated volume/usage card */}
          <div className="relative rounded-2xl md:rounded-3xl">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1} />
            
          </div>
        </div>

        {/* Detailed features list */}
        <div className="mt-16 bg-muted/20 backdrop-blur-sm rounded-3xl p-8 lg:p-12 my-0 py-0 px-[50px]">
          <h3 className="text-2xl font-light text-foreground mb-8 text-center">Complete Feature Set</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Capacity: 500ML</p>
                <p className="text-sm text-muted-foreground">Ideal for daily hydration</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Material: 304 Stainless Steel</p>
                <p className="text-sm text-muted-foreground">Body, PP (Cap), Silicone (Sleeve)</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">24-Hour Insulation</p>
                <p className="text-sm text-muted-foreground">Double-wall vacuum insulation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Two Cap Options</p>
                <p className="text-sm text-muted-foreground">Standard Cap or Straw Cap</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">100% Leak-Proof</p>
                <p className="text-sm text-muted-foreground">Safe for office, gym, school or travel</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Portable Handle Rope</p>
                <p className="text-sm text-muted-foreground">Easy to carry, hang on backpack</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Silicone Sleeve (Optional)</p>
                <p className="text-sm text-muted-foreground">Soft grip + impact protection</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">FDA Approved & BPA-Free</p>
                <p className="text-sm text-muted-foreground">Safe for kids and adults</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Fits in Car Holders</p>
                <p className="text-sm text-muted-foreground">Designed for everyday convenience</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Full Specs button at the bottom */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" onClick={goToSpecs} className="hover:bg-foreground hover:text-background">
            View Full Specs
          </Button>
        </div>
      </div>
    </section>
  );
};
