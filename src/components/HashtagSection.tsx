
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
      facebookGroup: 'https://www.facebook.com/share/g/19fT86ktC8/',
      instagram: 'https://www.instagram.com/itsximpul/',
      tiktok: 'https://www.tiktok.com/@itsximpul',
      youtube: 'https://youtube.com/@ximpul_flow',
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
                      <Button 
                        onClick={() => handleSocialShare('facebookGroup')}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full"
                        size="icon"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 640 512" fill="currentColor">
                          <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/>
                        </svg>
                      </Button>
                      <Button 
                        onClick={() => handleSocialShare('tiktok')}
                        className="bg-black hover:bg-gray-800 text-white p-3 rounded-full"
                        size="icon"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 448 512" fill="currentColor">
                          <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/>
                        </svg>
                      </Button>
                      <Button 
                        onClick={() => handleSocialShare('youtube')}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full"
                        size="icon"
                      >
                        <Icons.youtube className="w-5 h-5" />
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
