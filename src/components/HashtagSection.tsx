
import React from 'react';
import { HighlightGroup, HighlighterItem, Particles } from '@/components/ui/highlighter';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typewriter } from '@/components/ui/typewriter';
import { Icons } from '@/components/ui/icons';

export const HashtagSection = () => {
  const hashtags = [
    '#MakeWaterFreeAgain',
    '#YourWaterYourFreedom',
    '#XimpulFlow',
    '#TruePrice',
    '#FlowWithFreedom',
    '#StopBuyingPlastic',
    '#BangladeshLifestyle',
    '#XimpulMovement',
    '#RefillRevolution'
  ];

  const handleSocialShare = (platform: string) => {
    const shareUrls = {
      facebook: 'https://www.facebook.com/itsximpul',
      instagram: 'https://www.instagram.com/itsximpul/',
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  return (
    <section className="apple-spacing bg-gradient-to-br from-primary/5 to-primary/10 fade-on-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Join the Movement
          </h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto min-h-[56px] md:min-h-[28px]">
            Be part of the revolution that's{' '}
            <Typewriter
              text={[
                "making water free again.",
                "ending plastic bottle waste.",
                "hydrating the future.",
                "flowing with freedom."
              ]}
              speed={60}
              waitTime={2500}
              deleteSpeed={30}
              className="text-primary font-medium"
            />
          </p>
        </div>

        <HighlightGroup className="group">
          <div className="group/item">
            <HighlighterItem className="rounded-3xl p-6">
              <div className="relative z-20 overflow-hidden rounded-3xl border border-border bg-background/80 backdrop-blur-sm">
                <Particles
                  className="absolute inset-0 -z-10 opacity-20 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-60"
                  quantity={150}
                  color="#3b82f6"
                  vy={-0.05}
                  vx={0.02}
                  staticity={20}
                  ease={20}
                />
                
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-center mb-8">
                    <Hash className="w-8 h-8 text-primary mr-3" />
                    <h3 className="text-2xl md:text-3xl font-light text-foreground">
                      Spread the Word
                    </h3>
                  </div>
                  
                  <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex flex-wrap justify-center gap-4">
                      {hashtags.slice(0, 3).map((hashtag, index) => (
                        <div
                          key={index}
                          className="group/hashtag relative overflow-hidden rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                        >
                          <div className="p-4 text-center">
                            <p className="text-primary font-medium text-sm md:text-base leading-relaxed group-hover/hashtag:text-primary/80 transition-colors whitespace-nowrap">
                              {hashtag}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/hashtag:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                      {hashtags.slice(3, 6).map((hashtag, index) => (
                        <div
                          key={index + 3}
                          className="group/hashtag relative overflow-hidden rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                        >
                          <div className="p-4 text-center">
                            <p className="text-primary font-medium text-sm md:text-base leading-relaxed group-hover/hashtag:text-primary/80 transition-colors whitespace-nowrap">
                              {hashtag}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/hashtag:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                      {hashtags.slice(6).map((hashtag, index) => (
                        <div
                          key={index + 6}
                          className="group/hashtag relative overflow-hidden rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                        >
                          <div className="p-4 text-center">
                            <p className="text-primary font-medium text-sm md:text-base leading-relaxed group-hover/hashtag:text-primary/80 transition-colors whitespace-nowrap">
                              {hashtag}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/hashtag:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-16 text-center">
                    <p className="text-muted-foreground font-light text-lg mb-6">
                      Share your Ximpul Flow journey and inspire others to choose freedom
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button 
                        onClick={() => handleSocialShare('instagram')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full"
                        size="icon"
                      >
                        <Icons.instagram className="w-5 h-5" />
                      </Button>
                      <Button 
                        onClick={() => handleSocialShare('facebook')}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full"
                        size="icon"
                      >
                        <Icons.facebook className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </HighlighterItem>
          </div>
        </HighlightGroup>
      </div>
    </section>
  );
};
