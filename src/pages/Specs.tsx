
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { RainbowButton } from '@/components/ui/rainbow-button';

const Specs = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Update page title and meta description
    document.title = "Ximpul Flow Specs - 500ml Premium Water Bottle Features Bangladesh";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete Ximpul Flow specifications. 304 stainless steel, 24hr insulation, leak-proof, BPA-free. Technical details & features.');
    }
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', 'https://ximpul.com/specs');
    }
  }, []);
  
  const scrollToBuy = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('buy')?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  const images = [
    '/ximpul-uploads/e0ab40cf-71f1-4c62-90fa-70a2b67902b7.png',
    '/ximpul-uploads/efa98636-f74a-42fd-b489-d2501fdd005b.png',
    '/ximpul-uploads/04a3a3a0-c455-422a-807a-040cb6e862d2.png',
    '/ximpul-uploads/03f9efc2-1901-49e0-b6f6-d2795d82216e.png',
    '/ximpul-uploads/2a8e6eb2-aaa6-4681-9569-4bf261f95aad.png',
    '/ximpul-uploads/4ac40de0-0374-40e9-8509-15236472e797.png',
    '/ximpul-uploads/d222f1b4-53aa-41fe-9628-140ff95de85a.png',
    '/ximpul-uploads/6b68e68c-2b79-433e-a04d-537a15ac7235.png',
    '/ximpul-uploads/023885cb-a561-49a1-b3de-c948156f896f.png'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="lg:text-3xl xl:text-4xl text-[#1d1d1f] mb-3 font-semibold text-3xl py-[10px]">
              <AnimatedText 
                text="Ximpul Flow" 
                textClassName="lg:text-3xl xl:text-4xl text-[#1d1d1f] font-semibold text-3xl" 
                underlineClassName="w-full text-primary" 
              />
            </div>

            <h2 className="lg:text-[2.43rem] xl:text-[2.916rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[2.916rem]" style={{ lineHeight: 1.09 }}>
              Every feature designed with your lifestyle in mind
            </h2>
          </div>
        </div>
        
        <div className="flex flex-col items-center bg-white">
          {images.map((src, index) => (
            <img 
              key={index} 
              src={src} 
              alt={`Spec image ${index + 1}`} 
              className="w-full max-w-5xl"
              onError={(e) => {
                console.log(`Failed to load image: ${src}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          ))}
        </div>
        
        <div className="bg-white py-16 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RainbowButton onClick={scrollToBuy}>
              Buy Now
            </RainbowButton>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Specs;
