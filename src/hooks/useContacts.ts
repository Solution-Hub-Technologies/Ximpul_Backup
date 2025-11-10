
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
      
      // Send emails using templates
      try {
        // Send customer confirmation email
        await fetch('https://ximpul.com/send-template-email.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_name: 'contact_customer',
            to: contactData.email,
            variables: {
              customerName: contactData.name,
              subject: contactData.subject,
              message: contactData.message
            }
          })
        });
        
        // Send admin notification email
        await fetch('https://ximpul.com/send-template-email.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_name: 'contact_admin',
            to: 'ximpulshop@gmail.com',
            variables: {
              customerName: contactData.name,
              customerEmail: contactData.email,
              subject: contactData.subject,
              message: contactData.message
            }
          })
        });
      } catch (emailError) {
        console.warn('SMTP email failed, but contact was saved');
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
