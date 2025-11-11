
import { useState } from 'react';
import { useProducts, useAccessories } from '@/hooks/useProducts';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';

export const useBuySection = () => {
  const [selectedEdition, setSelectedEdition] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [engravingText, setEngravingText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isPaymentMethodLocked, setIsPaymentMethodLocked] = useState(false);
  const [isEngravingModalOpen, setIsEngravingModalOpen] = useState(false);
  const [privacyPreference, setPrivacyPreference] = useState(false);

  const { data: editions = [], isLoading: loadingProducts, error: productsError } = useProducts();
  const { data: accessories = [], isLoading: loadingAccessories, error: accessoriesError } = useAccessories();
  const orderMutation = useOrderSubmission();

  // Reset accessories when edition changes
  const handleEditionChange = (edition: string) => {
    console.log('Edition changing from', selectedEdition, 'to', edition);
    console.log('Clearing accessories:', selectedAccessories);
    setSelectedEdition(edition);
    setSelectedAccessories([]); // Clear accessories when edition changes
    console.log('Accessories cleared');
  };

  const handleAccessoryToggle = (accessory: string) => {
    if (!selectedColor) return;
    setSelectedAccessories(prev => 
      prev.includes(accessory) 
        ? prev.filter(a => a !== accessory) 
        : [...prev, accessory]
    );
  };

  const handleEngravingChange = (text: string) => {
    setEngravingText(text);
    
    if (text.trim()) {
      // If engraving text exists, force online payment and lock the option
      setPaymentMethod('online');
      setIsPaymentMethodLocked(true);
    } else {
      // If engraving text is removed, unlock payment options
      setIsPaymentMethodLocked(false);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    // Only allow change if payment method is not locked due to engraving
    if (!isPaymentMethodLocked) {
      setPaymentMethod(method);
    }
  };

  const handleOrderSubmit = () => {
    console.log('=== ORDER SUBMIT STARTED ===');
    console.log('Payment method:', paymentMethod);
    
    const basePrice = selectedEdition ? (editions.find(e => e.value === selectedEdition)?.price || 0) : 0;
    const accessoriesPrice = selectedAccessories.reduce((total, accessory) => {
      const item = accessories.find(a => a.name === accessory);
      return total + (item?.price || 0);
    }, 0);
    const engravingPrice = engravingText ? 150 : 0;
    const deliveryFee = paymentMethod === 'cod' ? 100 : 0;
    const subtotal = basePrice + accessoriesPrice + engravingPrice;
    const totalPrice = subtotal + deliveryFee;

    const orderData = {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      selectedEdition,
      selectedColor,
      selectedAccessories,
      engravingText,
      paymentMethod,
      subtotal,
      deliveryFee,
      totalAmount: totalPrice,
      privacyPreference
    };
    
    console.log('Order data:', orderData);
    console.log('=== CALLING ORDER MUTATION ===');
    
    orderMutation.mutate(orderData);
  };

  return {
    // State
    selectedEdition,
    selectedColor,
    selectedAccessories,
    engravingText,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    paymentMethod,
    isEngravingModalOpen,
    isPaymentMethodLocked,
    privacyPreference,
    // Data
    editions,
    accessories,
    loadingProducts,
    loadingAccessories,
    productsError,
    accessoriesError,
    orderMutation,
    // Actions
    setSelectedEdition: handleEditionChange,
    setSelectedColor,
    handleEngravingChange,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setCustomerAddress,
    handlePaymentMethodChange,
    setIsEngravingModalOpen,
    handleAccessoryToggle,
    handleOrderSubmit,
    setPrivacyPreference
  };
};
