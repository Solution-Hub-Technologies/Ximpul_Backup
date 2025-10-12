
import React from 'react';

export const BrandStorySection = () => {
  const storyBlocks = [
    {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=2000&q=80',
      text: "Water falls from the sky. It should be free. Yet we pay for it every day — trapped in plastic, polluted, overpriced."
    },
    {
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=2000&q=80',
      text: "Ximpul Flow is here to change that. It is more than a bottle. It is a statement: Make Water Free Again."
    },
    {
      image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2000&q=80',
      text: "By using your own bottle — stylish, personalized with your own name — you take back the freedom to drink water as it was meant to be."
    },
    {
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80',
      text: "Will you keep paying for what falls from the sky? Or will you help make it free again — one refill at a time?"
    }
  ];

  return (
    <section className="py-0">
      {storyBlocks.map((block, index) => (
        <div
          key={index}
          className="relative min-h-screen flex items-center justify-center fade-on-scroll"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${block.image}')`
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-2xl md:text-4xl font-light text-white leading-relaxed">
              {block.text}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};
