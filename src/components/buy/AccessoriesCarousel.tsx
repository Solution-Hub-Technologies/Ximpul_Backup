
import { Check, Plus, Lock } from 'lucide-react';
import { Accessory } from '@/types/buySection';

interface AccessoriesCarouselProps {
  accessories: Accessory[];
  selectedAccessories: string[];
  selectedColor: string;
  selectedEdition: string;
  onAccessoryToggle: (accessory: string) => void;
}

export const AccessoriesCarousel = ({ accessories, selectedAccessories, selectedColor, selectedEdition, onAccessoryToggle }: AccessoriesCarouselProps) => {
  const isDisabled = !selectedColor || selectedEdition !== 'base';
  
  // Check if accessory is out of stock based on selected color
  const isOutOfStock = (accessory: Accessory) => {
    if (accessory.name.toLowerCase() === 'straw cap') {
      if (!selectedColor) return false; // Don't show out of stock if no color selected
      if (selectedColor === 'obsidian') {
        return (accessory.stock_black || 0) <= 0;
      } else if (selectedColor === 'graphite') {
        return (accessory.stock_grey || 0) <= 0;
      }
    }
    return (accessory.stock_default || 0) <= 0;
  };
  
  // Handle accessory toggle with stock check
  const handleAccessoryClick = (accessory: Accessory) => {
    if (isDisabled) return;
    
    if (isOutOfStock(accessory)) {
      alert(`${accessory.name} is out of stock`);
      return;
    }
    
    onAccessoryToggle(accessory.name);
  };

  // Filter out Silicone Sleeve and Standard Cap, then sort remaining accessories
  const filteredAccessories = accessories.filter(accessory => 
    !['Silicone Sleeve', 'Grip Sleeve', 'Standard Cap', 'Premium Cap'].includes(accessory.name)
  );

  // Custom order for remaining accessories
  const getAccessoryOrder = (accessoryName: string) => {
    const orderMap: { [key: string]: number } = {
      'Straw Cap': 1,
      'Steel Straw Set': 2,
      'Cleaning Brush': 3,
      'Bottle Brush': 3,
      'Straw Cleaning Brush': 4,
      'Hydration Lid': 4
    };
    return orderMap[accessoryName] || 999;
  };

  // Sort filtered accessories by custom order
  const sortedAccessories = [...filteredAccessories].sort((a, b) => 
    getAccessoryOrder(a.name) - getAccessoryOrder(b.name)
  );

  // Map accessory names to their specific images (swapped Straw Cap and Straw Cleaning Brush)
  const getAccessoryImage = (accessoryName: string) => {
    console.log('Getting image for accessory:', accessoryName);
    
    const imageMap: { [key: string]: string } = {
      'Carabiner Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
      'Aluminium Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
      'Bottle Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
      'Cleaning Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
      'Steel Straw Set': '/ximpul-uploads/a09450ea-b274-4a61-ab28-d9f053a0d789.png',
      'Straw Cap': '/ximpul-uploads/f260e012-e3be-4c1c-8b71-1d2d98fbc29f.png',
      'Grip Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png',
      'Silicone Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png',
      'Premium Cap': '/ximpul-uploads/f083954e-29e0-4720-a050-e8d9f88e5192.png',
      'Standard Cap': '/ximpul-uploads/f083954e-29e0-4720-a050-e8d9f88e5192.png',
      'Hydration Lid': '/ximpul-uploads/f260e012-e3be-4c1c-8b71-1d2d98fbc29f.png',
      'Straw Cleaning Brush': '/ximpul-uploads/a09450ea-b274-4a61-ab28-d9f053a0d789.png'
    };
    
    // Return specific image if found, otherwise fallback to generic image
    const image = imageMap[accessoryName] || '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
    console.log('Returning image:', image, 'for accessory:', accessoryName);
    return image;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">3. Add Accessories <span className="text-base font-normal text-gray-500">(Optional)</span></h3>
          {isDisabled && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
        {isDisabled && (
          <p className="text-sm text-gray-500 mt-1">
            {!selectedColor ? 'Please select a color first' : 'Accessories are only available for Base Edition'}
          </p>
        )}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedAccessories.map((accessory, index) => {
            const outOfStock = isOutOfStock(accessory);
            return (
            <div 
              key={index}
              className={`group relative p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                isDisabled || outOfStock
                  ? 'border-gray-100 cursor-not-allowed bg-gray-50 opacity-60' 
                  : selectedAccessories.includes(accessory.name) 
                    ? 'border-gray-900 bg-gray-100 shadow-lg shadow-gray-200' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
              }`} 
              onClick={() => handleAccessoryClick(accessory)}
            >
              {/* Selection Indicator */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                selectedAccessories.includes(accessory.name) && !isDisabled && !outOfStock
                  ? 'bg-gray-900 border-gray-900' 
                  : 'border-gray-300 bg-white'
              }`}>
                {selectedAccessories.includes(accessory.name) && !isDisabled && !outOfStock ? (
                  <Check className="w-3 h-3 text-white" />
                ) : outOfStock ? (
                  <span className="text-red-500 text-xs font-bold">✕</span>
                ) : (
                  <Plus className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              {/* Out of Stock Badge */}
              {outOfStock && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  OUT OF STOCK
                </div>
              )}

              {/* Product Image */}
              <div className="flex justify-center mb-3">
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 p-1 ${
                  selectedAccessories.includes(accessory.name) && !isDisabled
                    ? 'bg-gray-200' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <img 
                    src={getAccessoryImage(accessory.name)}
                    alt={accessory.name} 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      console.log('Image failed to load:', getAccessoryImage(accessory.name));
                      e.currentTarget.src = '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
                    }}
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                  {accessory.name}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {accessory.note}
                </p>
                <div className="pt-2">
                  <span className={`font-bold text-sm ${
                    outOfStock ? 'text-red-500' : 'text-gray-900'
                  }`}>
                    {outOfStock ? 'Out of Stock' : `+${accessory.price} BDT`}
                  </span>
                </div>
              </div>

              {/* Hover Effect */}
              {!isDisabled && !outOfStock && (
                <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  selectedAccessories.includes(accessory.name)
                    ? 'ring-2 ring-gray-900 ring-opacity-50' 
                    : 'group-hover:ring-2 group-hover:ring-gray-200'
                }`} />
              )}
            </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Note: Accessories color will match your selected bottle color
        </p>
      </div>
    </div>
  );
};
