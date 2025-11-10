
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setContacts(data || []);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitContact = async (contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    try {
      // Save to database (excluding subject as it's not in the table)
      const { error } = await supabase
        .from('contacts')
        .insert([{
          name: contactData.name,
          email: contactData.email,
          message: `Subject: ${contactData.subject}\n\n${contactData.message}`
        }]);

      if (error) throw error;
      
      // Send confirmation email to customer
      const customerEmail = {
        to: contactData.email,
        subject: 'Thank You for Contacting Ximpul',
        message: `Dear ${contactData.name},

Thank you for reaching out to us regarding "${contactData.subject}".

We have received your message and our team will get back to you within 24 hours.

Your message:
"${contactData.message}"

We appreciate your interest in Ximpul Flow and our mission to make water free again.

Best regards,
Team Ximpul

💧 Your Water. Your Freedom.`
      };
      
      // Send notification email to admin
      const adminEmail = {
        to: 'ximpulshop@gmail.com',
        subject: `New Contact Form Submission: ${contactData.subject}`,
        message: `New contact form submission received:

Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}

Message:
${contactData.message}

Please respond to the customer within 24 hours.`
      };
      
      // Send emails using same system as orders
      try {
        // Fetch customer email template
        const { data: customerTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'contact_customer')
          .single();
        
        // Send customer confirmation email
        let customerEmailHTML = '';
        let customerSubject = 'Thank You for Contacting Ximpul';
        
        if (customerTemplate) {
          customerEmailHTML = customerTemplate.template
            .replace(/\$\{customerName\}/g, contactData.name)
            .replace(/\$\{subject\}/g, contactData.subject)
            .replace(/\$\{message\}/g, contactData.message)
            .replace(/{{customerName}}/g, contactData.name)
            .replace(/{{subject}}/g, contactData.subject)
            .replace(/{{message}}/g, contactData.message);
          
          customerSubject = customerTemplate.subject
            .replace(/\$\{customerName\}/g, contactData.name)
            .replace(/\$\{subject\}/g, contactData.subject)
            .replace(/{{customerName}}/g, contactData.name)
            .replace(/{{subject}}/g, contactData.subject);
        } else {
          customerEmailHTML = `<h2>Thank You for Contacting Us</h2><p>Dear ${contactData.name},</p><p>Thank you for reaching out to us regarding "${contactData.subject}".</p><p>We have received your message and our team will get back to you within 24 hours.</p><p><strong>Your message:</strong><br>"${contactData.message}"</p><p>We appreciate your interest in Ximpul Flow and our mission to make water free again.</p><p>Best regards,<br>Team Ximpul</p><p>💧 Your Water. Your Freedom.</p>`;
        }
        
        await fetch('https://ximpul.com/smtp-mailer.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            to: contactData.email,
            subject: customerSubject,
            message: customerEmailHTML,
            from_name: 'Ximpul Shop'
          })
        });
        
        // Fetch admin email template
        const { data: adminTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'contact_admin')
          .single();
        
        // Send admin notification email
        let adminEmailHTML = '';
        let adminSubject = `New Contact Form: ${contactData.subject}`;
        
        if (adminTemplate) {
          adminEmailHTML = adminTemplate.template
            .replace(/\$\{customerName\}/g, contactData.name)
            .replace(/\$\{customerEmail\}/g, contactData.email)
            .replace(/\$\{subject\}/g, contactData.subject)
            .replace(/\$\{message\}/g, contactData.message)
            .replace(/{{customerName}}/g, contactData.name)
            .replace(/{{customerEmail}}/g, contactData.email)
            .replace(/{{subject}}/g, contactData.subject)
            .replace(/{{message}}/g, contactData.message);
          
          adminSubject = adminTemplate.subject
            .replace(/\$\{subject\}/g, contactData.subject)
            .replace(/{{subject}}/g, contactData.subject);
        } else {
          adminEmailHTML = `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${contactData.name}</p><p><strong>Email:</strong> ${contactData.email}</p><p><strong>Subject:</strong> ${contactData.subject}</p><p><strong>Message:</strong></p><p>${contactData.message}</p><p>Please respond to the customer within 24 hours.</p>`;
        }
        
        await fetch('https://ximpul.com/smtp-mailer.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            to: 'ximpulshop@gmail.com',
            subject: adminSubject,
            message: adminEmailHTML,
            from_name: 'Ximpul Shop'
          })
        });
      } catch (emailError) {
        console.warn('Email sending failed, but contact was saved:', emailError);
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Error submitting contact:', err);
      toast.error('Failed to send message. Please try again.');
      return { success: false, error: err.message };
    }
  };

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', contactId);

      if (error) throw error;
      
      toast.success('Contact status updated');
      fetchContacts();
    } catch (err: any) {
      console.error('Error updating contact:', err);
      toast.error('Failed to update contact status');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    submitContact,
    updateContactStatus
  };
};
