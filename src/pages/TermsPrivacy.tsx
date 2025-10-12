import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const TermsPrivacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light text-foreground mb-6 leading-tight">
            Terms & Privacy
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-light mb-8">Terms & Conditions</h2>
            <p className="text-lg font-light leading-relaxed mb-4">
              By using this website, you agree to the following terms:
            </p>
            
            <ul className="space-y-4 mb-12">
              <li className="text-lg font-light leading-relaxed">
                All content and products are the property of Ximpul.
              </li>
              <li className="text-lg font-light leading-relaxed">
                We reserve the right to update or change content or pricing without prior notice.
              </li>
              <li className="text-lg font-light leading-relaxed">
                We aim to deliver high-quality products at #TruePrice — if you face any issues, please contact us.
              </li>
              <li className="text-lg font-light leading-relaxed">
                Refunds and exchanges are subject to our standard return policy (link to return policy if you add it).
              </li>
            </ul>

            <h2 className="text-3xl font-light mb-8">Privacy Policy</h2>
            <p className="text-lg font-light leading-relaxed mb-8">
              We respect your privacy.
            </p>
            
            <ul className="space-y-4 mb-12">
              <li className="text-lg font-light leading-relaxed">
                Any personal information (email, address, phone) collected is used only for processing your order and improving our service.
              </li>
              <li className="text-lg font-light leading-relaxed">
                We do not sell or share your information with third parties.
              </li>
              <li className="text-lg font-light leading-relaxed">
                All payments are processed through secure payment gateways.
              </li>
              <li className="text-lg font-light leading-relaxed">
                If you have questions about these terms, please contact us.
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default TermsPrivacy;
