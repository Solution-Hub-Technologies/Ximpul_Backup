
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lock } from 'lucide-react';
import { useState } from 'react';

interface CustomerDetailsFormProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  selectedColor: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

export const CustomerDetailsForm = ({ 
  customerName, 
  customerPhone, 
  customerEmail,
  customerAddress,
  selectedColor, 
  onNameChange, 
  onPhoneChange,
  onEmailChange,
  onAddressChange 
}: CustomerDetailsFormProps) => {
  const isDisabled = !selectedColor;
  const [phoneError, setPhoneError] = useState('');
  
  const validateBangladeshiPhone = (phone: string) => {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Check for valid Bangladeshi formats: +8801xxxxxxxxx or 01xxxxxxxxx
    const isValid = /^(?:\+?880|0)1[3-9]\d{8}$/.test(cleanPhone);
    
    if (!cleanPhone) {
      setPhoneError('Phone number is required');
    } else if (!isValid) {
      setPhoneError('Please enter a valid Bangladeshi phone number');
    } else {
      setPhoneError('');
    }
    
    return isValid;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">6. Your Information</h3>
          {isDisabled && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
        {isDisabled && (
          <p className="text-sm text-gray-500 mt-1">Please select a color first</p>
        )}
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
              Name *
            </Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Enter your name" 
              value={customerName} 
              onChange={e => selectedColor && onNameChange(e.target.value)} 
              className="text-base h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900" 
              required 
              disabled={isDisabled}
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
              Phone Number *
            </Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="Enter your phone number (e.g., 01712345678)" 
              value={customerPhone} 
              onChange={e => {
                if (selectedColor) {
                  onPhoneChange(e.target.value);
                  validateBangladeshiPhone(e.target.value);
                }
              }} 
              className={`text-base h-12 rounded-lg ${phoneError ? 'border-red-500' : 'border-gray-300'} focus:border-gray-900 focus:ring-gray-900`} 
              required 
              disabled={isDisabled}
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
              Email (Optional)
            </Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter your email address" 
              value={customerEmail} 
              onChange={e => selectedColor && onEmailChange(e.target.value)} 
              className="text-base h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900" 
              disabled={isDisabled}
            />
          </div>
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
              Address *
            </Label>
            <Textarea 
              id="address" 
              placeholder="Enter your complete address" 
              value={customerAddress} 
              onChange={e => selectedColor && onAddressChange(e.target.value)} 
              className="text-base rounded-lg border-gray-300 min-h-[100px] focus:border-gray-900 focus:ring-gray-900" 
              required 
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
