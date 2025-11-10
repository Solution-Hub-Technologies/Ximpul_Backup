
import React from 'react';
import { Droplets, Shield, Thermometer, Coffee, Award, Car } from 'lucide-react';

export const ProductFeaturesListSection = () => {
  const features = [{
    icon: <Droplets className="w-8 h-8 text-primary" />,
    title: "500ML Capacity",
    description: "Ideal for daily hydration — perfect size for office, gym, school or travel"
  }, {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "304 Stainless Steel",
    description: "Premium body material with PP cap and silicone sleeve — FDA approved & BPA-free"
  }, {
    icon: <Thermometer className="w-8 h-8 text-primary" />,
    title: "24-Hour Insulation",
    description: "Double-wall vacuum insulation keeps water hot or cold up to 24 hours"
  }, {
    icon: <Coffee className="w-8 h-8 text-primary" />,
    title: "Two Cap Options",
    description: "Choose between Standard Cap or Straw Cap — two drinking styles for your preference"
  }, {
    icon: <Award className="w-8 h-8 text-primary" />,
    title: "100% Leak-Proof",
    description: "Safe to carry in bags, perfect for any lifestyle activity"
  }, {
    icon: <Car className="w-8 h-8 text-primary" />,
    title: "Everyday Convenience",
    description: "Fits in car holders, portable handle rope, designed for daily use"
  }];

  return (
    <section id="features" className="apple-spacing bg-muted/30 fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Engineered for Life
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Every detail crafted with purpose. Premium materials meet innovative design.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-medium text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
