import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { sendEmail } from '@/utils/send-email';
import { supabase } from '@/integrations/supabase/client';
import { LoaderGooeyBlobs } from '@/components/ui/loader-gooey-blobs';
import { motion } from 'framer-motion';

export const NewChapter = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });

  useEffect(() => {
    document.title = "A TRADITION REIMAGINED. | Ximpul";
    window.scrollTo(0, 0);

    // Disable page scrolling completely on this route
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.phone) {
      toast.error('Please fill in both Email and Phone fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase contacts table
      await supabase
        .from('contacts')
        .insert([{
          name: 'Early Access Member',
          email: formData.email,
          message: `[EARLY ACCESS REQUEST - NEW LINEUP]\nPhone: ${formData.phone}`
        }]);

      // Email notifications for Admin ONLY (No email sent to customer)
      const adminEmailHTML = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 12px; border: 1px solid #222222;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0;">✨ Early Access Member Request</h2>
            <p style="color: #888888; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Ximpul New Lineup Priority List</p>
          </div>
          <div style="background: #141414; padding: 20px; border-radius: 8px; border: 1px solid #282828; margin: 20px 0;">
            <p style="margin: 8px 0; font-size: 14px; color: #dddddd;"><strong>Email Address:</strong> <a href="mailto:${formData.email}" style="color: #ffffff; text-decoration: underline;">${formData.email}</a></p>
            <p style="margin: 8px 0; font-size: 14px; color: #dddddd;"><strong>Phone Number:</strong> <a href="tel:${formData.phone}" style="color: #ffffff; text-decoration: underline;">${formData.phone}</a></p>
            <p style="margin: 8px 0; font-size: 12px; color: #888888;"><strong>Submitted At:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BD Time)</p>
          </div>
          <div style="text-align: center; margin-top: 25px; border-top: 1px solid #222222; padding-top: 15px;">
            <p style="font-size: 11px; color: #555555; margin: 0;">Ximpul</p>
          </div>
        </div>
      `;

      const { data: emailConfig } = await supabase
        .from('email_config')
        .select('*')
        .eq('config_type', 'customer');

      let adminEmails = 'ximpulshop@gmail.com';
      let ccEmails = '';
      if (emailConfig && emailConfig.length > 0) {
        if (emailConfig[0]?.to_emails?.length > 0) adminEmails = emailConfig[0].to_emails.join(',');
        if (emailConfig[0]?.cc_emails?.length > 0) ccEmails = emailConfig[0].cc_emails.join(',');
      }

      // Send to Admin ONLY
      await sendEmail({
        to: adminEmails,
        subject: `✨ Early Access Request - ${formData.email}`,
        message: adminEmailHTML,
        from_name: 'Ximpul Early Access',
        cc: ccEmails || undefined
      }).catch((err) => console.error('Failed to send admin notification email:', err));

      // Display animated "X" Gooey Loader for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      setIsSubmitted(true);
      toast.success('You have successfully joined Early Access!');

      // Automatically close modal 5 seconds after Thank You is displayed
      setTimeout(() => {
        setIsModalOpen(false);
      }, 5000);
    } catch (err: any) {
      toast.error('Submission error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-amber-500/30">
      <Navigation hideNavHeader={true} />

      {/* 100% Viewport Height Hero Canvas - No Scroll, No Footer */}
      <main className="relative flex-1 w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden px-4">
        {/* Full Screen Background Image */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <img 
            src="/ximpul-uploads/ChatGPT Image Aug 3, 2026, 04_12_39 PM.png" 
            alt="Ximpul Luxury Fabric Background" 
            className="w-full h-full object-cover object-center opacity-95"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4 my-auto w-full">
          {/* 1. Official Ximpul Logo */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <img 
              src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png" 
              alt="XIMPUL" 
              className="h-6 sm:h-8 md:h-9 w-auto object-contain invert brightness-200 tracking-[0.45em] drop-shadow-md" 
            />
          </div>

          {/* 2. Sub-header Tag & Accent Line */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <span className="text-gray-300 text-[10px] sm:text-xs tracking-[0.4em] uppercase font-light">
              NEW LINEUP
            </span>
            <div className="w-8 h-[1px] bg-white/40 mt-3" />
          </div>

          {/* 3. Main Headline */}
          <h1 className="whitespace-nowrap text-xl sm:text-3xl md:text-5xl lg:text-6xl font-light sm:font-normal text-white tracking-[0.14em] sm:tracking-[0.18em] leading-none uppercase mb-4 sm:mb-6 font-sans drop-shadow-xl">
            A TRADITION REIMAGINED.
          </h1>

          {/* 4. Subheadline */}
          <p className="text-gray-200/90 text-sm sm:text-lg md:text-xl font-light tracking-wide mb-10 sm:mb-14 font-sans drop-shadow-md">
            Some traditions deserve a second look.
          </p>

          {/* 5. Accent Line & Underlined Early Access Trigger */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-[1px] bg-white/40 mb-6 sm:mb-8" />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative pb-1 border-b border-white/60 hover:border-white text-white transition-all duration-300 text-xs sm:text-sm tracking-[0.35em] font-light uppercase flex items-center gap-3 cursor-pointer bg-transparent"
            >
              <span>EARLY ACCESS</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 opacity-80 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </main>

      {/* Early Access Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setTimeout(() => setIsSubmitted(false), 300);
      }}>
        <DialogContent className="max-w-md w-[92vw] bg-[#0a0a0a] text-white border border-white/20 p-6 sm:p-8 rounded-2xl shadow-2xl">
          {!isSubmitted ? (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto mb-3 flex items-center justify-center pt-2">
                  <img 
                    src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png" 
                    alt="XIMPUL" 
                    className="h-5 sm:h-6 w-auto object-contain invert brightness-200 tracking-[0.45em]" 
                  />
                </div>
                <DialogTitle className="text-2xl font-bold text-white tracking-widest uppercase text-sm sm:text-base">JOIN EARLY ACCESS</DialogTitle>
                <DialogDescription className="text-gray-400 text-xs mt-1">
                  Be the first to experience Ximpul's New Lineup.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Email Address *</label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Phone Number *</label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white h-11"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all mt-2 cursor-pointer flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <LoaderGooeyBlobs size={10} color="#000000" />
                  ) : (
                    'Submit'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 flex flex-col items-center justify-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-14 h-14 rounded-full border border-white/30 bg-white/5 flex items-center justify-center text-white mb-1 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
              >
                <motion.svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <h3 className="text-lg font-medium text-white tracking-[0.2em] uppercase font-sans">
                ACCESS REQUESTED
              </h3>

              <p className="text-gray-300/90 text-xs sm:text-sm leading-relaxed max-w-xs font-light tracking-wide">
                Thank you. You are officially on the early access priority list.
              </p>

              <div className="w-8 h-[1px] bg-white/30 pt-1" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewChapter;
