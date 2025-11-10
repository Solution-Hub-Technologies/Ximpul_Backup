
import { Lock, Edit } from 'lucide-react';

interface EngravingSectionProps {
  engravingText: string;
  selectedColor: string;
  onOpenModal: () => void;
}

export const EngravingSection = ({ engravingText, selectedColor, onOpenModal }: EngravingSectionProps) => {
  const isDisabled = !selectedColor;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">4. Personalize with Engraving <span className="text-base font-normal text-gray-500">(Optional)</span></h3>
          {isDisabled && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
        {isDisabled && (
          <p className="text-sm text-gray-500 mt-1">Please select a color first</p>
        )}
      </div>
      <div className="p-6">
        <button 
          onClick={onOpenModal}
          disabled={isDisabled}
          className="w-full h-12 px-4 rounded-lg border border-gray-300 flex items-center justify-between text-base disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          <span className={engravingText ? 'text-gray-900' : 'text-gray-500'}>
            {engravingText || 'Add your name or message'}
          </span>
          <Edit className="w-4 h-4 text-gray-500" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {engravingText ? 'Engraving: +150 BDT' : 'Engraving available for +150 BDT'}
        </p>
      </div>
    </div>
  );
};
