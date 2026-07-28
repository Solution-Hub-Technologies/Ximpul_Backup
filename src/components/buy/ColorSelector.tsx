import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Lock, Bell } from 'lucide-react';
import { Color } from '@/types/buySection';
import { toast } from 'sonner';
import { createAdminEmailTemplate, createCustomerEmailTemplate } from '@/utils/email-templates';
import { sanitizeForLog, sanitizeHtml } from '@/utils/security';
import { sendEmail } from '@/utils/send-email';

interface ColorSelectorProps {
  colors: Color[];
  selectedColor: string;
  selectedEdition: string;
  onColorChange: (value: string) => void;
  editions: any[];
}

export const ColorSelector = ({ colors, selectedColor, selectedEdition, onColorChange, editions }: ColorSelectorProps) => {
  const isDisabled = !selectedEdition;
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [pendingColor, setPendingColor] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyData, setNotifyData] = useState({ name: '', phone: '', email: '', color: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getStockStatus = (colorValue: string) => {
    if (!selectedEdition) return { inStock: true, stock: 0 };
    const selectedEditionData = editions.find(e => e.value === selectedEdition);
    if (selectedEditionData) {
      const stockField = colorValue === 'obsidian' ? 'stock_black' : 'stock_grey';
      const stock = selectedEditionData[stockField] || 0;
      return { inStock: stock > 0, stock };
    }
    return { inStock: true, stock: 0 };
  };
  
  const handleColorChange = (colorValue: string) => {
    const { inStock } = getStockStatus(colorValue);
    
    if (!inStock) {
      setPendingColor(colorValue);
      setShowStockAlert(true);
      return;
    }
    onColorChange(colorValue);
  };
  
  const handleConfirmSelection = () => {
    onColorChange(pendingColor);
    setShowStockAlert(false);
    setPendingColor('');
  };
  
  const handleCancelSelection = () => {
    setShowStockAlert(false);
    setPendingColor('');
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">2. Choose Color</h3>
          {isDisabled && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
        {isDisabled && (
          <p className="text-sm text-gray-500 mt-1">Please select an edition first</p>
        )}
      </div>
      <div className="p-6">
        <RadioGroup 
          value={selectedColor} 
          onValueChange={selectedEdition ? handleColorChange : undefined} 
          className="space-y-3"
          disabled={isDisabled}
        >
          {colors.map(color => {
            const { inStock } = getStockStatus(color.value);
            const isColorDisabled = isDisabled || !inStock;
            
            return (
              <div key={color.value} className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                isDisabled 
                  ? 'border-gray-200 cursor-not-allowed opacity-50' 
                  : !inStock
                    ? 'border-gray-200 cursor-not-allowed opacity-60 bg-gray-50'
                    : selectedColor === color.value 
                      ? 'border-gray-900 bg-gray-100 cursor-pointer' 
                      : 'border-gray-200 cursor-pointer hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <RadioGroupItem value={color.value} id={color.value} disabled={isColorDisabled} />
                <div className="w-6 h-6 rounded-full border border-gray-300" style={{
                  backgroundColor: color.color
                }} />
                <div className="flex-1">
                  <label htmlFor={color.value} className={`text-base font-medium block ${isColorDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                    !inStock && selectedEdition ? 'text-red-600' : ''
                  }`}>
                    {color.name}
                  </label>
                  {!inStock && selectedEdition && (
                    <span className="text-xs text-gray-500 font-medium">Out of Stock</span>
                  )}
                </div>
                {!inStock && selectedEdition && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-3 bg-transparent text-black border border-black hover:bg-black hover:text-white transition-colors font-bold"
                    style={{ fontSize: '16px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifyData({ ...notifyData, color: color.name });
                      setShowNotifyModal(true);
                    }}
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Notify Me
                  </Button>
                )}
                {selectedColor === color.value && <Check className="w-5 h-5 text-gray-900" />}
              </div>
            );
          })}
        </RadioGroup>
      </div>
      
      <AlertDialog open={showStockAlert} onOpenChange={setShowStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Out of Stock Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Your selected edition is out of stock. For that reason, the delivery will delay to 2 to 3 weeks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSelection}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelection}>Confirm Selection</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get Notified - {notifyData.color}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notify-name">Name *</Label>
              <Input
                id="notify-name"
                value={notifyData.name}
                onChange={(e) => setNotifyData({ ...notifyData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="notify-phone">Phone *</Label>
              <Input
                id="notify-phone"
                value={notifyData.phone}
                onChange={(e) => setNotifyData({ ...notifyData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="notify-email">Email *</Label>
              <Input
                id="notify-email"
                type="email"
                value={notifyData.email}
                onChange={(e) => setNotifyData({ ...notifyData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button 
              disabled={isSubmitting}
              onClick={async () => {
                if (notifyData.name && notifyData.phone && notifyData.email) {
                  setIsSubmitting(true);
                  try {
                    // Save to database using Supabase admin client
                    const { supabaseAdmin } = await import('@/integrations/supabase/admin-client');
                    const { error } = await supabaseAdmin.from('stock_notifications').insert({
                      customer_name: notifyData.name,
                      customer_phone: notifyData.phone,
                      customer_email: notifyData.email || null,
                      color_requested: notifyData.color
                    });
                    
                    if (error) {
                      console.error('Database error:', sanitizeForLog(error?.message || 'Unknown error'));
                      toast.error('Failed to save notification. Please try again.');
                      return;
                    }
                    
                    // Send emails using same system as orders and contacts
                    const { supabase } = await import('@/integrations/supabase/client');
                    
                    // Fetch admin email configuration
                    console.log('📧 Fetching admin email configuration for stock notification...');
                    const { data: emailConfig } = await supabase
                      .from('email_config')
                      .select('*')
                      .eq('config_type', 'customer');
                    
                    // Use configured emails or fallback to default
                    let adminEmails = 'razinahmed60@gmail.com';
                    let ccEmails = '';
                    
                    if (emailConfig && emailConfig.length > 0) {
                      const config = emailConfig[0];
                      if (config?.to_emails?.length > 0) {
                        adminEmails = config.to_emails.join(',');
                        console.log('📧 Using configured TO emails for stock notification:', adminEmails);
                      }
                      if (config?.cc_emails?.length > 0) {
                        ccEmails = config.cc_emails.join(',');
                        console.log('📧 Using configured CC emails for stock notification:', ccEmails);
                      }
                    }
                    
                    // Fetch admin email template
                    const { data: adminTemplate } = await supabase
                      .from('email_templates')
                      .select('*')
                      .eq('type', 'stock_notify_admin')
                      .single();
                    
                    // Send admin notification email
                    let adminEmailHTML = '';
                    let adminSubject = `Stock Notification Request - ${notifyData.color}`;
                    
                    if (adminTemplate) {
                      console.log('✅ Using stock admin template:', adminTemplate.name);
                      adminEmailHTML = adminTemplate.template
                        .replace(/\$\{customerName\}/g, notifyData.name)
                        .replace(/\$\{customerPhone\}/g, notifyData.phone)
                        .replace(/\$\{customerEmail\}/g, notifyData.email || 'Not provided')
                        .replace(/\$\{color\}/g, notifyData.color)
                        .replace(/{{customerName}}/g, notifyData.name)
                        .replace(/{{customerPhone}}/g, notifyData.phone)
                        .replace(/{{customerEmail}}/g, notifyData.email || 'Not provided')
                        .replace(/{{color}}/g, notifyData.color);
                      
                      adminSubject = adminTemplate.subject
                        .replace(/\$\{color\}/g, notifyData.color)
                        .replace(/{{color}}/g, notifyData.color);
                    } else {
                      console.log('⚠️ No stock admin template found, using fallback');
                      adminEmailHTML = `<h2>Stock Notification Request</h2><p><strong>Customer:</strong> ${notifyData.name}</p><p><strong>Phone:</strong> ${notifyData.phone}</p><p><strong>Email:</strong> ${notifyData.email || 'Not provided'}</p><p><strong>Requested Color:</strong> ${notifyData.color}</p><p>Please notify the customer when this color is back in stock.</p>`;
                    }
                    
                    await sendEmail({
                      to: adminEmails,
                      subject: adminSubject,
                      message: adminEmailHTML,
                      from_name: 'Ximpul Shop',
                      cc: ccEmails || undefined
                    });
                    
                    // Send confirmation email to customer if email provided
                    if (notifyData.email) {
                      // Fetch customer email template
                      const { data: customerTemplate } = await supabase
                        .from('email_templates')
                        .select('*')
                        .eq('type', 'stock_notification_customer')
                        .single();
                      
                      let customerEmailHTML = '';
                      let customerSubject = 'Stock Notification Confirmed - Ximpul';
                      
                      if (customerTemplate) {
                        console.log('✅ Using stock customer template:', customerTemplate.name);
                        customerEmailHTML = customerTemplate.template
                          .replace(/\$\{customerName\}/g, notifyData.name)
                          .replace(/\$\{color\}/g, notifyData.color)
                          .replace(/{{customerName}}/g, notifyData.name)
                          .replace(/{{color}}/g, notifyData.color);
                        
                        customerSubject = customerTemplate.subject
                          .replace(/\$\{color\}/g, notifyData.color)
                          .replace(/{{color}}/g, notifyData.color);
                      } else {
                        console.log('⚠️ No stock customer template found, using fallback');
                        customerEmailHTML = `<h2>Stock Notification Confirmed</h2><p>Dear ${notifyData.name},</p><p>Thank you for your interest in the ${notifyData.color} Ximpul Flow!</p><p>We'll notify you as soon as it's back in stock.</p><p>Best regards,<br>Team Ximpul</p>`;
                      }
                      
                      await sendEmail({
                        to: notifyData.email,
                        subject: customerSubject,
                        message: customerEmailHTML,
                        from_name: 'Ximpul Shop'
                      });
                    }
                    toast.success(`We'll notify you when ${notifyData.color} is back in stock!`);
                  } catch (error: any) {
                    console.error('Error:', sanitizeForLog(error?.message || 'Unknown error'));
                    toast.error('Failed to save notification. Please try again.');
                  }
                  setIsSubmitting(false);
                  setShowNotifyModal(false);
                  setNotifyData({ name: '', phone: '', email: '', color: '' });
                } else {
                  toast.error('Please fill in required fields');
                }
              }}
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
