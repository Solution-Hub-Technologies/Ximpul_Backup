
import React from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const FAQSection = () => {
  const faqItems = [{
    question: "What is Ximpul?",
    answer: "Ximpul is a lifestyle brand from Bangladesh dedicated to bringing global-quality products to people at #TruePrice — with full transparency and no compromise on innovation or product integrity."
  }, {
    question: "What is Ximpul Flow?",
    answer: "Ximpul Flow is our first initiative — a premium water bottle designed to help people carry their own safe, clean water, and contribute to making water free again — instead of paying again and again for bottled water."
  }, {
    question: "What does #TruePrice mean?",
    answer: "#TruePrice means you get the same factory quality as premium global brands — without paying an inflated brand price. It also means we don't sell fake \"factory-direct\" scrap. Every product is fully curated, tested, and guaranteed."
  }, {
    question: "Is Ximpul trying to copy other brands?",
    answer: "No. We do not copy brands. We source from top factories and work to bring equal or better quality products to Bangladesh — under our own brand, at honest prices."
  }, {
    question: "Why is packaging so simple?",
    answer: "We believe your money should go to the product, not the box. Our simple, eco-friendly packaging helps reduce waste and keeps the focus on delivering real value."
  }, {
    question: "Is there any compromise on product quality?",
    answer: "Never. Every Ximpul product is selected through strict quality control. Our mission is to deliver global quality at #TruePrice — without compromise."
  }, {
    question: "What types of products will Ximpul offer in the future?",
    answer: "We will gradually introduce lifestyle products across multiple categories: hydration, personal accessories, home, travel — always following our brand philosophy: The best. For all. At #TruePrice."
  }];

  return (
    <section id="faq" className="apple-spacing bg-muted/30 fade-on-scroll">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="lg:text-[2.7rem] xl:text-[3.24rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-6 text-[3.24rem]" style={{ lineHeight: 1.09 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-2xl px-6 bg-background">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-light leading-relaxed">
                <div dangerouslySetInnerHTML={{ 
                  __html: item.answer.replace(
                    /#TruePrice/g, 
                    '<a href="/trueprice" onclick="window.scrollTo(0, 0)" class="text-primary hover:underline">#TruePrice</a>'
                  )
                }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
