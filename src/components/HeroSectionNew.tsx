
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackgroundPathsOnly } from '@/components/ui/background-paths';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { RainbowButton } from '@/components/ui/rainbow-button';

export const HeroSectionNew = () => {
  const navigate = useNavigate();
  const scrollToBuy = () => {
    document.getElementById('buy')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const goToSpecs = () => {
    navigate('/specs');
  };

  return (
    <section className="hero-section min-h-[80vh] flex flex-col justify-center items-center relative overflow-hidden pt-24 md:pt-24 pb-8">
      <BackgroundPathsOnly />

      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(180deg, rgba(212, 234, 246, 0.3), rgba(249, 249, 249, 0.6) 75%, rgba(255, 255, 255, 0.8))',
        transition: 'opacity 1.83s ease-out'
      }} />

      {/* Content Container - Desktop Layout */}
      <div className="relative z-10 w-full h-full hidden md:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full text-center">
          <div className="flex flex-col justify-center items-center h-full">
            {/* Animated Underline Text for product name */}
            <div className="hero-product-name lg:text-3xl xl:text-4xl text-[#1d1d1f] mb-3 mt-8 font-semibold text-3xl py-[10px]">
              <AnimatedText text="Introducing Flow" textClassName="lg:text-3xl xl:text-4xl text-[#1d1d1f] font-semibold text-3xl" underlineClassName="w-full text-primary" />
            </div>

            <h2 className="hero-main-heading lg:text-[2.43rem] xl:text-[2.916rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[2.916rem]">
              A Bottle That Makes Water Free Again.
            </h2>

            <div className="hero-product-image mb-6 flex justify-center">
              <div className="max-w-xs lg:max-w-sm xl:max-w-md w-full h-auto overflow-hidden" style={{ clipPath: 'inset(10px 0 10px 0)' }}>
                <img
                  src="/ximpul-uploads/eaa1a148-5371-4701-8c74-ebc7f19de062.png"
                  alt="Ximpul Flow Water Bottle"
                  className="w-full h-auto object-contain transform translate-y-[-10px]"
                  style={{ height: 'calc(100% + 20px)' }}
                />
              </div>
            </div>

            <p className="hero-tagline mb-3 gradient-text text-2xl font-bold">
              Water is free. Why are we paying for it?
            </p>

            <div className="hero-cta space-y-3 mb-8">
              <div className="flex items-center justify-center gap-3">
                <RainbowButton onClick={scrollToBuy} className="text-sm px-6 py-1">
                  Buy
                </RainbowButton>
                <Button size="default" variant="outline" onClick={goToSpecs} className="hover:bg-foreground hover:text-background text-sm px-6 py-1">
                  Specs
                </Button>
              </div>

              <div className="text-sm text-[#1d1f1f] font-semibold space-y-1">
                <p>From 1,190 BDT</p>
                <p>FREE Delivery. World-class quality. <Link to="/trueprice" onClick={() => window.scrollTo(0, 0)} className="text-primary hover:underline">#TruePrice</Link>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container - Mobile Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:hidden pt-28 pb-8">
        {/* Animated Underline Text for product name on mobile */}
        <div className="hero-product-name text-2xl text-[#1d1d1f] mb-4 font-semibold">
          <AnimatedText text="Introducing Flow" textClassName="text-2xl text-[#1d1d1f] font-semibold" underlineClassName="w-full text-primary" />
        </div>

        <h2 className="hero-main-heading text-[1.62rem] sm:text-[2.43rem] font-semibold mb-8 leading-tight tracking-tight apple-gradient-text">
          A Bottle That Makes Water Free Again.
        </h2>

        <div className="hero-product-image mb-8 flex justify-center">
          <div className="max-w-xs w-full h-auto overflow-hidden" style={{ clipPath: 'inset(10px 0 10px 0)' }}>
            <img
              src="/ximpul-uploads/d93145c9-b665-4286-b586-342c557a9096.png"
              alt="Ximpul Flow Water Bottle"
              className="w-full h-auto object-contain transform translate-y-[-10px]"
              style={{ height: 'calc(100% + 20px)' }}
            />
          </div>
        </div>

        <p className="hero-tagline mb-4 gradient-text">Water is Free. Why are we paying for it?</p>

        <div className="hero-cta mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <RainbowButton onClick={scrollToBuy} className="text-sm px-5 py-1">
              Buy
            </RainbowButton>
            <Button size="default" variant="outline" onClick={goToSpecs} className="hover:bg-foreground hover:text-background text-sm px-5 py-1">
              Specs
            </Button>
          </div>

          <div className="text-gray-600 text-sm font-semibold space-y-1">
            <p>From 1,190 BDT</p>
            <p>FREE Delivery. World-class quality. <Link to="/trueprice" onClick={() => window.scrollTo(0, 0)} className="text-primary hover:underline">#TruePrice</Link>.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
