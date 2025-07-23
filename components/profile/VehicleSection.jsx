import { useState } from 'react';
import { Truck, Edit, Save, XCircle } from 'lucide-react';

export default function VehicleSection({ 
  user, 
  isEditing, 
  setIsEditing, 
  vehicleType,
  setVehicleType,
  errors, 
  handleSave, 
  handleCancel,
  isLoading 
}) {
  const vehicleOptions = [
    { value: 'car', label: '🚗 Voiture', description: 'Idéal pour petits colis et passagers (1-4 personnes)' },
    { value: 'van', label: '🚐 Fourgonnette', description: 'Parfait pour colis moyens et groupes (5-8 personnes)' },
    { value: 'truck', label: '🚛 Camion', description: 'Transport de marchandises et gros colis' },
    { value: 'motorcycle', label: '🏍️ Moto', description: 'Livraisons rapides en ville (1-2 personnes)' },
    { value: 'bus', label: '🚌 Bus', description: 'Transport de groupes (9+ personnes)' }
  ];

  const getCurrentVehicleOption = () => {
    return vehicleOptions.find(option => option.value === vehicleType) || 
           { label: 'Non défini', description: 'Veuillez sélectionner votre type de véhicule' };
  };

  // Only show this section for carriers
  if (user?.role !== 'CARRIER') {
    return null;
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Véhicule</h2>
        </div>
        {!isEditing.vehicle && (
          <button
            onClick={() => setIsEditing(prev => ({ ...prev, vehicle: true }))}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>
      
      <div className="p-6">
        {isEditing.vehicle ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type de véhicule *
              </label>
              <div className="space-y-2">
                {vehicleOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                      vehicleType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setVehicleType(option.value)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="vehicleType"
                        value={option.value}
                        checked={vehicleType === option.value}
                        onChange={() => setVehicleType(option.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.vehicleType && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.vehicleType}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleCancel('vehicle')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleSave('vehicle')}
                disabled={isLoading || !vehicleType}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de véhicule
              </label>
              <div className={`p-4 border rounded-lg ${
                vehicleType 
                  ? 'border-gray-300 dark:border-gray-600' 
                  : 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
              }`}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      vehicleType 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-orange-800 dark:text-orange-200'
                    }`}>
                      {getCurrentVehicleOption().label}
                    </h4>
                    <p className={`mt-1 text-xs ${
                      vehicleType 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      {getCurrentVehicleOption().description}
                    </p>
                  </div>
                </div>
              </div>
              {!vehicleType && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Vous devez définir votre type de véhicule pour créer des trajets.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 