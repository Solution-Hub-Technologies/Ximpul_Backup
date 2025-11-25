import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, X, Check } from 'lucide-react';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { toast } from 'sonner';

const BulkOrder = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    timeline: '',
    engraving: '',
    message: '',
    products: [{ model: '', color: '', quantity: '' }]
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabaseAdmin.from('bulk_orders').insert({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_location: formData.location,
        products: formData.products,
        timeline: formData.timeline || null,
        engraving: formData.engraving || null,
        additional_message: formData.message || null
      }).select().single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Send emails
      try {
        await fetch('https://ximpul.com:3002/send-bulk-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            customerLocation: formData.location,
            products: formData.products,
            timeline: formData.timeline,
            engraving: formData.engraving,
            additionalMessage: formData.message
          })
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      setIsModalOpen(false);
      setShowSuccessModal(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        timeline: '',
        engraving: '',
        message: '',
        products: [{ model: '', color: '', quantity: '' }]
      });
    } catch (error) {
      console.error('Error submitting bulk order:', error);
      toast.error('Failed to submit bulk order request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-8 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-[#1d1d1f] leading-tight tracking-tight mb-4 md:mb-6">
            Ximpul Bulk Order Policy
          </h1>
          
          <div className="apple-gradient-text text-lg sm:text-xl md:text-2xl font-light leading-relaxed">
            Aligned With TruePrice Philosophy
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
          
          {/* Greeting */}
          <div className="text-center space-y-3 md:space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">Hello Valuable Customer,</h2>
            <p className="text-base md:text-lg leading-relaxed">
              Thank you for reaching out and showing interest in placing a bulk order with Ximpul. We truly appreciate your enthusiasm and trust in our brand.
            </p>
          </div>

          {/* About Ximpul */}
          <div className="bg-muted/30 rounded-2xl md:rounded-3xl p-4 md:p-8">
            <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">About Ximpul</h3>
            <p className="text-base md:text-lg leading-relaxed mb-3 md:mb-4">
              Ximpul brings global‑quality products to Bangladesh at <span className="text-primary font-semibold">#TruePrice</span> — with full transparency, no compromise, and deep respect for your right to quality.
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-3 md:mb-4">
              Learn more: <a href="/about" className="text-primary hover:underline">ximpul.com/about</a>
            </p>
            <p className="text-base md:text-lg leading-relaxed">
              We follow a Direct‑to‑Consumer (D2C) model, ensuring fair, consistent pricing for every customer.
            </p>
          </div>

          {/* 1. TruePrice Philosophy */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">1. TruePrice Philosophy — Price Always Fixed</h3>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg leading-relaxed">
              <p>At Ximpul, we follow the TruePrice model. This means:</p>
              <ul className="space-y-2 ml-4 md:ml-6">
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
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 italic text-sm md:text-base">
                This is a benefit, not a "discount" on product cost.
              </div>
              <p className="italic text-muted-foreground text-sm md:text-base">
                "This flat reduction is possible because preparing larger quantities together reduces our internal handling and processing effort."
              </p>
            </div>
          </div>

          {/* 2. Bulk Orders */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">2. Bulk Orders — Flat Per‑Unit Reduction (Non‑Negotiable)</h3>
            <p className="text-base md:text-lg leading-relaxed mb-4 md:mb-6">
              Bulk orders qualify for a flat per‑unit reduction, based on order quantity.
            </p>
            
            {/* Bulk Reduction Chart */}
            <div className="overflow-x-auto mb-4 md:mb-6">
              <table className="w-full border-collapse border border-gray-300 text-sm md:text-base">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2 md:p-3 text-left text-xs md:text-base">Quantity</th>
                    <th className="border border-gray-300 p-2 md:p-3 text-left text-xs md:text-base">Flat Reduction Per Unit</th>
                    <th className="border border-gray-300 p-2 md:p-3 text-left text-xs md:text-base">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">10+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 20 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Community / group orders</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">50+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 40 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Offices / schools / teams</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">100+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 90 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Corporate gifting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">500+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 140 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Large institutions</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 md:p-4 space-y-2 text-sm md:text-base">
              <p className="font-semibold">Important Notes:</p>
              <ul className="space-y-1 ml-3 md:ml-4">
                <li>• This reduction applies only to product price.</li>
                <li>• Engraving / personalization / add‑ons remain at regular cost.</li>
                <li>• Bulk reductions are fixed and non‑negotiable.</li>
                <li>• This maintains Ximpul's brand integrity and fairness.</li>
              </ul>
            </div>
          </div>

          {/* 3. Shipping & Pickup */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">3. Shipping & Pickup Rules</h3>
            <p className="text-base md:text-lg leading-relaxed">
              Shipping / Pickup cost may be optimized or subsidized depending on order quantity.
            </p>
          </div>

          {/* 4. What We Need */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">4. What We Need To Generate Your Bulk Quote</h3>
            <div className="space-y-3 md:space-y-4">
              <p className="text-base md:text-lg">Please share:</p>
              <ul className="space-y-2 ml-4 md:ml-6 text-base md:text-lg">
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
              
              <div className="bg-green-50 border-l-4 border-green-500 p-3 md:p-4 mt-4 md:mt-6 text-sm md:text-base">
                <p className="font-semibold mb-2">We will prepare your full quotation including:</p>
                <ul className="space-y-1 ml-3 md:ml-4">
                  <li>• TruePrice base rate</li>
                  <li>• Flat bulk reduction</li>
                  <li>• Shipping (if applicable)</li>
                  <li>• Final total</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 5. Our Commitment */}
          <div className="bg-black text-white rounded-2xl md:rounded-3xl p-4 md:p-8">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">5. Our Commitment</h3>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg leading-relaxed">
              <p>
                We aim to maintain fairness, transparency, and premium value for every customer — whether ordering 1 unit or 1,000 units.
              </p>
              <p>Our TruePrice model exists to protect:</p>
              <ul className="space-y-2 ml-4 md:ml-6">
                <li>• Your trust</li>
                <li>• Our brand values</li>
                <li>• The integrity of your experience</li>
              </ul>
              <p>
                This is how we bring global‑standard, factory‑transparent pricing to Bangladesh.
              </p>
              <div className="bg-white/10 rounded-lg p-3 md:p-4 mt-4 md:mt-6 italic text-sm md:text-base">
                "We believe a price should be the same for everyone — clear, fair, and honest."
              </div>
            </div>
          </div>

          {/* Thank You */}
          <div className="text-center text-base md:text-lg">
            <p>Thank you for choosing Ximpul and supporting a new standard of transparency in Bangladesh.</p>
          </div>

          {/* CTA Button */}
          <div className="text-center pt-6 md:pt-8">
            <Button 
              size="lg" 
              className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              Request a Bulk Quote
            </Button>
          </div>

        </div>
      </section>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] p-3 md:p-6">
          <DialogHeader className="pb-2 md:pb-4">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5" />
              Request a Bulk Quote
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Fill out the form below and we'll get back to you with a detailed quotation.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 py-2 md:py-4">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
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
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 border-b pb-2">Product Information</h3>
              {formData.products.map((product, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`model-${index}`} className="text-xs">Edition *</Label>
                      <Select 
                        required 
                        value={product.model}
                        onValueChange={(value) => {
                          const newProducts = [...formData.products];
                          newProducts[index].model = value;
                          setFormData({...formData, products: newProducts});
                        }}
                      >
                        <SelectTrigger id={`model-${index}`} className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="base-edition">Base Edition</SelectItem>
                          <SelectItem value="lifestyle-edition">Lifestyle Edition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`color-${index}`} className="text-xs">Color *</Label>
                      <div className="flex gap-1 h-9">
                        <button
                          type="button"
                          onClick={() => {
                            const newProducts = [...formData.products];
                            newProducts[index].color = 'obsidian-black';
                            setFormData({...formData, products: newProducts});
                          }}
                          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded border transition-all ${
                            product.color === 'obsidian-black'
                              ? 'border-gray-900 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-black border border-gray-300" />
                          <span className="text-[9px] font-medium leading-none">Obsidian</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newProducts = [...formData.products];
                            newProducts[index].color = 'graphite-grey';
                            setFormData({...formData, products: newProducts});
                          }}
                          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded border transition-all ${
                            product.color === 'graphite-grey'
                              ? 'border-gray-900 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-gray-500 border border-gray-300" />
                          <span className="text-[9px] font-medium leading-none">Graphite</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity *</Label>
                      <Input 
                        id={`quantity-${index}`}
                        type="number" 
                        min="10"
                        required 
                        value={product.quantity}
                        onChange={(e) => {
                          const newProducts = [...formData.products];
                          newProducts[index].quantity = e.target.value;
                          setFormData({...formData, products: newProducts});
                        }}
                        placeholder="Min 10"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div>
                    {index === formData.products.length - 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData({...formData, products: [...formData.products, { model: '', color: '', quantity: '' }]})}
                        className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newProducts = formData.products.filter((_, i) => i !== index);
                          setFormData({...formData, products: newProducts});
                        }}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div>
                <Label htmlFor="timeline">Timeline / Event Date</Label>
                <Input 
                  id="timeline" 
                  type="date"
                  value={formData.timeline}
                  onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="engraving">Engraving/Personalize</Label>
                  <span className="text-sm text-gray-600">৳150 per laser engraving</span>
                </div>
                <Textarea 
                  id="engraving" 
                  placeholder="Enter engraving text"
                  value={formData.engraving}
                  onChange={(e) => setFormData({...formData, engraving: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="message">Additional Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Any other details we should know?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-initial" disabled={isSubmitting}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 Request Submitted!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">✓</div>
            <p className="text-lg font-medium">Thank you for your bulk order request!</p>
            <p className="text-gray-600">
              We've received your request and sent a confirmation email to <strong>{formData.email}</strong>.
            </p>
            <p className="text-gray-600">
              Our team will review your request and get back to you with a detailed quotation within 24-48 hours.
            </p>
            <Button onClick={() => setShowSuccessModal(false)} className="w-full mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default BulkOrder;
