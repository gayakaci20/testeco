import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Navigation, 
  Truck, 
  Package, 
  User, 
  Route, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  QrCode,
  Phone,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RelayManager({ packageId, onRelayCreated }) {
  const { user } = useAuth();
  const [isCreatingRelay, setIsCreatingRelay] = useState(false);
  const [relayHistory, setRelayHistory] = useState([]);
  const [availableCarriers, setAvailableCarriers] = useState([]);
  const [packageDetails, setPackageDetails] = useState(null);
  const [newRelay, setNewRelay] = useState({
    dropoffLocation: '',
    notes: '',
    nextCarrierId: '',
    estimatedArrival: '',
    transferCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRelayHistory();
    fetchPackageDetails();
    fetchAvailableCarriers();
  }, [packageId]);

  const fetchRelayHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/packages/${packageId}/relay-history`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRelayHistory(data);
      }
    } catch (error) {
      console.error('Error fetching relay history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackageDetails = async () => {
    try {
      const response = await fetch(`/api/packages/${packageId}/details`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackageDetails(data);
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
    }
  };

  const fetchAvailableCarriers = async () => {
    try {
      const response = await fetch(`/api/carriers/available-for-relay`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCarriers(data);
      }
    } catch (error) {
      console.error('Error fetching available carriers:', error);
    }
  };

  const generateTransferCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewRelay(prev => ({ ...prev, transferCode: code }));
  };

  const handleCreateRelay = async () => {
    if (!newRelay.dropoffLocation.trim()) {
      alert('Veuillez entrer un point de dépôt');
      return;
    }

    if (!newRelay.nextCarrierId) {
      alert('Veuillez sélectionner un transporteur pour le relais');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create relay checkpoint
      const checkpointResponse = await fetch(`/api/packages/${packageId}/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          location: newRelay.dropoffLocation,
          notes: newRelay.notes,
          eventType: 'TRANSFER',
          nextCarrierId: newRelay.nextCarrierId,
          transferCode: newRelay.transferCode
        })
      });

      if (checkpointResponse.ok) {
        // Create relay proposal
        const relayResponse = await fetch(`/api/packages/${packageId}/create-relay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || ''
          },
          body: JSON.stringify({
            dropoffLocation: newRelay.dropoffLocation,
            nextCarrierId: newRelay.nextCarrierId,
            notes: newRelay.notes,
            transferCode: newRelay.transferCode,
            estimatedArrival: newRelay.estimatedArrival
          })
        });

        if (relayResponse.ok) {
          const relay = await relayResponse.json();
          setRelayHistory(prev => [...prev, relay]);
          setNewRelay({
            dropoffLocation: '',
            notes: '',
            nextCarrierId: '',
            estimatedArrival: '',
            transferCode: ''
          });
          setIsCreatingRelay(false);
          
          if (onRelayCreated) {
            onRelayCreated(relay);
          }
        } else {
          const error = await relayResponse.json();
          alert(error.error || 'Erreur lors de la création du relais');
        }
      } else {
        const error = await checkpointResponse.json();
        alert(error.error || 'Erreur lors de la création du point de contrôle');
      }
    } catch (error) {
      console.error('Error creating relay:', error);
      alert('Erreur lors de la création du relais');
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

  const getRelayStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'IN_TRANSIT':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Gestion des relais
        </h3>
        <button
          onClick={() => setIsCreatingRelay(true)}
          className="flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer un relais
        </button>
      </div>

      {/* Package Journey Overview */}
      {packageDetails && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Trajet du colis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <div>
                <span className="text-gray-600 dark:text-gray-400">Départ:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {packageDetails.senderAddress}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-gray-600 dark:text-gray-400">Position actuelle:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {packageDetails.currentLocation || 'En transit'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <div>
                <span className="text-gray-600 dark:text-gray-400">Destination finale:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {packageDetails.finalDestination || packageDetails.recipientAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Relay Form */}
      {isCreatingRelay && (
        <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Créer un nouveau relais
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Point de dépôt *
              </label>
              <input
                type="text"
                value={newRelay.dropoffLocation}
                onChange={(e) => setNewRelay(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                placeholder="Ex: Gare de Lyon, Paris"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transporteur suivant *
              </label>
              <select
                value={newRelay.nextCarrierId}
                onChange={(e) => setNewRelay(prev => ({ ...prev, nextCarrierId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              >
                <option value="">Sélectionner un transporteur</option>
                {availableCarriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.firstName} {carrier.lastName} - {carrier.companyName || 'Transporteur indépendant'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Heure d'arrivée estimée
              </label>
              <input
                type="datetime-local"
                value={newRelay.estimatedArrival}
                onChange={(e) => setNewRelay(prev => ({ ...prev, estimatedArrival: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={newRelay.notes}
                onChange={(e) => setNewRelay(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instructions pour le transporteur suivant..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code de transfert:
              </label>
              <input
                type="text"
                value={newRelay.transferCode}
                onChange={(e) => setNewRelay(prev => ({ ...prev, transferCode: e.target.value }))}
                placeholder="Code automatique"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
              <button
                onClick={generateTransferCode}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Générer
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCreateRelay}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Création...' : 'Créer le relais'}
              </button>
              <button
                onClick={() => {
                  setIsCreatingRelay(false);
                  setNewRelay({
                    dropoffLocation: '',
                    notes: '',
                    nextCarrierId: '',
                    estimatedArrival: '',
                    transferCode: ''
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

      {/* Relay History */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
        </div>
      ) : relayHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Route className="w-8 h-8 mx-auto mb-2" />
          <p>Aucun relais créé pour ce colis</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Historique des relais
          </h4>
          {relayHistory.map((relay, index) => (
            <div
              key={relay.id}
              className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-sky-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {relay.dropoffLocation}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelayStatusColor(relay.status)}`}>
                    {relay.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Vers: {relay.nextCarrier?.firstName} {relay.nextCarrier?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(relay.createdAt)}
                    </span>
                  </div>
                  {relay.transferCode && (
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Code: {relay.transferCode}
                      </span>
                    </div>
                  )}
                  {relay.estimatedArrival && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Arrivée prévue: {formatDate(relay.estimatedArrival)}
                      </span>
                    </div>
                  )}
                </div>
                
                {relay.notes && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Notes: </span>
                    <span className="text-gray-900 dark:text-white">{relay.notes}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 mt-3">
                  {relay.nextCarrier && (
                    <>
                      <button className="flex items-center px-3 py-1 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        Appeler
                      </button>
                      <button className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 