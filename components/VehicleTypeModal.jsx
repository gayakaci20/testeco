import { useState } from 'react';
import { Truck, X, Save } from 'lucide-react';

export default function VehicleTypeModal({ isOpen, onClose, onSave, currentVehicleType = '' }) {
  const [selectedVehicleType, setSelectedVehicleType] = useState(currentVehicleType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const vehicleOptions = [
    { value: 'car', label: '🚗 Voiture', description: 'Idéal pour petits colis et passagers (1-4 personnes)' },
    { value: 'van', label: '🚐 Fourgonnette', description: 'Parfait pour colis moyens et groupes (5-8 personnes)' },
    { value: 'truck', label: '🚛 Camion', description: 'Transport de marchandises et gros colis' },
    { value: 'motorcycle', label: '🏍️ Moto', description: 'Livraisons rapides en ville (1-2 personnes)' },
    { value: 'bus', label: '🚌 Bus', description: 'Transport de groupes (9+ personnes)' }
  ];

  const handleSave = async () => {
    if (!selectedVehicleType) {
      setError('Veuillez sélectionner un type de véhicule');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleType: selectedVehicleType
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSave(selectedVehicleType);
        onClose();
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl bg-white rounded-xl shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 items-center">
            <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
              <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configurez votre véhicule
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sélectionnez votre type de véhicule principal pour créer des trajets
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Pourquoi cette information ?
                  </h3>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                    Votre type de véhicule nous aide à vous proposer des trajets adaptés et à informer 
                    les clients de vos capacités de transport. Vous pourrez le modifier à tout moment dans votre profil.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sélectionnez votre type de véhicule principal *
            </label>
            
            {vehicleOptions.map((option) => (
              <div
                key={option.value}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedVehicleType === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onClick={() => setSelectedVehicleType(option.value)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="vehicleType"
                    value={option.value}
                    checked={selectedVehicleType === option.value}
                    onChange={() => setSelectedVehicleType(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
                  />
                  <div className="flex-1 ml-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </h4>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 mt-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="mr-auto text-sm text-gray-600 dark:text-gray-400">
            * Cette information est obligatoire pour créer des trajets
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedVehicleType || isLoading}
            className="flex gap-2 items-center px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer et continuer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 