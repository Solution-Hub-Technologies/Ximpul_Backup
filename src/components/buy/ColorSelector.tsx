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
              <Label htmlFor="notify-email">Email</Label>
              <Input
                id="notify-email"
                type="email"
                value={notifyData.email}
                onChange={(e) => setNotifyData({ ...notifyData, email: e.target.value })}
                placeholder="Enter your email (optional)"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button 
              disabled={isSubmitting}
              onClick={async () => {
                if (notifyData.name && notifyData.phone) {
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
                      console.error('Database error:', error);
                      toast.error('Failed to save notification. Please try again.');
                      return;
                    }
                    
                    // Send email to admin
                    await fetch('https://ximpul.com/smtp-test.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                      body: new URLSearchParams({
                        to: 'ximpulshop@gmail.com',
                        subject: `Stock Notification Request - ${notifyData.color}`,
                        message: createAdminEmailTemplate(notifyData.name, notifyData.phone, notifyData.email || 'Not provided', notifyData.color),
                        from_name: 'Ximpul Shop'
                      })
                    });
                    
                    // Send confirmation email to customer if email provided
                    if (notifyData.email) {
                      await fetch('https://ximpul.com/smtp-test.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                          to: notifyData.email,
                          subject: `Stock Alert Registered - ${notifyData.color} | Ximpul Flow`,
                          message: createCustomerEmailTemplate(notifyData.name, notifyData.color),
                          from_name: 'Ximpul Shop'
                        })
                      });
                    }
                    toast.success(`We'll notify you when ${notifyData.color} is back in stock!`);
                  } catch (error) {
                    console.error('Error:', error);
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
