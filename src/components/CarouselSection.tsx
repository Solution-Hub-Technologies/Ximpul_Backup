
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { CheckCircle } from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';

export const CarouselSection = () => {
  const [api, setApi] = React.useState<CarouselApi>();
  const slides = [
    "Make Water Free Again: Reusable lifestyle bottle to replace single-use plastic",
    "Apple-level Product Experience: Minimal, premium, clean design",
    "One Bottle, Two Modes: Switch caps for how you want to drink",
    "Personalized & Giftable: Engraving option makes it uniquely yours",
    "Built for Bangladesh: First lifestyle bottle with this mission and quality in BD",
    "World-Class Quality: Guarantee of premium build at an affordable price",
    "Safe Beyond Plastic: Safer than plastic bottles — health first",
    "Part of Your Life: Designed to be an essential lifestyle product",
    "Lifestyle Add-ons: Accessories and engraving to match your personal style",
    "Convenient & Flexible: Hot or cold — your choice, your style"
  ];

  useEffect(() => {
    if (!api) {
      return;
    }
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
            Introducing Ximpul Flow
          </h2>
          <p className="text-lg font-light leading-relaxed max-w-3xl mx-auto text-muted-foreground">
            Every feature designed with your lifestyle in mind
          </p>
        </div>

        <div className="relative">
          <Carousel
            setApi={setApi}
            className="w-full max-w-4xl mx-auto"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {slides.map((slide, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <BorderBeam size={250} duration={12} delay={index * 2} />
                      <CardContent className="flex aspect-[4/3] items-center justify-center p-6">
                        <div className="text-center space-y-4">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                          <span className="text-sm font-medium leading-relaxed text-foreground">
                            {slide}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
