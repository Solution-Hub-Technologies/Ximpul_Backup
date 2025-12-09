import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type InitiativeType = 'team' | 'invest' | 'supplier' | '';

const initiatives = {
  team: {
    emoji: '🔵',
    title: 'Join the Ximpul Team',
    description: "We're looking for passionate people who believe Bangladesh deserves better. If you align with our values, want to work with a transparent brand, and love building things that matter — we want to hear from you."
  },
  invest: {
    emoji: '🟠',
    title: 'Invest in Ximpul',
    description: 'If you share our belief in long-term value and want to support a brand that is growing with purpose, you can express your investment interest.',
    points: ['TruePrice philosophy', 'Direct-to-consumer model', 'Global-quality vision', 'Ethical, sustainable growth']
  },
  supplier: {
    emoji: '🟢',
    title: 'Become a Supplier or Manufacturing Partner',
    description: 'If you can provide products or materials that meet our strict quality standards and align with our philosophy, you may apply as a partner.',
    points: ['Transparency', 'Consistency', 'Premium quality', 'Long-term trust']
  }
};

const JoinInitiative = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeType>('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    document.title = "Join Our Initiative - Ximpul";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const initiativeTitle = initiatives[selectedInitiative as keyof typeof initiatives].title;
      
      // Fetch admin email configuration
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: emailConfig } = await supabase
        .from('email_config')
        .select('*')
        .eq('config_type', 'customer');
      
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
      
      const customerEmailHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1d1d1f 0%, #3d3d3f 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Ximpul</h1>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #1d1d1f; margin: 0 0 20px 0; font-size: 24px;">Thank You, ${formData.name}!</h2>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We're excited to receive your interest in joining our initiative:
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #1d1d1f; padding: 20px; margin: 0 0 25px 0; border-radius: 4px;">
              <p style="color: #1d1d1f; font-size: 18px; font-weight: 600; margin: 0;">${initiativeTitle}</p>
            </div>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
              Your submission is being reviewed by our team. We carefully evaluate every application to ensure alignment with our mission of bringing <strong>TruePrice</strong> and <strong>global-quality products</strong> to Bangladesh.
            </p>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              If your profile matches our values and vision, we'll reach out to you within <strong>5-7 business days</strong>.
            </p>
            
            <div style="border-top: 2px solid #e5e7eb; padding-top: 25px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                In the meantime, feel free to explore more about us:
              </p>
              <p style="margin: 0 0 8px 0;">
                <a href="https://ximpul.com/about" style="color: #1d1d1f; text-decoration: none; font-size: 14px;">→ Learn About Ximpul</a>
              </p>
              <p style="margin: 0;">
                <a href="https://ximpul.com/shop" style="color: #1d1d1f; text-decoration: none; font-size: 14px;">→ Explore Our Products</a>
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #1d1d1f; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">The Ximpul Team</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">Building Bangladesh's Most Transparent Brand</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Ximpul. All rights reserved.
            </p>
          </div>
        </div>`;
      
      const adminEmailHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🔔 New Initiative Submission</h1>
          </div>
          
          <div style="padding: 35px 30px; background: #ffffff;">
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
              <p style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0;">${initiativeTitle}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; width: 140px;">
                  <strong style="color: #374151; font-size: 14px;">👤 Name</strong>
                </td>
                <td style="padding: 15px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #1d1d1f; font-size: 15px;">${formData.name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #374151; font-size: 14px;">📞 Phone</strong>
                </td>
                <td style="padding: 15px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
                  <a href="tel:${formData.phone}" style="color: #1d1d1f; text-decoration: none; font-size: 15px;">${formData.phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #374151; font-size: 14px;">✉️ Email</strong>
                </td>
                <td style="padding: 15px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
                  <a href="mailto:${formData.email}" style="color: #2563eb; text-decoration: none; font-size: 15px;">${formData.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; background: #f9fafb; vertical-align: top;">
                  <strong style="color: #374151; font-size: 14px;">💬 Message</strong>
                </td>
                <td style="padding: 15px; background: #ffffff;">
                  <span style="color: #4b5563; font-size: 15px; line-height: 1.6;">${formData.message || '<em style="color: #9ca3af;">No message provided</em>'}</span>
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #fffbeb; border-radius: 8px; border: 1px solid #fbbf24;">
              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                <strong>⚡ Action Required:</strong> Review this submission and respond within 5-7 business days to maintain our commitment to applicants.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>`;
      
      const adminParams: any = {
        to: adminEmails,
        subject: `New Join Initiative: ${initiativeTitle}`,
        message: adminEmailHTML,
        from_name: 'Ximpul Website'
      };
      
      if (ccEmails) {
        adminParams.cc = ccEmails;
      }
      
      await fetch('https://ximpul.com/smtp-mailer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(adminParams)
      });
      
      await fetch('https://ximpul.com/smtp-mailer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          to: formData.email,
          subject: 'Thank You for Joining Ximpul Initiative!',
          message: customerEmailHTML,
          from_name: 'Ximpul'
        })
      });

      toast.success('Thank you! We will review your submission and get back to you soon.');
      setIsModalOpen(false);
      setShowForm(false);
      setSelectedInitiative('');
      setFormData({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero */}
          <div className="text-center mb-8 md:mb-12">
            <div className="text-5xl mb-4"></div>
            <AnimatedText 
              text="Join Our Initiative" 
              textClassName="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1d1d1f] mb-4" 
              underlineClassName="text-primary -bottom-1" 
            />
            <p className="text-base sm:text-xl md:text-2xl text-gray-600 font-medium mt-4 md:mt-6 px-2">
              Be Part of Something That's Changing Bangladesh — Transparently, Honestly, and for the Better.
            </p>
          </div>

          {/* Intro */}
          <div className="space-y-4 md:space-y-6 text-base sm:text-lg leading-relaxed mb-8 md:mb-12">
            <p className="text-center font-medium">
              At Ximpul, we're doing something different.
            </p>
            <p>
              We're building a brand that puts quality, fairness, and purpose at the center — not negotiation, not middlemen, not compromises.
            </p>
            <p className="font-semibold text-lg sm:text-xl">
              Our initiative is simple:
            </p>
            <p className="text-center text-xl sm:text-2xl font-bold text-primary">
              Give Bangladesh global-standard products at TruePrice.
            </p>
            <p className="text-center">
              No markup. No tricks. No compromise on quality.<br />
              A brand built with integrity — and built for the people.
            </p>
          </div>



          {/* Why Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 mb-8 md:mb-12">
            <div className="text-center mb-6 md:mb-8">
              
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">Why This Initiative Exists</h3>
            </div>
            <p className="text-center text-base sm:text-lg md:text-xl mb-4 md:mb-6">
              Because Ximpul isn't just a brand.<br />
              <span className="font-bold">It's a movement</span> — a promise to do things differently:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto text-base sm:text-lg">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>TruePrice, always</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>Fair for everyone</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>Global quality, no shortcuts</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>Zero negotiation culture</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>Zero compromise on standards</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>
                <span>Built for Bangladesh, inspired by the world's best</span>
              </div>
            </div>
            <p className="text-center mt-6 md:mt-8 text-base sm:text-lg font-medium">
              We're growing — and we want the right people beside us.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 shadow-lg">
            
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">Ready to Join?</h3>
            <p className="text-base sm:text-lg mb-6 md:mb-8 text-gray-600 px-2">
              Choose your intention and submit the form.<br className="hidden sm:block" />
              <span className="sm:inline"> </span>We review every submission personally and will reach out if your profile fits our mission.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-block bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Join Now
            </button>
            <p className="mt-6 md:mt-8 text-xs sm:text-sm text-gray-500 italic px-4">
              A transparent future starts with the people who choose to build it.
            </p>
          </div>

        </div>
      </section>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setShowForm(false);
          setSelectedInitiative('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">Join Our Initiative</DialogTitle>
          </DialogHeader>

          {!showForm ? (
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Your Interest</label>
                <Select value={selectedInitiative} onValueChange={(value) => setSelectedInitiative(value as InitiativeType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">🔵 Join the Ximpul Team</SelectItem>
                    <SelectItem value="invest">🟠 Invest in Ximpul</SelectItem>
                    <SelectItem value="supplier">🟢 Become a Supplier or Manufacturing Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedInitiative && (
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">{initiatives[selectedInitiative].emoji}</span>
                    <h3 className="text-lg sm:text-xl font-bold">{initiatives[selectedInitiative].title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700">{initiatives[selectedInitiative].description}</p>
                  {initiatives[selectedInitiative].points && (
                    <div>
                      <p className="font-medium mb-2 text-sm sm:text-base">We welcome those who understand:</p>
                      <ul className="list-disc list-inside pl-2 space-y-1 text-sm sm:text-base">
                        {initiatives[selectedInitiative].points?.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    Continue to Form
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-medium">
                  {initiatives[selectedInitiative as keyof typeof initiatives].emoji} {initiatives[selectedInitiative as keyof typeof initiatives].title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                <Textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us more about yourself or your interest..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 hover:bg-black hover:text-white"
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          )}

        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default JoinInitiative;
