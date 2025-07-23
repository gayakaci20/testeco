import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Bell,
  Package,
  MapPin,
  Clock,
  DollarSign,
  User,
  Check,
  X,
  Eye,
  MessageCircle,
  Star,
  Truck,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function RideProposals({ userId, onProposalUpdate }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProposals();
    }
  }, [userId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Pour l'instant, utilisons les notifications pour les propositions
      const response = await fetch('/api/notifications?type=RIDE_PROPOSAL');
      if (response.ok) {
        const notifications = await response.json();
        setProposals(notifications);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalResponse = async (proposalId, status, response = '') => {
    try {
      setResponding(true);
      
      // Marquer la notification comme lue
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: proposalId })
      });

      // Créer un match si accepté
      if (status === 'ACCEPTED') {
        const proposalData = selectedProposal?.data || {};
        await fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rideId: proposalData.rideId,
            packageId: proposalData.packageId,
            price: proposalData.proposedPrice,
            notes: response
          })
        });
      }

      // Rafraîchir les propositions
      fetchProposals();
      
      // Fermer le modal
      setShowDetailModal(false);
      setSelectedProposal(null);

      // Notifier le parent
      if (onProposalUpdate) {
        onProposalUpdate(proposalId, status);
      }

      alert(status === 'ACCEPTED' ? 'Proposition acceptée!' : 'Proposition refusée.');
    } catch (error) {
      console.error('Error responding to proposal:', error);
      alert('Erreur lors de la réponse à la proposition');
    } finally {
      setResponding(false);
    }
  };

  const openDetailModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyBadge = (isUrgent) => {
    if (!isUrgent) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Urgent
      </span>
    );
  };

  const getFragileBadge = (isFragile) => {
    if (!isFragile) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <Package className="w-3 h-3 mr-1" />
        Fragile
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Chargement des propositions...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Erreur lors du chargement: {error}</span>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals.filter(p => !p.isRead);
  const respondedProposals = proposals.filter(p => p.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-600" />
          Propositions de trajet
          {pendingProposals.length > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
              {pendingProposals.length}
            </span>
          )}
        </h2>
        <button
          onClick={fetchProposals}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Actualiser
        </button>
      </div>

      {/* Pending Proposals */}
      {pendingProposals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nouvelles propositions ({pendingProposals.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingProposals.map((proposal) => (
              <div key={proposal.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {proposal.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(proposal.createdAt), 'PPpp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {proposal.message}
                    </p>

                    {proposal.data && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {proposal.data.proposedPrice && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {proposal.data.proposedPrice}€
                          </span>
                        )}
                        {proposal.data.pickupLocation && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <MapPin className="w-3 h-3 mr-1" />
                            {proposal.data.pickupLocation}
                          </span>
                        )}
                        {getUrgencyBadge(proposal.data.isUrgent)}
                        {getFragileBadge(proposal.data.isFragile)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openDetailModal(proposal)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responded Proposals */}
      {respondedProposals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Propositions traitées ({respondedProposals.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {respondedProposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="p-6 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {proposal.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(proposal.createdAt), 'PPpp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {proposal.message}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Traitée
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {proposals.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucune proposition
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vous n'avez pas encore reçu de propositions pour vos trajets.
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détails de la proposition
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Message
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {selectedProposal.message}
                </p>
              </div>

              {selectedProposal.data && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedProposal.data.proposedPrice && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Prix proposé
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedProposal.data.proposedPrice}€
                      </p>
                    </div>
                  )}
                  {selectedProposal.data.pickupLocation && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Lieu de ramassage
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedProposal.data.pickupLocation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleProposalResponse(selectedProposal.id, 'REJECTED')}
                  disabled={responding}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Refuser
                </button>
                <button
                  onClick={() => handleProposalResponse(selectedProposal.id, 'ACCEPTED')}
                  disabled={responding}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 