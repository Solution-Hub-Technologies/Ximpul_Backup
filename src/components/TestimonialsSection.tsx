
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [{
    quote: "I feel proud to use it.",
    author: "Rifat Ahmed",
    location: "Dhaka",
    rating: 5
  }, {
    quote: "Amazing build quality — feels like a global brand.",
    author: "Fatima Khan",
    location: "Chittagong",
    rating: 5
  }, {
    quote: "I love that I no longer need to buy plastic bottles.",
    author: "Sakib Rahman",
    location: "Sylhet",
    rating: 5
  }];

  return (
    <section className="apple-spacing bg-background fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            What Our Community Says
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Real stories from real customers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg rounded-3xl overflow-hidden">
              <CardContent className="p-8 text-center">
                <Quote className="w-8 h-8 text-primary mb-4 mx-auto opacity-60" />
                <p className="text-lg font-light text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center justify-center mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-medium text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
