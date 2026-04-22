import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Thermometer, Shield, Droplets, Zap, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ProductShowcase = () => {
  const navigate = useNavigate();
  const [selectedColors, setSelectedColors] = useState({
    0: 'graphite-gray', // Base Edition default
    1: 'graphite-gray'  // Lifestyle Edition default
  });

  const goToSpecs = () => {
    navigate('/specs');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  const handleColorChange = (productIndex: number, colorValue: string) => {
    setSelectedColors(prev => ({
      ...prev,
      [productIndex]: colorValue
    }));
  };

  const products = [{
    name: 'Ximpul Flow',
    edition: 'Base Edition',
    emotionalTitle: 'Minimal. Everyday essential.',
    images: {
      'graphite-gray': '/ximpul-uploads/76e638c0-1db2-4fca-96f9-1e2e3b30e36b.png',
      'obsidian-black': '/ximpul-uploads/579120fc-bea9-4c7d-9c48-bae9573f46f2.png'
    },
    description: 'The next evolution of hydration and freedom.',
    price: '1,090 BDT',
    buttonText: 'Buy',
    currentlyViewing: 'Currently viewing',
    colors: [
      { name: 'Graphite Gray', value: 'graphite-gray', color: '#6b7280' },
      { name: 'Obsidian Black', value: 'obsidian-black', color: '#1a1a1a' }
    ],
    features: [{
      icon: <Droplets className="w-5 h-5" />,
      title: 'Capacity',
      description: '500ml capacity - perfect for daily hydration'
    }, {
      icon: <Thermometer className="w-5 h-5" />,
      title: 'Advanced Temperature Control',
      description: 'Keep Hot/Cold about 20-24 hours'
    }, {
      icon: <Shield className="w-5 h-5" />,
      title: 'Food-Grade Safety',
      description: 'Premium 304 stainless steel, BPA-free'
    }, {
      icon: <Droplets className="w-5 h-5" />,
      title: 'Leak-Proof Design',
      description: 'Advanced seal technology with triple-lock mechanism'
    }, {
      icon: <Zap className="w-5 h-5" />,
      title: 'Easy Clean',
      description: 'Wide mouth design for effortless cleaning'
    }]
  }, {
    name: 'Ximpul Flow',
    edition: 'Lifestyle Edition',
    emotionalTitle: 'For those who live in motion.',
    images: {
      'graphite-gray': '/ximpul-uploads/64d91283-a1ff-4902-a552-a85ad04e66c6.png',
      'obsidian-black': '/ximpul-uploads/88d45bfe-e1d3-4b43-9e01-c85b09d04533.png'
    },
    description: 'The next evolution of hydration, freedom, and style.',
    price: '1,590 BDT',
    buttonText: 'Buy',
    currentlyViewing: 'Currently viewing',
    colors: [
      { name: 'Graphite Gray', value: 'graphite-gray', color: '#6b7280' },
      { name: 'Obsidian Black', value: 'obsidian-black', color: '#1a1a1a' }
    ],
    features: [{
      icon: <Droplets className="w-5 h-5" />,
      title: 'Capacity',
      description: '500ml capacity - perfect for daily hydration'
    }, {
      icon: <Thermometer className="w-5 h-5" />,
      title: 'Advanced Temperature Control',
      description: 'Keep Hot/Cold about 20-24 hours'
    }, {
      icon: <Shield className="w-5 h-5" />,
      title: 'Food-Grade Safety',
      description: 'Premium 304 stainless steel, BPA-free'
    }, {
      icon: <Droplets className="w-5 h-5" />,
      title: 'Leak-Proof Design',
      description: 'Advanced seal technology with triple-lock mechanism'
    }, {
      icon: <Zap className="w-5 h-5" />,
      title: 'Easy Clean',
      description: 'Wide mouth design for effortless cleaning'
    }, {
      icon: <Recycle className="w-5 h-5" />,
      title: 'Lifestyle Accessories',
      description: 'Includes silicone sleeve, straw cap, cleaning brushes, and aluminium hook'
    }]
  }];

  return (
    <section id="products" className="py-12 sm:py-24 bg-background fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="lg:text-[2.7rem] xl:text-[3.24rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[3.24rem]" style={{
            lineHeight: 1.09
          }}>
            Choose Your Perfect Edition
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Two editions. Infinite possibilities. Each bottle tells your story.
          </p>
        </div>

        {/* Apple-style side-by-side comparison */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            {products.map((product, index) => (
              <div key={index} className="text-center space-y-4">
                {/* Product Image */}
                <div className="bg-muted/30 rounded-xl p-4 sm:p-8 h-32 sm:h-48 md:h-64 flex items-center justify-center">
                  <img
                    src={product.images[selectedColors[index]]}
                    alt={`${product.name} ${product.edition} - ${product.colors.find(c => c.value === selectedColors[index])?.name}`}
                    className="max-h-full w-auto object-contain"
                  />
                </div>

                {/* Color Options */}
                <div className="flex justify-center gap-2">
                  {product.colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${selectedColors[index] === color.value
                        ? 'border-foreground ring-2 ring-foreground/20'
                        : 'border-gray-300'
                        }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                      onClick={() => handleColorChange(index, color.value)}
                    />
                  ))}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-xl font-semibold text-foreground">
                    {product.name}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {product.edition}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground font-light leading-relaxed">
                    {product.emotionalTitle}
                  </p>
                </div>



                {/* Features - Apple-style with icons */}
                <div className="text-left space-y-4 pt-6 border-t border-border">
                  <h4 className="text-sm sm:text-base font-semibold text-foreground mb-4 text-center sm:text-left">
                    {product.edition} Specifications
                  </h4>
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="text-muted-foreground mt-0.5">
                        {feature.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm sm:text-base font-medium text-foreground leading-tight">
                          {feature.title}
                        </h5>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Centered Full Specifications Button */}
          <div className="flex justify-center items-center mt-8">
            <Button
              variant="outline"
              onClick={goToSpecs}
              className="px-8 py-3 hover:bg-foreground hover:text-background"
            >
              Full Specifications
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
