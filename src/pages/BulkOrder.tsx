import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const BulkOrder = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: '',
    product: '',
    engraving: '',
    location: '',
    timeline: '',
    message: ''
  });

  useEffect(() => {
    document.title = "Bulk Order Policy - Ximpul | TruePrice Philosophy";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Ximpul Bulk Order Policy - Get flat per-unit reductions on bulk orders while maintaining our TruePrice philosophy. Fair pricing for everyone.');
    }
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', 'https://ximpul.com/bulk-order');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Bulk order request:', formData);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      quantity: '',
      product: '',
      engraving: '',
      location: '',
      timeline: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-semibold text-[#1d1d1f] leading-tight tracking-tight mb-6">
            Ximpul Bulk Order Policy
          </h1>
          
          <div className="apple-gradient-text text-xl md:text-2xl font-light leading-relaxed">
            Aligned With TruePrice Philosophy
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Greeting */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Hello Valuable Customer,</h2>
            <p className="text-lg leading-relaxed">
              Thank you for reaching out and showing interest in placing a bulk order with Ximpul. We truly appreciate your enthusiasm and trust in our brand.
            </p>
          </div>

          {/* About Ximpul */}
          <div className="bg-muted/30 rounded-3xl p-8">
            <h3 className="text-2xl font-semibold mb-4">About Ximpul</h3>
            <p className="text-lg leading-relaxed mb-4">
              Ximpul brings global‑quality products to Bangladesh at <span className="text-primary font-semibold">#TruePrice</span> — with full transparency, no compromise, and deep respect for your right to quality.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              Learn more: <a href="/about" className="text-primary hover:underline">ximpul.com/about</a>
            </p>
            <p className="text-lg leading-relaxed">
              We follow a Direct‑to‑Consumer (D2C) model, ensuring fair, consistent pricing for every customer.
            </p>
          </div>

          {/* 1. TruePrice Philosophy */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">1. TruePrice Philosophy — Price Always Fixed</h3>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>At Ximpul, we follow the TruePrice model. This means:</p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> No middlemen
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> No dealer margins
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> No artificial markup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> No negotiation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Same fair price for every customer
                </li>
              </ul>
              <p className="font-medium">
                Because of this, our base product price remains fixed, regardless of order size.
              </p>
              <p>
                However, bulk orders often require less handling and processing effort when prepared together. This operational efficiency allows us to offer a flat per‑unit reduction.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 italic">
                This is a benefit, not a "discount" on product cost.
              </div>
              <p className="italic text-muted-foreground">
                "This flat reduction is possible because preparing larger quantities together reduces our internal handling and processing effort."
              </p>
            </div>
          </div>

          {/* 2. Bulk Orders */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">2. Bulk Orders — Flat Per‑Unit Reduction (Non‑Negotiable)</h3>
            <p className="text-lg leading-relaxed mb-6">
              Bulk orders qualify for a flat per‑unit reduction, based on order quantity.
            </p>
            
            {/* Bulk Reduction Chart */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left">Quantity</th>
                    <th className="border border-gray-300 p-3 text-left">Flat Reduction Per Unit</th>
                    <th className="border border-gray-300 p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">10+ units</td>
                    <td className="border border-gray-300 p-3">৳ X off per unit</td>
                    <td className="border border-gray-300 p-3">Community / group orders</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">50+ units</td>
                    <td className="border border-gray-300 p-3">৳ Y off per unit</td>
                    <td className="border border-gray-300 p-3">Offices / schools / teams</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">100+ units</td>
                    <td className="border border-gray-300 p-3">৳ Z off per unit</td>
                    <td className="border border-gray-300 p-3">Corporate gifting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">500+ units</td>
                    <td className="border border-gray-300 p-3">৳ W off per unit</td>
                    <td className="border border-gray-300 p-3">Large institutions</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 space-y-2">
              <p className="font-semibold">Important Notes:</p>
              <ul className="space-y-1 ml-4">
                <li>• This reduction applies only to product price.</li>
                <li>• Engraving / personalization / add‑ons remain at regular cost.</li>
                <li>• Bulk reductions are fixed and non‑negotiable.</li>
                <li>• This maintains Ximpul's brand integrity and fairness.</li>
              </ul>
            </div>
          </div>

          {/* 3. Shipping & Pickup */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">3. Shipping & Pickup Rules</h3>
            <p className="text-lg leading-relaxed">
              Shipping / Pickup cost may be optimized or subsidized depending on order quantity.
            </p>
          </div>

          {/* 4. What We Need */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">4. What We Need To Generate Your Bulk Quote</h3>
            <div className="space-y-4">
              <p className="text-lg">Please share:</p>
              <ul className="space-y-2 ml-6 text-lg">
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Quantity needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Product model(s) & color(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Engraving / personalization details
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Delivery or pickup preference
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Location
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> Timeline / event date
                </li>
              </ul>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
                <p className="font-semibold mb-2">We will prepare your full quotation including:</p>
                <ul className="space-y-1 ml-4">
                  <li>• TruePrice base rate</li>
                  <li>• Flat bulk reduction</li>
                  <li>• Shipping (if applicable)</li>
                  <li>• Final total</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 5. Our Commitment */}
          <div className="bg-black text-white rounded-3xl p-8">
            <h3 className="text-2xl font-semibold mb-6">5. Our Commitment</h3>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                We aim to maintain fairness, transparency, and premium value for every customer — whether ordering 1 unit or 1,000 units.
              </p>
              <p>Our TruePrice model exists to protect:</p>
              <ul className="space-y-2 ml-6">
                <li>• Your trust</li>
                <li>• Our brand values</li>
                <li>• The integrity of your experience</li>
              </ul>
              <p>
                This is how we bring global‑standard, factory‑transparent pricing to Bangladesh.
              </p>
              <div className="bg-white/10 rounded-lg p-4 mt-6 italic">
                "We believe a price should be the same for everyone — clear, fair, and honest."
              </div>
            </div>
          </div>

          {/* Thank You */}
          <div className="text-center text-lg">
            <p>Thank you for choosing Ximpul and supporting a new standard of transparency in Bangladesh.</p>
          </div>

          {/* CTA Button */}
          <div className="text-center pt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => setIsModalOpen(true)}
            >
              Request a Bulk Quote
            </Button>
          </div>

        </div>
      </section>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request a Bulk Quote</DialogTitle>
            <DialogDescription>
              Fill out the form below and we'll get back to you with a detailed quotation.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input 
                  id="phone" 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity Needed *</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  required 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product">Product Model(s) & Color(s) *</Label>
              <Input 
                id="product" 
                required 
                placeholder="e.g., Ximpul Flow - Black, Blue"
                value={formData.product}
                onChange={(e) => setFormData({...formData, product: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="engraving">Engraving / Personalization Details</Label>
              <Textarea 
                id="engraving" 
                placeholder="Describe any customization needs"
                value={formData.engraving}
                onChange={(e) => setFormData({...formData, engraving: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input 
                  id="location" 
                  required 
                  placeholder="City, Area"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="timeline">Timeline / Event Date</Label>
                <Input 
                  id="timeline" 
                  placeholder="When do you need it?"
                  value={formData.timeline}
                  onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Additional Message</Label>
              <Textarea 
                id="message" 
                placeholder="Any other details we should know?"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">Submit Request</Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default BulkOrder;
