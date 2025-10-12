
interface ProductGalleryProps {
  mainImage: string;
  galleryImages: string[];
  onThumbnailClick: (image: string) => void;
}

export const ProductGallery = ({ mainImage, galleryImages, onThumbnailClick }: ProductGalleryProps) => {
  return (
    <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
      {/* Main Product Image */}
      <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <img src={mainImage} alt="Ximpul Flow Water Bottle" className="w-full h-full object-contain p-8" />
      </div>
      
      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-5 gap-3">
        {galleryImages.map((image, index) => (
          <div 
            key={index} 
            className={`aspect-square bg-white rounded-lg border overflow-hidden cursor-pointer hover:border-gray-900 transition-colors ${mainImage === image ? 'border-gray-900 border-2' : 'border-gray-200'}`}
            onClick={() => onThumbnailClick(image)}
          >
            <img src={image} alt={`Product view ${index + 1}`} className="w-full h-full object-contain p-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
