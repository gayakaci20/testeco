'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Package2, MapPin, Clock, Users, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Search, Filter, Plus, Edit3, Trash2, User, Weight, Calendar } from 'lucide-react';

interface Package {
  id: string;
  description: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  weight: number | null;
  dimensions: string | null;
  fragile: boolean;
  urgent: boolean;
  trackingNumber: string;
  status: 'PENDING' | 'MATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  price: number | null;
  size: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  matches: Array<{
    id: string;
    status: string;
    ride: {
      id: string;
      startLocation: string;
      endLocation: string;
      user: {
        name: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string;
        role: string;
      };
    };
  }>;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    userId: '',
    description: '',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    weight: 0,
    dimensions: '',
    fragile: false,
    urgent: false,
    price: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, [statusFilter]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/packages?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updatePackageStatus = async (packageId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: packageId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchPackages(); // Refresh the list
        alert(`Statut du colis mis à jour vers ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la mise à jour du colis');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Erreur lors de la mise à jour du colis');
    }
  };

  const createPackage = async () => {
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPackage),
      });

      if (response.ok) {
        fetchPackages(); // Refresh the list
        setShowCreateModal(false);
        setNewPackage({
          userId: '',
          description: '',
          senderName: '',
          senderPhone: '',
          senderAddress: '',
          recipientName: '',
          recipientPhone: '',
          recipientAddress: '',
          weight: 0,
          dimensions: '',
          fragile: false,
          urgent: false,
          price: 0,
        });
        alert('Colis créé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création du colis');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Erreur lors de la création du colis');
    }
  };

  const deletePackage = async (packageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce colis ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/packages?id=${packageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPackages(); // Refresh the list
        alert('Colis supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression du colis');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Erreur lors de la suppression du colis');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Attente' },
      MATCHED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Associé' },
      IN_TRANSIT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Transit' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livré' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
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

  const filteredPackages = packages.filter(pkg => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pkg.id.toLowerCase().includes(searchLower) ||
      pkg.description.toLowerCase().includes(searchLower) ||
      pkg.senderName.toLowerCase().includes(searchLower) ||
      pkg.recipientName.toLowerCase().includes(searchLower) ||
      pkg.senderAddress.toLowerCase().includes(searchLower) ||
      pkg.recipientAddress.toLowerCase().includes(searchLower) ||
      pkg.trackingNumber.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const pendingPackages = packages.filter(p => p.status === 'PENDING').length;
  const deliveredPackages = packages.filter(p => p.status === 'DELIVERED').length;
  const inTransitPackages = packages.filter(p => p.status === 'IN_TRANSIT').length;
  const totalWeight = packages.reduce((sum, p) => sum + (p.weight || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Colis</h1>
              <p className="mt-1 text-gray-600">Suivez et gérez tous les colis de la plateforme</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              <Plus className="mr-2 w-5 h-5" />
              Créer un colis
            </button>
            <button
              onClick={fetchPackages}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-green-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Colis</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{packages.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
            <span className="font-medium text-green-600">+12%</span>
            <span className="ml-1 text-gray-500">ce mois</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingPackages}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">À traiter</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Transit</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">{inTransitPackages}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">En cours de livraison</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{deliveredPackages}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">94%</span>
            <span className="ml-1 text-gray-500">taux de réussite</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Search className="inline mr-1 w-4 h-4" />
              Rechercher
            </label>
            <input 
              type="text" 
              placeholder="Rechercher par description, expéditeur, destinataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Filter className="inline mr-1 w-4 h-4" />
              Statut
            </label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En Attente</option>
              <option value="MATCHED">Associé</option>
              <option value="IN_TRANSIT">En Transit</option>
              <option value="DELIVERED">Livré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="p-12 bg-white rounded-xl border shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Chargement des colis...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="mr-2 w-5 h-5 text-red-400" />
            <p className="text-red-800">Erreur lors du chargement: {error}</p>
          </div>
        </div>
      )}
      
      {/* Packages Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des Colis ({filteredPackages.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Package2 className="inline mr-1 w-4 h-4" />
                    Colis
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <User className="inline mr-1 w-4 h-4" />
                    Expéditeur
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <User className="inline mr-1 w-4 h-4" />
                    Livreur
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <MapPin className="inline mr-1 w-4 h-4" />
                    Itinéraire
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Weight className="inline mr-1 w-4 h-4" />
                    Poids
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Calendar className="inline mr-1 w-4 h-4" />
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package2 className="mb-4 w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">Aucun colis trouvé</p>
                        <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.id} className="transition-colors duration-150 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.description}
                          </div>
                          <div className="mt-1 font-mono text-xs text-gray-400">#{pkg.trackingNumber}</div>
                          <div className="mt-1 font-mono text-xs text-gray-400">ID: {pkg.id.slice(0, 8)}...</div>
                          <div className="flex mt-1 space-x-1">
                            {pkg.fragile && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Fragile
                              </span>
                            )}
                            {pkg.urgent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.senderName && pkg.senderName !== 'Sender' 
                              ? pkg.senderName 
                              : (pkg.user?.name || 
                                 `${pkg.user?.firstName || ''} ${pkg.user?.lastName || ''}`.trim() || 
                                 pkg.user?.email?.split('@')[0] || 
                                 'Utilisateur')
                            }
                          </div>
                          <div className="text-sm text-gray-500">{pkg.senderPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {(() => {
                              // Si le recipientName existe et n'est pas "Recipient", l'utiliser
                              if (pkg.recipientName && pkg.recipientName !== 'Recipient') {
                                return pkg.recipientName;
                              }
                              
                              // Sinon, chercher le carrier dans les matches
                              const activeMatch = pkg.matches?.[0];
                              if (activeMatch?.ride?.user) {
                                const carrier = activeMatch.ride.user;
                                if (carrier.name) {
                                  return `${carrier.name} (CARRIER)`;
                                }
                                const fullName = `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim();
                                if (fullName) {
                                  return `${fullName} (CARRIER)`;
                                }
                                if (carrier.email) {
                                  return `${carrier.email.split('@')[0]} (CARRIER)`;
                                }
                              }
                              
                              return 'Aucun carrier assigné';
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">{pkg.recipientPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <span className="mr-1 text-xs font-medium text-green-600">De:</span>
                            <span className="max-w-xs text-sm text-gray-900 truncate">{pkg.senderAddress}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1 text-xs font-medium text-red-600">À:</span>
                            <span className="max-w-xs text-sm text-gray-900 truncate">{pkg.recipientAddress}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pkg.weight ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {pkg.weight}kg
                            </span>
                          ) : (
                            <span className="text-gray-400">Non renseigné</span>
                          )}
                        </div>
                        {pkg.dimensions && (
                          <div className="mt-1 text-xs text-gray-500">
                            {pkg.dimensions}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(pkg.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(pkg.createdAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(pkg.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {pkg.status === 'PENDING' && (
                            <button
                              onClick={() => updatePackageStatus(pkg.id, 'MATCHED')}
                              className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                            >
                              Associer
                            </button>
                          )}
                          {pkg.status === 'MATCHED' && (
                            <button
                              onClick={() => updatePackageStatus(pkg.id, 'IN_TRANSIT')}
                              className="inline-flex items-center px-3 py-1 text-xs text-purple-700 bg-purple-100 rounded-md transition-colors duration-150 hover:bg-purple-200"
                            >
                              En Transit
                            </button>
                          )}
                          {pkg.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => updatePackageStatus(pkg.id, 'DELIVERED')}
                              className="inline-flex items-center px-3 py-1 text-xs text-green-700 bg-green-100 rounded-md transition-colors duration-150 hover:bg-green-200"
                            >
                              Livrer
                            </button>
                          )}
                          {pkg.status !== 'CANCELLED' && pkg.status !== 'DELIVERED' && (
                            <button
                              onClick={() => updatePackageStatus(pkg.id, 'CANCELLED')}
                              className="inline-flex items-center px-3 py-1 text-xs text-red-700 bg-red-100 rounded-md transition-colors duration-150 hover:bg-red-200"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => deletePackage(pkg.id)}
                            className="inline-flex items-center px-3 py-1 text-xs text-red-700 bg-red-100 rounded-md transition-colors duration-150 hover:bg-red-200"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPackages.length > 0 && (
            <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{filteredPackages.length}</span>
                <span className="ml-1">colis trouvé{filteredPackages.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                  Précédent
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">Page 1</span>
                <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 w-full max-w-2xl bg-white rounded-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Créer un nouveau colis</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    ID Expéditeur
                  </label>
                  <input
                    type="text"
                    value={newPackage.userId}
                    onChange={(e) => setNewPackage({...newPackage, userId: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez l'ID de l'expéditeur"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description du colis"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Nom expéditeur
                  </label>
                  <input
                    type="text"
                    value={newPackage.senderName}
                    onChange={(e) => setNewPackage({...newPackage, senderName: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Téléphone expéditeur
                  </label>
                  <input
                    type="text"
                    value={newPackage.senderPhone}
                    onChange={(e) => setNewPackage({...newPackage, senderPhone: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Adresse expéditeur
                </label>
                <input
                  type="text"
                  value={newPackage.senderAddress}
                  onChange={(e) => setNewPackage({...newPackage, senderAddress: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Nom destinataire
                  </label>
                  <input
                    type="text"
                    value={newPackage.recipientName}
                    onChange={(e) => setNewPackage({...newPackage, recipientName: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Téléphone destinataire
                  </label>
                  <input
                    type="text"
                    value={newPackage.recipientPhone}
                    onChange={(e) => setNewPackage({...newPackage, recipientPhone: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Adresse destinataire
                </label>
                <input
                  type="text"
                  value={newPackage.recipientAddress}
                  onChange={(e) => setNewPackage({...newPackage, recipientAddress: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPackage.weight}
                    onChange={(e) => setNewPackage({...newPackage, weight: parseFloat(e.target.value)})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={newPackage.dimensions}
                    onChange={(e) => setNewPackage({...newPackage, dimensions: e.target.value})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: 20x30x10"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: parseFloat(e.target.value)})}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPackage.fragile}
                    onChange={(e) => setNewPackage({...newPackage, fragile: e.target.checked})}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Fragile</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPackage.urgent}
                    onChange={(e) => setNewPackage({...newPackage, urgent: e.target.checked})}
                    className="mr-2 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Urgent</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createPackage}
                disabled={!newPackage.userId || !newPackage.description || !newPackage.senderName || !newPackage.recipientName}
                className="px-4 py-2 text-white bg-blue-600 rounded-md transition-colors duration-150 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer le colis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 