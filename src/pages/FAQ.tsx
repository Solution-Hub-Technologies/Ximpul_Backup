
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: "What is Ximpul?",
      answer: "Ximpul is a lifestyle brand from Bangladesh dedicated to bringing global-quality products to people at #TruePrice — with full transparency and no compromise on innovation or product integrity."
    },
    {
      question: "What does #TruePrice mean?",
      answer: "#TruePrice means you get the same factory quality as premium global brands — without paying an inflated brand price. It also means we don't sell fake \"factory-direct\" scrap. Every product is fully curated, tested, and guaranteed."
    },
    {
      question: "Is Ximpul trying to copy other brands?",
      answer: "No. We do not copy brands. We source from top factories and work to bring equal or better quality products to Bangladesh — under our own brand, at honest prices."
    },
    {
      question: "Why is packaging so simple?",
      answer: "We believe your money should go to the product, not the box. Our simple, eco-friendly packaging helps reduce waste and keeps the focus on delivering real value."
    },
    {
      question: "What is Ximpul Flow?",
      answer: "Ximpul Flow is our first initiative — a premium water bottle designed to help people carry their own safe, clean water, and contribute to making water free again — instead of paying again and again for bottled water."
    },
    {
      question: "Is there any compromise on product quality?",
      answer: "Never. Every Ximpul product is selected through strict quality control. Our mission is to deliver global quality at #TruePrice — without compromise."
    },
    {
      question: "What types of products will Ximpul offer in the future?",
      answer: "We will gradually introduce lifestyle products across multiple categories: hydration, personal accessories, home, travel — always following our brand philosophy: The best. For all. At #TruePrice."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light text-foreground mb-6 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl md:text-2xl font-light text-muted-foreground mb-8">
            Everything you need to know about Ximpul Flow
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-2xl px-6 bg-background"
              >
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-light leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
