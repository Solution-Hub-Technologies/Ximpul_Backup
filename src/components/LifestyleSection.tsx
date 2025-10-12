
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const LifestyleSection = () => {
  const lifestyleImages = [
    {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      caption: 'From morning commute to mountain trail — one bottle, all day.'
    },
    {
      image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
      caption: 'Convenient — drink hot or cold as you prefer.'
    },
    {
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
      caption: 'Not just a bottle — it\'s a lifestyle.'
    },
    {
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80',
      caption: 'Premium but affordable.'
    }
  ];

  return (
    <section className="apple-spacing bg-background fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Add it into your lifestyle
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Premium. Safer. Smarter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {lifestyleImages.map((item, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.caption}
                    className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white text-lg font-light leading-relaxed">{item.caption}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
