import React, { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';

const About = () => {
  useEffect(() => {
    // Update page title and meta description
    document.title = "About Ximpul - Bangladesh's Water Freedom Movement | Brand Story";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover Ximpul\'s mission to make water free again in Bangladesh. From founder story to brand values - join the movement toward conscious living.');
    }
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', 'https://ximpul.com/about');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <AnimatedText 
              text="About Ximpul" 
              textClassName="text-4xl md:text-6xl font-semibold text-[#1d1d1f] leading-tight tracking-tight" 
              underlineClassName="w-full text-primary" 
            />
          </div>
          
          <div className="apple-gradient-text text-xl md:text-2xl font-light leading-relaxed">
            "Ximpul brings global-quality products to Bangladesh — at #TruePrice — with full transparency, no compromise, and deep respect for your right to quality."
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Why Ximpul Exists */}
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-center">Why does Ximpul exist?</h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p className="text-center font-medium">
                Because in a country like Bangladesh, <span className="text-primary font-semibold">#TruePrice</span> is a right, not a luxury.
              </p>
              <p>
                People here should not be forced to overpay. Nor should they be forced to trust random, unreliable "factory-direct" sellers — where so often, scrap products arrive.
              </p>
              <p className="font-medium">
                At Ximpul, we are your bridge.
              </p>
              <p>
                We connect the best, most reliable factories with a transparent, trusted platform. We curate, test, and guarantee what we offer.
              </p>
            </div>
          </div>

          {/* Our Promise */}
          <div className="bg-muted/30 rounded-3xl p-8">
            <h3 className="text-2xl font-semibold mb-6 text-center">Our Promise:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>No fakes</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>No scraps</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>No inflated prices</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>No brand premium — only product value</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>Simple packaging — because why pay for boxes instead of products?</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <span>100% focus on quality and innovation — because we believe Bangladesh deserves the best.</span>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold mb-6">Vision</h3>
            <p className="text-lg leading-relaxed">
              To make global-quality products accessible to everyone in Bangladesh — at an honest <span className="text-primary font-semibold">#TruePrice</span> — with full transparency, no compromise, and deep respect for the people we serve.
            </p>
          </div>

          {/* Mission */}
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-semibold mb-6">Mission</h3>
            <div className="space-y-4 text-lg leading-relaxed text-left">
              <p>
                In today's world, we all know the truth — many "branded" products sell at 5 to 10 times their actual cost. China is exposing this reality. People now understand what <span className="text-primary font-semibold">#TruePrice</span> is.
              </p>
              <p>
                But in Bangladesh, millions still pay these high prices — or settle for poor-quality factory scrap when trying to shop "direct."
              </p>
              <p className="font-medium">
                At Ximpul, we believe this is unfair.
              </p>
              <p>
                We believe that good design, premium quality, and innovation should not be locked behind a brand name.
              </p>
              <p>
                We are here to change that — through honest sourcing, constant innovation, and the courage to bring you products that are as good as the best brands — but at the real <span className="text-primary font-semibold">#TruePrice</span>.
              </p>
              <p className="font-medium">
                This is not about copying brands.
              </p>
              <p>
                It is about giving people the same quality — or better — while protecting them from fake products, broken promises, or overpriced labels.
              </p>
            </div>
          </div>

          {/* Brand Layer */}
          <div className="bg-black text-white rounded-3xl p-8">
            <h3 className="text-2xl font-semibold mb-8 text-center">Brand Layer</h3>
            <div className="space-y-6">
              <div className="border-b border-gray-600 pb-4">
                <h4 className="text-xl font-semibold mb-2">Ximpul (mother brand)</h4>
                <p className="text-gray-300">
                  Build an ecosystem of high-quality lifestyle products at #TruePrice — with trust, transparency, and innovation for Bangladesh
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Ximpul Flow (first initiative)</h4>
                <p className="text-gray-300">
                  Start a movement to make water free again by helping people own their water — with a premium bottle built for freedom, convenience, and sustainability
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default About;
