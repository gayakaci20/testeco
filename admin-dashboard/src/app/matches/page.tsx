'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Link2, Package, Car, TrendingUp, CheckCircle, Clock, AlertCircle, Search, Filter, RefreshCw, Users, MapPin } from 'lucide-react';

interface Match {
  id: string;
  status: 'PROPOSED' | 'ACCEPTED_BY_SENDER' | 'ACCEPTED_BY_CARRIER' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  price: number | null;
  proposedByUserId: string | null;
  createdAt: string;
  package: {
    id: string;
    title: string;
    description: string | null;
    pickupAddress: string;
    deliveryAddress: string;
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
  ride: {
    id: string;
    startLocation: string;
    endLocation: string;
    departureTime: string;
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

// Fonction utilitaire pour tronquer le texte
function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [statusFilter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/matches?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      
      const data = await response.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: matchId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchMatches(); // Refresh the list
        alert(`Match status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error updating match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error updating match');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      PROPOSED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Proposé' },
      ACCEPTED_BY_SENDER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepté Expéditeur' },
      ACCEPTED_BY_CARRIER: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Accepté Transporteur' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmé' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeté' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulé' },
    };
    
    const config = statusConfig[status] || statusConfig.PROPOSED;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getUserName = (user: any) => {
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email;
  };

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.id.toLowerCase().includes(searchLower) ||
              match.package.description?.toLowerCase().includes(searchLower) ||
      getUserName(match.package.user).toLowerCase().includes(searchLower) ||
      getUserName(match.ride.user).toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const confirmedMatches = matches.filter(m => m.status === 'CONFIRMED').length;
  const proposedMatches = matches.filter(m => m.status === 'PROPOSED').length;
  const rejectedMatches = matches.filter(m => m.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-violet-100 rounded-lg">
              <Link2 className="w-8 h-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Correspondances</h1>
              <p className="text-gray-600 mt-1">Administrez les correspondances entre colis et trajets</p>
            </div>
          </div>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Correspondances</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{matches.length}</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-lg">
              <Link2 className="w-6 h-6 text-violet-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15%</span>
            <span className="text-gray-500 ml-1">ce mois</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{confirmedMatches}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-green-600 font-medium">{matches.length > 0 ? Math.round((confirmedMatches / matches.length) * 100) : 0}%</span>
            <span className="text-gray-500 ml-1">taux de confirmation</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{proposedMatches}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Nécessitent une action</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedMatches}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-red-600 font-medium">{matches.length > 0 ? Math.round((rejectedMatches / matches.length) * 100) : 0}%</span>
            <span className="text-gray-500 ml-1">taux de rejet</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Rechercher
            </label>
            <input 
              type="text" 
              placeholder="Rechercher par ID, colis ou utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Statut
            </label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="PROPOSED">Proposé</option>
              <option value="ACCEPTED_BY_SENDER">Accepté Expéditeur</option>
              <option value="ACCEPTED_BY_CARRIER">Accepté Transporteur</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="REJECTED">Rejeté</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="bg-white rounded-xl border shadow-sm p-12">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Chargement des correspondances...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">Erreur lors du chargement: {error}</p>
          </div>
        </div>
      )}
      
      {/* Matches Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des Correspondances ({filteredMatches.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Link2 className="w-4 h-4 inline mr-1" />
                    Correspondance
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Package className="w-4 h-4 inline mr-1" />
                    Colis
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Car className="w-4 h-4 inline mr-1" />
                    Trajet
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Users className="w-4 h-4 inline mr-1" />
                    Participants
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <Link2 className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">Aucune correspondance trouvée</p>
                        <p className="text-gray-400 text-xs">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2 max-w-xs">
                        <div className="flex flex-col">
                          <div className="text-xs text-gray-400 font-mono truncate" title={match.id}>
                            ID: {match.id.slice(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(match.createdAt), 'dd/MM/yy')}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <div className="flex flex-col">
                                                                             <div className="text-sm font-medium text-gray-900 truncate" title={match.package.description || ''}>
                           {truncateText(match.package.description || '', 20)}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={match.package.description || ''}>
                            {truncateText(match.package.description || '', 25)}
                          </div>
                          <div className="text-xs text-blue-600 truncate" title={`${match.package.pickupAddress} → ${match.package.deliveryAddress}`}>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {truncateText(`${match.package.pickupAddress} → ${match.package.deliveryAddress}`, 30)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 truncate" title={`${match.ride.startLocation} → ${match.ride.endLocation}`}>
                            {truncateText(`${match.ride.startLocation} → ${match.ride.endLocation}`, 25)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(match.ride.departureTime), 'dd/MM HH:mm')}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <div className="flex flex-col space-y-1">
                          <div className="text-xs">
                            <span className="text-gray-500">Exp:</span>
                            <div className="font-medium text-gray-900 truncate" title={getUserName(match.package.user)}>
                              {truncateText(getUserName(match.package.user), 15)}
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Trans:</span>
                            <div className="font-medium text-gray-900 truncate" title={getUserName(match.ride.user)}>
                              {truncateText(getUserName(match.ride.user), 15)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {match.price ? (
                          <div className="text-sm font-medium text-green-600">{match.price}€</div>
                        ) : (
                          <span className="text-gray-400 text-xs">Non défini</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(match.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex flex-col space-y-1">
                          {match.status === 'PROPOSED' && (
                            <>
                              <button
                                onClick={() => updateMatchStatus(match.id, 'CONFIRMED')}
                                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-150"
                                title="Confirmer la correspondance"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => updateMatchStatus(match.id, 'REJECTED')}
                                className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-150"
                                title="Rejeter la correspondance"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                          {(match.status === 'ACCEPTED_BY_SENDER' || match.status === 'ACCEPTED_BY_CARRIER') && (
                            <button
                              onClick={() => updateMatchStatus(match.id, 'CONFIRMED')}
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-150"
                              title="Finaliser la correspondance"
                            >
                              Finaliser
                            </button>
                          )}
                          {(match.status === 'PROPOSED' || match.status === 'ACCEPTED_BY_SENDER' || match.status === 'ACCEPTED_BY_CARRIER') && (
                            <button
                              onClick={() => updateMatchStatus(match.id, 'CANCELLED')}
                              className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-150"
                              title="Annuler la correspondance"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredMatches.length > 0 && (
            <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200 text-sm">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{filteredMatches.length}</span>
                <span className="ml-1">correspondance{filteredMatches.length > 1 ? 's' : ''} trouvée{filteredMatches.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-2 py-1 border border-gray-300 rounded bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                  Précédent
                </button>
                <span className="px-2 py-1 text-xs text-gray-700">Page 1</span>
                <button className="px-2 py-1 border border-gray-300 rounded bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 