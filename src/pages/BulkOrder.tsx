import React, { useEffect, useState, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BulkOrder = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const quotationRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    timeline: '',
    engraving: '',
    message: '',
    products: [{ model: '', color: '', quantity: '', accessories: [] as Array<{name: string, quantity: number}> }]
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

  const generatePDF = async (): Promise<string> => {
    console.log('🔄 Starting PDF generation...');
    
    // Temporarily show quotation to render it
    setShowQuotationModal(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for render
    
    if (!quotationRef.current) {
      console.error('❌ quotationRef.current is null');
      setShowQuotationModal(false);
      return '';
    }
    
    console.log('📸 Capturing canvas...');
    const canvas = await html2canvas(quotationRef.current, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    setShowQuotationModal(false); // Hide it again
    
    console.log('📄 Generating PDF...');
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const pdfBase64 = pdf.output('dataurlstring').split(',')[1];
    
    console.log('✅ PDF generated, size:', pdfBase64.length, 'characters');
    return pdfBase64;
  };

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

      // Generate PDF quotation
      console.log('📄 Generating PDF quotation...');
      const pdfBase64 = await generatePDF();
      console.log('✅ PDF generated successfully, size:', pdfBase64.length, 'characters');

      // Send emails using same system as ColorSelector
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Skipping email send');
        console.log('📧 Would send admin email to:', 'ximpulshop@gmail.com');
        console.log('📧 Would send customer email to:', formData.email);
        console.log('📎 PDF attachment ready:', pdfBase64.substring(0, 50) + '...');
      }
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Fetch admin email configuration
        const { data: emailConfig } = await supabase
          .from('email_config')
          .select('*')
          .eq('config_type', 'customer');
        
        // Use configured emails or fallback to default
        let adminEmails = 'ximpulshop@gmail.com';
        let ccEmails = '';
        
        if (emailConfig && emailConfig.length > 0) {
          const config = emailConfig[0];
          if (config?.to_emails?.length > 0) {
            adminEmails = config.to_emails.join(',');
          }
          if (config?.cc_emails?.length > 0) {
            ccEmails = config.cc_emails.join(',');
          }
        }
        
        // Fetch admin email template
        const { data: adminTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'bulk_order_admin')
          .single();
        
        // Build products summary
        const productsSummary = formData.products.map(p => 
          `${p.model} - ${p.color} (Qty: ${p.quantity})`
        ).join(', ');
        
        // Send admin notification email
        let adminEmailHTML = '';
        let adminSubject = `Bulk Order Request - ${formData.name}`;
        
        if (adminTemplate) {
          adminEmailHTML = adminTemplate.template
            .replace(/\$\{customerName\}/g, formData.name)
            .replace(/\$\{customerPhone\}/g, formData.phone)
            .replace(/\$\{customerEmail\}/g, formData.email)
            .replace(/\$\{customerLocation\}/g, formData.location)
            .replace(/\$\{products\}/g, productsSummary)
            .replace(/\$\{timeline\}/g, formData.timeline || 'Not specified')
            .replace(/\$\{engraving\}/g, formData.engraving || 'No')
            .replace(/\$\{message\}/g, formData.message || 'None')
            .replace(/{{customerName}}/g, formData.name)
            .replace(/{{customerPhone}}/g, formData.phone)
            .replace(/{{customerEmail}}/g, formData.email)
            .replace(/{{customerLocation}}/g, formData.location)
            .replace(/{{products}}/g, productsSummary)
            .replace(/{{timeline}}/g, formData.timeline || 'Not specified')
            .replace(/{{engraving}}/g, formData.engraving || 'No')
            .replace(/{{message}}/g, formData.message || 'None');
          
          adminSubject = adminTemplate.subject
            .replace(/\$\{customerName\}/g, formData.name)
            .replace(/{{customerName}}/g, formData.name);
        } else {
          adminEmailHTML = `<h2>Bulk Order Request</h2><p><strong>Customer:</strong> ${formData.name}</p><p><strong>Phone:</strong> ${formData.phone}</p><p><strong>Email:</strong> ${formData.email}</p><p><strong>Location:</strong> ${formData.location}</p><p><strong>Products:</strong> ${productsSummary}</p><p><strong>Timeline:</strong> ${formData.timeline || 'Not specified'}</p><p><strong>Engraving:</strong> ${formData.engraving || 'No'}</p><p><strong>Message:</strong> ${formData.message || 'None'}</p>`;
        }
        
        const adminEmailParams: any = {
          to: adminEmails,
          subject: adminSubject,
          message: adminEmailHTML,
          from_name: 'Ximpul Shop',
          attachment: pdfBase64,
          attachment_name: `Bulk_Order_Quotation_${formData.name.replace(/\s+/g, '_')}.pdf`
        };
        
        if (ccEmails) {
          adminEmailParams.cc = ccEmails;
        }
        
        if (!isDevelopment) {
          await fetch('https://ximpul.com/smtp-mailer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(adminEmailParams)
          });
        }
        
        // Send confirmation email to customer
        const { data: customerTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'bulk_order_customer')
          .single();
        
        let customerEmailHTML = '';
        let customerSubject = 'Bulk Order Request Received - Ximpul';
        
        if (customerTemplate) {
          customerEmailHTML = customerTemplate.template
            .replace(/\$\{customerName\}/g, formData.name)
            .replace(/{{customerName}}/g, formData.name);
          
          customerSubject = customerTemplate.subject
            .replace(/\$\{customerName\}/g, formData.name)
            .replace(/{{customerName}}/g, formData.name);
        } else {
          customerEmailHTML = `<h2>Bulk Order Request Received</h2><p>Dear ${formData.name},</p><p>Thank you for your bulk order request!</p><p>We'll review your request and get back to you with a detailed quotation within 24-48 hours.</p><p>Best regards,<br>Team Ximpul<br>01881408611</p>`;
        }
        
        if (!isDevelopment) {
          await fetch('https://ximpul.com/smtp-mailer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              to: formData.email,
              subject: customerSubject,
              message: customerEmailHTML,
              from_name: 'Ximpul Shop'
            })
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        if (!isDevelopment) {
          toast.error('Failed to send email notifications');
        }
      }

      setIsModalOpen(false);
      setShowSuccessModal(true);
      
      if (isDevelopment) {
        toast.success('✅ Development mode: Order saved, PDF generated (emails skipped)');
      }
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        timeline: '',
        engraving: '',
        message: '',
        products: [{ model: '', color: '', quantity: '', accessories: [] }]
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
                    <th className="border border-gray-300 p-2 md:p-3 text-left text-xs md:text-base">Bulk Price Per Unit</th>
                    <th className="border border-gray-300 p-2 md:p-3 text-left text-xs md:text-base">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">10+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 20 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 1170 per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Community / group orders</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">50+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 40 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 1150 per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Offices / schools / teams</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">100+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 90 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 1100 per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">Corporate gifting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 md:p-3">500+ units</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 140 off per unit</td>
                    <td className="border border-gray-300 p-2 md:p-3">৳ 1050 per unit</td>
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
              className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto bg-black hover:bg-gray-800"
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
            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 border-b pb-2">Product Information</h3>
              {formData.products.map((product, index) => (
                <div key={index} className="space-y-3">
                <div className="flex gap-2 items-end">
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
                      {product.quantity && parseInt(product.quantity) > 0 && parseInt(product.quantity) < 10 && (
                        <p className="text-xs text-red-600 mt-1">At least 10 required</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {index === formData.products.length - 1 && formData.products.length < 4 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!product.model || !product.color || !product.quantity}
                        onClick={() => setFormData({...formData, products: [...formData.products, { model: '', color: '', quantity: '', accessories: [] }]})}
                        className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : index > 0 ? (
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
                    ) : null}
                  </div>
                </div>
                {product.model && product.model === 'base-edition' && (
                  <div className="ml-0 pl-0 md:pl-4 border-l-0 md:border-l-2 border-gray-200">
                    <Label className="text-xs text-gray-600 mb-2 block">Accessories (Optional)</Label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {[
                        { name: 'Straw Cap', price: 350 },
                        { name: 'Cleaning Brush', price: 90 },
                        { name: 'Straw Cleaning Brush', price: 50 },
                        { name: 'Aluminium Hook', price: 90 }
                      ].map((acc) => {
                        const accessory = (product.accessories || []).find(a => a.name === acc.name);
                        return (
                        <div key={acc.name} className="p-3 rounded border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-medium">{acc.name}</div>
                            <div className="text-xs text-gray-600">৳{acc.price}</div>
                          </div>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            placeholder="Min 10"
                            value={accessory?.quantity || ''}
                            onChange={(e) => {
                              const newProducts = [...formData.products];
                              const accessories = newProducts[index].accessories || [];
                              const value = e.target.value;
                              const qty = value === '' ? 0 : Math.max(0, parseInt(value));
                              
                              if (value === '' || qty === 0) {
                                newProducts[index].accessories = accessories.filter(a => a.name !== acc.name);
                              } else if (qty >= 10) {
                                const existingIndex = accessories.findIndex(a => a.name === acc.name);
                                if (existingIndex >= 0) {
                                  accessories[existingIndex].quantity = qty;
                                } else {
                                  accessories.push({ name: acc.name, quantity: qty });
                                }
                                newProducts[index].accessories = accessories;
                              } else {
                                const existingIndex = accessories.findIndex(a => a.name === acc.name);
                                if (existingIndex >= 0) {
                                  accessories[existingIndex].quantity = qty;
                                } else {
                                  accessories.push({ name: acc.name, quantity: qty });
                                }
                                newProducts[index].accessories = accessories;
                              }
                              setFormData({...formData, products: newProducts});
                            }}
                            className="h-10 text-base w-full"
                          />
                          {accessory && accessory.quantity > 0 && accessory.quantity < 10 && (
                            <p className="text-xs text-red-600 mt-1">At least 10 required</p>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </div>
              ))}
              <div>
                <Label htmlFor="timeline">Timeline / Event Date</Label>
                <Input 
                  id="timeline" 
                  type="date"
                  value={formData.timeline}
                  onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                  className="h-10 text-base"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                />
              </div>
              <div>
                <Label className="mb-2 block">Engraving/Personalize <span className="text-sm text-gray-600">(৳150 per laser engraving)</span></Label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="engraving-yes"
                      checked={formData.engraving === 'yes'}
                      onChange={(e) => setFormData({...formData, engraving: e.target.checked ? 'yes' : ''})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="engraving-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="engraving-no"
                      checked={formData.engraving === ''}
                      onChange={(e) => setFormData({...formData, engraving: e.target.checked ? '' : 'yes'})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="engraving-no" className="cursor-pointer">No</Label>
                  </div>
                </div>
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})}
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
                <Label htmlFor="location">Address *</Label>
                <Textarea 
                  id="location" 
                  required 
                  placeholder="Enter your full address"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  rows={2}
                />
              </div>
            </div>



            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 hover:bg-black hover:text-white" 
                onClick={() => setShowQuotationModal(true)}
                disabled={!formData.name || !formData.email || formData.products.some(p => !p.model || !p.color || !p.quantity)}
              >
                Quotation Preview
              </Button>
              <Button type="submit" className="flex-1 bg-black hover:bg-gray-800" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-initial" disabled={isSubmitting}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quotation Preview Modal */}
      <Dialog open={showQuotationModal} onOpenChange={setShowQuotationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Order Quotation Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Professional Quotation Invoice */}
            <div ref={quotationRef} className="bg-white border-2 border-gray-300 p-8" id="quotation-invoice">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-bold">ximpul</h1>
                  <p className="text-sm mt-2">www.ximpul.com</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-semibold">#TruePrice</p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-center mb-6">Quotation</h2>

              {/* Quotation Details */}
              <div className="flex justify-between mb-6 text-sm">
                <div>
                  <p><strong>Quotation number:</strong> {new Date().getFullYear()}/{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}</p>
                  <p className="mt-2"><strong>Customer Details</strong></p>
                  <p>{formData.name}</p>
                  <p>{formData.location}</p>
                  <p><strong>Mobile:</strong> {formData.phone} | <strong>Email:</strong> {formData.email}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date:</strong> {new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-sm font-semibold">Item Name</th>
                    <th className="text-center py-2 text-sm font-semibold">Quantity</th>
                    <th className="text-right py-2 text-sm font-semibold">Unit Price</th>
                    <th className="text-right py-2 text-sm font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.filter(p => p.quantity).map((product, idx) => {
                    const qty = parseInt(product.quantity);
                    const isBaseEdition = product.model === 'base-edition';
                    const basePrice = isBaseEdition ? 1190 : 1650;
                    let bulkPrice = basePrice;
                    
                    if (isBaseEdition) {
                      if (qty >= 500) bulkPrice = 1050;
                      else if (qty >= 100) bulkPrice = 1100;
                      else if (qty >= 50) bulkPrice = 1150;
                      else if (qty >= 10) bulkPrice = 1170;
                    }
                    
                    const productTotal = bulkPrice * qty;
                    const colorName = product.color === 'obsidian-black' ? 'Obsidian Black' : 'Graphite Grey';
                    const editionName = isBaseEdition ? 'Base Edition' : 'Lifestyle Edition';

                    return (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-gray-200">
                          <td className="py-3 text-sm">
                            <div className="font-semibold">Ximpul Flow {editionName} - {colorName}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              <strong>Including:</strong> {isBaseEdition ? 'Silicon sleeve' : 'Silicon sleeve, Straw cap, Cleaning brush, Straw cleaning brush, Aluminium hook'}<br/>
                              <strong>Temperature:</strong> Keeps drinks hot for 12 hours, cold for 24 hours.<br/>
                              <strong>Material:</strong> Crafted from premium 304 SS food-grade.<br/>
                              <strong>Security:</strong> Triple-lock, advanced leak-proof seal technology.<br/>
                              <strong>Maintenance:</strong> Wide mouth opening for effortless cleaning.
                            </div>
                          </td>
                          <td className="py-3 text-center text-sm">{qty}.00 Pc(s)</td>
                          <td className="py-3 text-right text-sm">{bulkPrice.toFixed(2)}</td>
                          <td className="py-3 text-right text-sm font-semibold">{productTotal.toFixed(2)}</td>
                        </tr>

                        {/* Accessories */}
                        {isBaseEdition && (product.accessories || []).map((acc, accIdx) => {
                          const prices: any = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminium Hook': 90 };
                          const accPrice = prices[acc.name];
                          const accTotal = accPrice * acc.quantity;
                          return (
                            <tr key={`acc-${accIdx}`} className="border-b border-gray-200">
                              <td className="py-3 text-sm pl-4">{acc.name}</td>
                              <td className="py-3 text-center text-sm">{acc.quantity}.00 Pc(s)</td>
                              <td className="py-3 text-right text-sm">{accPrice.toFixed(2)}</td>
                              <td className="py-3 text-right text-sm font-semibold">{accTotal.toFixed(2)}</td>
                            </tr>
                          );
                        })}

                        {/* Engraving */}
                        {formData.engraving === 'yes' && (
                          <tr className="border-b border-gray-200">
                            <td className="py-3 text-sm">
                              <div className="font-semibold">Laser Engraving Service(Logo)</div>
                              <div className="text-xs text-gray-600">**Every Logo Laser engraving</div>
                            </td>
                            <td className="py-3 text-center text-sm">{qty}.00 Pc(s)</td>
                            <td className="py-3 text-right text-sm">150.00</td>
                            <td className="py-3 text-right text-sm font-semibold">{(qty * 150).toFixed(2)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-85">
                  {(() => {
                    const grandTotal = formData.products.filter(p => p.quantity).reduce((total, product) => {
                      const qty = parseInt(product.quantity);
                      const isBaseEdition = product.model === 'base-edition';
                      const basePrice = isBaseEdition ? 1190 : 1650;
                      let bulkPrice = basePrice;
                      
                      if (isBaseEdition) {
                        if (qty >= 500) bulkPrice = 1050;
                        else if (qty >= 100) bulkPrice = 1100;
                        else if (qty >= 50) bulkPrice = 1150;
                        else if (qty >= 10) bulkPrice = 1170;
                      }
                      
                      const productTotal = bulkPrice * qty;
                      const accessoriesTotal = isBaseEdition ? (product.accessories || []).reduce((sum, acc) => {
                        const prices: any = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminium Hook': 90 };
                        return sum + (prices[acc.name] * acc.quantity);
                      }, 0) : 0;
                      const engravingCost = formData.engraving === 'yes' ? qty * 150 : 0;
                      
                      return total + productTotal + accessoriesTotal + engravingCost;
                    }, 0);

                    return (
                      <React.Fragment>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-semibold">Subtotal:</span>
                          <span className="font-semibold">৳ {grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-sm">Grand Total(Excluding Vat & Tax):</span>
                          <span className="font-bold whitespace-nowrap">৳ {grandTotal.toFixed(2)}</span>
                        </div>
                      </React.Fragment>
                    );
                  })()}
                </div>
              </div>

              {/* Notes */}
              <div className="text-xs text-gray-700 mb-6">
                <p className="font-semibold mb-2">***Note:</p>
                <p>1. Quoted prices are valid for 30 Days</p>
                <p>2. Prices are exclusive of government VAT & taxes.</p>
                <p>3. Full advance payment (100%) is required for all orders with engraving/logo customization.</p>
                <p>4. All products should be thoroughly checked before delivery. After delivery, Ximpul will not be held responsible for any damages or issues.</p>
                <p>5. All sold products are non-returnable and non-refundable.</p>
              </div>

              {/* Footer */}
              <div className="text-center text-sm border-t-2 border-gray-300 pt-4">
                <p className="font-semibold">ximpul - Making Water Free Again</p>
                <p className="text-xs mt-2">Thank you for choosing ximpul! <span className="text-red-600 font-semibold">#TruePrice</span></p>
                <p className="text-xs mt-2">For support, contact us at <strong>ximpulshop@gmail.com</strong> or <strong>+88 01881-408611</strong></p>
              </div>
            </div>

            {/* Original Preview (for reference) */}
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {formData.name}</div>
                <div><span className="font-medium">Phone:</span> {formData.phone}</div>
                <div><span className="font-medium">Email:</span> {formData.email}</div>
                <div><span className="font-medium">Address:</span> {formData.location}</div>
              </div>
            </div>

            {/* Products */}
            {formData.products.filter(p => p.quantity).map((product, idx) => {
              const qty = parseInt(product.quantity);
              const isBaseEdition = product.model === 'base-edition';
              const basePrice = isBaseEdition ? 1190 : 1650;
              let discount = 0;
              let bulkPrice = basePrice;
              
              if (isBaseEdition) {
                if (qty >= 500) { discount = 140; bulkPrice = 1050; }
                else if (qty >= 100) { discount = 90; bulkPrice = 1100; }
                else if (qty >= 50) { discount = 40; bulkPrice = 1150; }
                else if (qty >= 10) { discount = 20; bulkPrice = 1170; }
              }
              
              const productTotal = bulkPrice * qty;
              const accessoriesTotal = isBaseEdition ? (product.accessories || []).reduce((sum, acc) => {
                const prices: any = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminium Hook': 90 };
                return sum + (prices[acc.name] * acc.quantity);
              }, 0) : 0;
              const engravingCost = formData.engraving === 'yes' ? qty * 150 : 0;
              const total = productTotal + accessoriesTotal + engravingCost;
              const editionName = isBaseEdition ? 'Base Edition' : 'Lifestyle Edition';

              return (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Product {idx + 1}: {editionName} - {product.color}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Quantity</td>
                        <td className="py-2 text-right">{qty} units</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Base Price</td>
                        <td className="py-2 text-right">৳{basePrice}</td>
                      </tr>
                      {isBaseEdition && (
                        <tr className="border-b">
                          <td className="py-2">Bulk Reduction</td>
                          <td className="py-2 text-right text-green-600">-৳{discount} per unit</td>
                        </tr>
                      )}
                      <tr className="border-b">
                        <td className="py-2 font-medium">Bulk Price Per Unit</td>
                        <td className="py-2 text-right font-medium">৳{bulkPrice}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Product Subtotal</td>
                        <td className="py-2 text-right">৳{productTotal}</td>
                      </tr>
                      {isBaseEdition && (product.accessories || []).length > 0 && (
                        <>
                          <tr className="border-b bg-gray-50">
                            <td colSpan={2} className="py-2 font-medium">Accessories <span className="text-xs text-gray-600">(No price reduction)</span></td>
                          </tr>
                          {(product.accessories || []).map((acc, accIdx) => {
                            const prices: any = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminium Hook': 90 };
                            const accPrice = prices[acc.name];
                            const accTotal = accPrice * acc.quantity;
                            return (
                              <tr key={accIdx} className="border-b">
                                <td className="py-2 pl-4 text-sm">{acc.name} x {acc.quantity} (৳{accPrice} each)</td>
                                <td className="py-2 text-right text-sm">৳{accTotal}</td>
                              </tr>
                            );
                          })}
                          <tr className="border-b">
                            <td className="py-2 font-medium">Accessories Subtotal</td>
                            <td className="py-2 text-right font-medium">৳{accessoriesTotal}</td>
                          </tr>
                        </>
                      )}
                      {formData.engraving === 'yes' && (
                        <tr className="border-b">
                          <td className="py-2">Engraving ({qty} units)</td>
                          <td className="py-2 text-right">৳{engravingCost}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2 font-bold text-lg">Total</td>
                        <td className="py-2 text-right font-bold text-lg">৳{total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}



            <div className="flex gap-2">
              <Button onClick={() => setShowQuotationModal(false)} className="flex-1 bg-black hover:bg-gray-800">Close Preview</Button>
            </div>
          </div>
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
            <Button onClick={() => setShowSuccessModal(false)} className="w-full mt-4 bg-black hover:bg-gray-800">
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
