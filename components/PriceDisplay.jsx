import { Calculator, Package, Weight, MapPin } from 'lucide-react';

export default function PriceDisplay({ 
  price, 
  sizeLabel, 
  weight, 
  distance, 
  showDetails = false,
  className = "" 
}) {
  if (!price) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 ${className}`}>
        Prix non calculé
      </div>
    );
  }

  const getSizeColor = (size) => {
    switch (size) {
      case 'S': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'M': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'L': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'XL': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'XXL': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'XXXL': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-4 h-4 text-sky-500" />
        <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
          {price}€
        </span>
      </div>
      
      {showDetails && (
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {sizeLabel && (
            <div className="flex items-center gap-2">
              <Package className="w-3 h-3" />
              <span>Taille:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSizeColor(sizeLabel)}`}>
                {sizeLabel}
              </span>
            </div>
          )}
          
          {weight && (
            <div className="flex items-center gap-2">
              <Weight className="w-3 h-3" />
              <span>Poids: {weight} kg</span>
            </div>
          )}
          
          {distance && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>Distance: ~{distance} km</span>
            </div>
          )}
        </div>
      )}
      
      {!showDetails && (sizeLabel || weight) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {sizeLabel && (
            <span className={`px-2 py-1 rounded-full font-medium ${getSizeColor(sizeLabel)}`}>
              {sizeLabel}
            </span>
          )}
          {weight && (
            <span className="flex items-center gap-1">
              <Weight className="w-3 h-3" />
              {weight}kg
            </span>
          )}
        </div>
      )}
    </div>
  );
} 