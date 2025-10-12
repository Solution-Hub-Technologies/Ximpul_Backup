
interface BuySectionStatesProps {
  loadingProducts: boolean;
  loadingAccessories: boolean;
  productsError: Error | null;
  accessoriesError: Error | null;
}

export const BuySectionStates = ({ 
  loadingProducts, 
  loadingAccessories, 
  productsError, 
  accessoriesError 
}: BuySectionStatesProps) => {
  // Show error state
  if (productsError || accessoriesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mb-8">
        <p className="text-lg text-red-600 mb-2">
          Unable to load product information
        </p>
        <p className="text-sm text-red-500 mb-4">
          {productsError?.message || accessoriesError?.message || 'Network or database connection issue'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // Show loading state
  if (loadingProducts || loadingAccessories) {
    return (
      <div className="bg-white rounded-lg p-8 max-w-md mx-auto border border-gray-200 mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
        <p className="text-lg text-gray-600 mb-2 text-center">Loading products...</p>
        <p className="text-sm text-gray-500 text-center">
          {loadingProducts && 'Loading editions...'} 
          {loadingAccessories && 'Loading accessories...'}
        </p>
      </div>
    );
  }

  return null;
};
