import { useState, useEffect } from 'react';
import { MapPin, Plus, Check, X, Clock, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CheckpointManager({ packageId, onCheckpointAdded }) {
  const { user } = useAuth();
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]);
  const [newCheckpoint, setNewCheckpoint] = useState({
    location: '',
    notes: '',
    lat: null,
    lng: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCheckpoints();
  }, [packageId]);

  const fetchCheckpoints = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/packages/${packageId}/checkpoints`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCheckpoints(data);
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewCheckpoint(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleAddCheckpoint = async () => {
    if (!newCheckpoint.location.trim()) {
      alert('Veuillez entrer une localisation');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/packages/${packageId}/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(newCheckpoint)
      });

      if (response.ok) {
        const checkpoint = await response.json();
        setCheckpoints(prev => [...prev, checkpoint]);
        setNewCheckpoint({
          location: '',
          notes: '',
          lat: null,
          lng: null
        });
        setIsAddingCheckpoint(false);
        
        if (onCheckpointAdded) {
          onCheckpointAdded(checkpoint);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout du point de contrôle');
      }
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      alert('Erreur lors de l\'ajout du point de contrôle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Points de contrôle
        </h3>
        <button
          onClick={() => setIsAddingCheckpoint(true)}
          className="flex items-center px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un point
        </button>
      </div>

      {/* Add Checkpoint Form */}
      {isAddingCheckpoint && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Nouveau point de contrôle
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Localisation *
              </label>
              <input
                type="text"
                value={newCheckpoint.location}
                onChange={(e) => setNewCheckpoint(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Gare de Lyon, Paris"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={newCheckpoint.notes}
                onChange={(e) => setNewCheckpoint(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Informations additionnelles..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={getCurrentLocation}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Utiliser ma position
              </button>
              {newCheckpoint.lat && newCheckpoint.lng && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Position GPS ajoutée
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddCheckpoint}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
              <button
                onClick={() => {
                  setIsAddingCheckpoint(false);
                  setNewCheckpoint({
                    location: '',
                    notes: '',
                    lat: null,
                    lng: null
                  });
                }}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkpoints List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p>Aucun point de contrôle ajouté</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.id}
              className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {checkpoint.location}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(checkpoint.timestamp)}
                  </span>
                </div>
                {checkpoint.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {checkpoint.notes}
                  </p>
                )}
                {checkpoint.lat && checkpoint.lng && (
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                    <Navigation className="w-3 h-3 mr-1" />
                    Position GPS enregistrée
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 