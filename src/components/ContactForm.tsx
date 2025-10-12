
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContacts } from '@/hooks/useContacts';
import { useNavigate } from 'react-router-dom';
import { Send, User, Mail, MessageSquare, FileText } from 'lucide-react';

export const ContactForm = () => {
  const { submitContact } = useContacts();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await submitContact(formData);
    
    if (result.success) {
      // Redirect to thank you page
      navigate('/thank-you?type=contact');
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Card className="w-full border-0 shadow-xl hover:shadow-2xl transition-shadow">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-light text-gray-900">Send us a Message</CardTitle>
        <p className="text-gray-600 mt-2">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="h-12 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                className="h-12 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Subject *
            </Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="What is this regarding?"
              className="h-12 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message *
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Tell us more about your inquiry. We're here to help!"
              rows={6}
              className="border-gray-200 focus:border-gray-900 focus:ring-gray-900 resize-none"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Message...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </div>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            By sending this message, you agree to our terms of service and privacy policy.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
