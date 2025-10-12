import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ChevronRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const TruePrice = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  useEffect(() => {
    // Update page title and meta description
    document.title = "#TruePrice - Ximpul's Transparent Pricing Philosophy";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover #TruePrice - Ximpul\'s transparent pricing philosophy. World-class quality without brand tax. Premium products at honest prices for Bangladesh.');
    }
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', 'https://ximpul.com/trueprice');
    }
  }, []);

  const faqs = [
    {
      question: "Is this the same product as big international brands?",
      answer: "👉 In many cases, yes. We source from the same certified factories that supply global brands. The difference? We remove layers of brand tax, marketing costs, and middlemen — you pay only for real product."
    },
    {
      question: "Why is your price not super cheap like Daraz or street shops?",
      answer: "👉 Because cheap often means risky. Many of those sellers use factory rejects, fake copies, or compromised materials. We deliver certified factory-quality — fully tested, fully guaranteed — at an honest price."
    },
    {
      question: "Will quality be compromised because the price is lower than global brands?",
      answer: "👉 No. You get the same material, the same build, the same performance. You simply avoid the extra costs brands add for non-product reasons."
    },
    {
      question: "Can you guarantee product authenticity?",
      answer: "👉 Yes. Every Ximpul product passes strict internal curation before reaching you. If anything fails, we don't sell it. Period."
    },
    {
      question: "How long will this pricing model continue?",
      answer: "👉 Forever. #TruePrice is not a marketing offer. It is Ximpul's core philosophy for all products — today and always."
    },
    {
      question: "Is Ximpul a copycat brand?",
      answer: "👉 No. We don't copy anyone. We build a new kind of brand — transparent, honest, independent. We respect your intelligence — and your money."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-foreground mb-8 leading-tight tracking-tight">
            #TruePrice
          </h1>
          <p className="text-2xl md:text-3xl font-light text-muted-foreground leading-relaxed">
            The Heart of Ximpul
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-32">
          {/* What is TruePrice Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold mb-12 leading-tight">What is #TruePrice?</h2>
            
            <div className="text-2xl md:text-3xl font-light leading-relaxed space-y-6">
              <p>#TruePrice is not a discount. It's not a special offer.</p>
              <p className="font-semibold apple-gradient-text">It's a movement. It's your right.</p>
            </div>
          </div>

          {/* The Truth Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-semibold mb-8">The Truth Nobody Tells You</h3>
              <div className="space-y-6 text-lg leading-relaxed">
                <p>Around the world, many global brands sell products made in the same factories — but they charge 2, 3, even 5 times higher prices.</p>
                
                <div className="space-y-4">
                  <p>👉 Are these products really better?</p>
                  <p>👉 Do they cost more to make?</p>
                  <p className="font-semibold text-xl">👉 The answer is simple: No.</p>
                </div>

                <p>You are paying extra not for better materials — but for things you don't need:</p>
              </div>
            </div>
            
            <div className="bg-muted/20 rounded-3xl p-8">
              <div className="space-y-4 text-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Brand name</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Expensive marketing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Celebrity endorsements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Fancy packaging</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Big corporate profits</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Multiple middlemen</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-muted">
                <p className="font-semibold text-lg">The actual product?</p>
                <p className="text-lg">Often, it's exactly the same.</p>
              </div>
            </div>
          </div>

          {/* Ximpul Differently Section */}
          <div className="text-center max-w-5xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-semibold mb-8">Ximpul Does It Differently</h3>
            <div className="text-xl md:text-2xl font-light leading-relaxed mb-12 space-y-4">
              <p>We believe people in Bangladesh are too smart for this game.</p>
              <p>You deserve the same global factory quality — without the extra layers.</p>
              <p className="font-semibold apple-gradient-text">That's why we built Ximpul.</p>
            </div>

            <div className="bg-muted/20 rounded-3xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-xl font-semibold mb-4">How We Do It:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Direct sourcing from certified factories</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">No fake or scrap products</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Simple, honest packaging</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Full curation and guarantee</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold mb-4">What You Get:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500 text-lg">✓</span>
                      <span className="text-sm">Pure product, not hype</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500 text-lg">✓</span>
                      <span className="text-sm">Real factory quality</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500 text-lg">✓</span>
                      <span className="text-sm">Part of a movement</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500 text-lg">✓</span>
                      <span className="text-sm">Permanent promise</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bangladesh Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-semibold mb-8">Why #TruePrice Matters for Bangladesh</h3>
              <div className="space-y-3 mb-6">
                <p className="text-lg">👉 Bangladesh is full of cheap knockoffs and fake "factory-direct" sellers.</p>
                <p className="text-lg">👉 People often think low price means good deal — but get low quality instead.</p>
                <p className="text-lg">👉 High price doesn't always mean better — often it's just branding.</p>
              </div>

              <p className="text-lg font-semibold mb-4">Ximpul breaks both traps.</p>
              <p className="text-lg mb-6">We protect you from both:</p>

              <div className="bg-muted/30 rounded-2xl p-6 mb-8">
                <div className="space-y-2">
                  <p className="text-lg">❌ Overpriced brand games</p>
                  <p className="text-lg">❌ Cheap scrap quality</p>
                </div>
              </div>

              <p className="text-lg leading-relaxed mb-4">
                We are building Bangladesh's first transparent premium lifestyle brand — where global quality meets honest pricing.
              </p>
              
              <p className="text-lg font-semibold">
                Because you deserve real quality, at a price that finally makes sense.
              </p>
            </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-semibold mb-12 text-center">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-muted rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-muted/20 transition-colors"
                  >
                    <h4 className="text-lg font-semibold pr-4">{faq.question}</h4>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  
                  {openFAQ === index && (
                    <div className="px-6 pb-6">
                      <div className="pt-4 border-t border-muted">
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final Message */}
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white rounded-3xl p-12 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="text-4xl">🚀</div>
              <blockquote className="text-2xl md:text-3xl font-light leading-relaxed space-y-6">
                <p>"We are not here to sell you products.</p>
                <p>We are here to give you back control.</p>
                <p>This is not about price.</p>
                <p className="font-semibold">This is about fairness."</p>
              </blockquote>
              <div className="text-3xl md:text-4xl font-bold apple-gradient-text">#TruePrice</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                <Button size="lg" className="bg-black hover:bg-black/90 text-white px-12 py-4 text-lg font-medium rounded-full">
                  Shop Ximpul Flow
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about" onClick={() => window.scrollTo(0, 0)}>
                <Button size="lg" variant="outline" className="px-12 py-4 text-lg font-medium rounded-full border-2">
                  Learn About Ximpul
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default TruePrice;
