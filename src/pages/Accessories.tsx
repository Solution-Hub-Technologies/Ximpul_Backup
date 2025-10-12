
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const Accessories = () => {
  const accessories = [
    {
      name: "Silicone Sleeve",
      price: "300 BDT",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80",
      description: "Extra protection with style"
    },
    {
      name: "Straw Cap",
      price: "250 BDT",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=400&q=80",
      description: "Easy sipping on the go"
    },
    {
      name: "Standard Cap",
      price: "200 BDT",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80",
      description: "Classic leak-proof design"
    },
    {
      name: "Handle Rope",
      price: "200 BDT",
      image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=400&q=80",
      description: "Comfortable carrying solution"
    },
    {
      name: "Cleaning Brush",
      price: "150 BDT",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      description: "Keep your bottle pristine"
    },
    {
      name: "Aluminium Hook",
      price: "200 BDT",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=400&q=80",
      description: "Attach anywhere with confidence"
    },
    {
      name: "Engraving Service",
      price: "300 BDT",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80",
      description: "Make it truly yours"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div 
          className="relative min-h-[60vh] flex items-center justify-center bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2000&q=80')`
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-light mb-6">
              Customize Your Flow
            </h1>
            <p className="text-xl font-light max-w-2xl mx-auto">
              Lifestyle is choice. Add-ons to match your life.
            </p>
          </div>
        </div>
      </section>

      {/* Accessories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {accessories.map((accessory, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={accessory.image}
                    alt={accessory.name}
                    className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-medium">{accessory.name}</CardTitle>
                  <p className="text-2xl font-light text-primary">{accessory.price}</p>
                </CardHeader>
                
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground text-sm">{accessory.description}</p>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Banner */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-light text-foreground mb-6">
            Why users love customizing their Ximpul Flow
          </h3>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            "The accessories make it feel completely personal. It's not just a bottle anymore — 
            it's my bottle, designed exactly how I want it."
          </p>
          <p className="text-primary font-medium mt-4">— Sarah Ahmed, Dhaka</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Accessories;
