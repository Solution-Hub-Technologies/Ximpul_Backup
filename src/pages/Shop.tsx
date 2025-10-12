
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Shop = () => {
  const products = [
    {
      title: "Ximpul Flow Base Edition",
      subtitle: "Minimal. Functional. Everyday essential.",
      price: "1090 BDT",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80",
      features: [
        "Double-wall vacuum insulation",
        "18/8 stainless steel construction",
        "24-hour cold, 12-hour hot retention",
        "BPA-free materials",
        "Standard cap included",
        "Leak-proof design"
      ]
    },
    {
      title: "Ximpul Flow Lifestyle Edition",
      subtitle: "For those who live in motion.",
      price: "1590 BDT",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80",
      features: [
        "Everything in Base Edition",
        "Silicone protective sleeve",
        "Straw cap for easy drinking",
        "Carabiner hook",
        "Cleaning brush",
        "Premium gift packaging"
      ]
    }
  ];

  const lifestyleImages = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=400&q=80"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-light text-foreground mb-6">
            Choose Your Flow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Two editions. Infinite possibilities. Each bottle is a statement of freedom.
          </p>
        </div>
      </section>

      {/* Product Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {products.map((product, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-light">{product.title}</CardTitle>
                  <p className="text-muted-foreground font-light">{product.subtitle}</p>
                  <p className="text-3xl font-light text-primary mt-4">{product.price}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                    Join the Movement
                  </Button>
                  
                  <Accordion type="single" collapsible>
                    <AccordionItem value="features">
                      <AccordionTrigger className="text-left">
                        Features & Specifications
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {product.features.map((feature, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle Images */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {lifestyleImages.map((image, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg shadow-lg">
                <img
                  src={image}
                  alt={`Lifestyle ${index + 1}`}
                  className="w-full h-64 object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <h3 className="text-3xl font-light text-foreground mb-4">
              Make water free again.
            </h3>
            <p className="text-xl text-muted-foreground">
              Carry your Ximpul Flow.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
