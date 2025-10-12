import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triggerOrderNotification } from '@/utils/order-notification';
import { clearAdminNotifications } from '@/utils/admin-notification';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmail } from '@/utils/emailjs-service';

export const TestNotifications = () => {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  // No need for useNotifications hook anymore
  const addTestNotification = () => {
    triggerOrderNotification({
      id: 'test-' + Date.now(),
      customer_name: 'Test Notification',
      customer_email: 'test@example.com',
      customer_phone: '+1234567890',
      selected_edition: 'Premium',
      selected_color: 'Silver',
      total_amount: 3500
    });
    
    toast.success('Test notification added!');
  };
  
  const simulateNewOrder = () => {
    const orderId = 'order-' + Date.now();
    
    triggerOrderNotification({
      id: orderId,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+1234567890',
      selected_edition: 'Standard',
      selected_color: 'Black',
      total_amount: 2500
    });
    
    toast.success('New order notification added!');
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Notification Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={addTestNotification} className="w-full">Add Test Notification</Button>
            <Button onClick={simulateNewOrder} className="w-full">Simulate New Order</Button>
            <Button onClick={() => clearAdminNotifications()} variant="outline" className="w-full">Clear All Notifications</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input 
                id="test-email" 
                type="email" 
                placeholder="Enter email address" 
                value={testEmail} 
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={async () => {
                if (!testEmail) {
                  toast.error('Please enter an email address');
                  return;
                }
                
                setSending(true);
                try {
                  const result = await sendEmail({
                    to: testEmail,
                    subject: 'Test Email from Ximpul Shop',
                    message: 'This is a test email from Ximpul Shop.'
                  });
                  
                  if (result.success) {
                    if (result.fallback) {
                      toast.success(`Email details logged to console`);
                      toast.info('Email server not running - check console for details', { duration: 5000 });
                    } else {
                      toast.success(`Test email sent to ${testEmail}`);
                    }
                  } else {
                    toast.error('Failed to send email');
                    console.error('Email error:', result.error);
                  }
                } catch (error) {
                  toast.error('Failed to send email');
                  console.error('Email error:', error);
                } finally {
                  setSending(false);
                }
              }} 
              className="w-full"
              disabled={sending || !testEmail}
            >
              {sending ? 'Sending...' : 'Send Test Email'}
            </Button>
            
            <Button 
              onClick={async () => {
                setSending(true);
                try {
                  const result = await sendEmail({
                    to: 'ximpulshop@gmail.com',
                    subject: 'Test Admin Email from Ximpul Shop',
                    message: 'This is a test admin email from Ximpul Shop.'
                  });
                  
                  if (result.success) {
                    if (result.fallback) {
                      toast.success(`Admin email details logged to console`);
                      toast.info('Email server not running - check console for details', { duration: 5000 });
                    } else {
                      toast.success('Test email sent to admin');
                    }
                  } else {
                    toast.error('Failed to send email to admin');
                    console.error('Email error:', result.error);
                  }
                } catch (error) {
                  toast.error('Failed to log email');
                  console.error('Email error:', error);
                } finally {
                  setSending(false);
                }
              }} 
              className="w-full"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Admin Email'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Instructions</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Use the buttons above to test notifications and emails</li>
          <li>Notifications will appear in the bell icon in the top navigation</li>
          <li><strong>Option 1:</strong> Start the email server to send real emails</li>
          <li>To start the email server, run: <code>node email-server.js</code></li>
          <li><strong>Option 2:</strong> If the server is not running, emails will be logged to the console</li>
          <li>To see email logs, open your browser's developer tools (F12) and look at the Console tab</li>
          <li>This page is only accessible to admins</li>
        </ul>
      </div>
    </div>
  );
};