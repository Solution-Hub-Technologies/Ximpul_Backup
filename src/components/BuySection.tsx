
import React from 'react';
import { Link } from 'react-router-dom';
import { useBuySection } from '@/hooks/useBuySection';
import { BuySectionStates } from './buy/BuySectionStates';
import { BuySectionContent } from './buy/BuySectionContent';

export const BuySection = () => {
  console.log('BuySection component rendering...');
  
  const buySection = useBuySection();

  // Enhanced debugging for all environments
  console.log('BuySection render state:', {
    editions: buySection.editions.length,
    accessories: buySection.accessories.length,
    loadingProducts: buySection.loadingProducts,
    loadingAccessories: buySection.loadingAccessories,
    productsError: buySection.productsError?.message || null,
    accessoriesError: buySection.accessoriesError?.message || null,
    environment: import.meta.env.MODE,
    href: window.location.href
  });

  // Always render the section container - this ensures the section is visible
  return (
    <section id="buy" className="py-16 bg-gray-50 fade-on-scroll" style={{ minHeight: '400px' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="lg:text-[2.7rem] xl:text-[3.24rem] font-semibold leading-tight tracking-tight apple-gradient-text mb-4 text-[3.24rem]" style={{
            lineHeight: 1.09
          }}>
            Order Your Ximpul Flow
          </h2>
          <p className="text-lg text-gray-600">
            Complete your order in simple steps
          </p>
          <p className="text-base text-gray-500 mt-2">
            FREE Delivery. World-class quality. <Link to="/trueprice" onClick={() => window.scrollTo(0, 0)} className="text-primary font-medium hover:underline">#TruePrice</Link>.
          </p>
        </div>

        <BuySectionStates 
          loadingProducts={buySection.loadingProducts}
          loadingAccessories={buySection.loadingAccessories}
          productsError={buySection.productsError}
          accessoriesError={buySection.accessoriesError}
        />

        {/* Show main content when data is available OR show fallback */}
        {(!buySection.loadingProducts && !buySection.loadingAccessories) && (
          <BuySectionContent 
            selectedEdition={buySection.selectedEdition}
            selectedColor={buySection.selectedColor}
            selectedAccessories={buySection.selectedAccessories}
            engravingText={buySection.engravingText}
            customerName={buySection.customerName}
            customerPhone={buySection.customerPhone}
            customerEmail={buySection.customerEmail}
            customerAddress={buySection.customerAddress}
            paymentMethod={buySection.paymentMethod}
            isEngravingModalOpen={buySection.isEngravingModalOpen}
            editions={buySection.editions}
            accessories={buySection.accessories}
            setSelectedEdition={buySection.setSelectedEdition}
            setSelectedColor={buySection.setSelectedColor}
            handleEngravingChange={buySection.handleEngravingChange}
            setCustomerName={buySection.setCustomerName}
            setCustomerPhone={buySection.setCustomerPhone}
            setCustomerEmail={buySection.setCustomerEmail}
            setCustomerAddress={buySection.setCustomerAddress}
            handlePaymentMethodChange={buySection.handlePaymentMethodChange}
            setIsEngravingModalOpen={buySection.setIsEngravingModalOpen}
            handleAccessoryToggle={buySection.handleAccessoryToggle}
            handleOrderSubmit={buySection.handleOrderSubmit}
            isSubmitting={buySection.orderMutation.isPending}
            isPaymentMethodLocked={buySection.isPaymentMethodLocked}
            privacyPreference={buySection.privacyPreference}
            setPrivacyPreference={buySection.setPrivacyPreference}
          />
        )}
      </div>
    </section>
  );
};
