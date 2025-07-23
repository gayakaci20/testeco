'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Filter, Calendar, User, MapPin, CreditCard, Clock, RefreshCw, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BoxRental {
  id: string;
  boxId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  totalCost: number | null;
  accessCode: string | null;
  isActive: boolean;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  box: {
    id: string;
    code: string;
    location: string;
    size: string;
    pricePerDay: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export default function BoxRentalsPage() {
  const [rentals, setRentals] = useState<BoxRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRental, setSelectedRental] = useState<BoxRental | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/box-rentals');
      if (response.ok) {
        const data = await response.json();
        setRentals(data);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalDetails = async (rentalId: string) => {
    try {
      const response = await fetch(`/api/box-rentals/${rentalId}`);
      if (response.ok) {
        const rentalDetails = await response.json();
        setSelectedRental(rentalDetails);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching rental details:', error);
    }
  };

  const updateRentalStatus = async (rentalId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/box-rentals/${rentalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setRentals(rentals.map(rental => 
          rental.id === rentalId 
            ? { ...rental, isActive, endDate: isActive ? rental.endDate : new Date().toISOString() }
            : rental
        ));
        if (selectedRental && selectedRental.id === rentalId) {
          setSelectedRental({ 
            ...selectedRental, 
            isActive, 
            endDate: isActive ? selectedRental.endDate : new Date().toISOString() 
          });
        }
      }
    } catch (error) {
      console.error('Error updating rental status:', error);
    }
  };

  const renewRental = async (rentalId: string, days: number) => {
    try {
      const response = await fetch(`/api/box-rentals/${rentalId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });

      if (response.ok) {
        const updatedRental = await response.json();
        setRentals(rentals.map(rental => 
          rental.id === rentalId ? updatedRental : rental
        ));
        if (selectedRental && selectedRental.id === rentalId) {
          setSelectedRental(updatedRental);
        }
      }
    } catch (error) {
      console.error('Error renewing rental:', error);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRental(null);
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rental.isActive) ||
      (statusFilter === 'expired' && !rental.isActive);
    
    const matchesPayment = paymentFilter === 'all' || rental.paymentStatus === paymentFilter;
    
    const matchesSearch = 
      rental.box.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.box.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const getStatusColor = (isActive: boolean, endDate: string | null) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (endDate && new Date(endDate) < new Date()) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.PENDING;
  };

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      SMALL: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      LARGE: 'bg-purple-100 text-purple-800',
      EXTRA_LARGE: 'bg-red-100 text-red-800',
    };
    return colors[size] || colors.MEDIUM;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRentalDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRentalStatus = (isActive: boolean, endDate: string | null) => {
    if (!isActive) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (endDate && new Date(endDate) < new Date()) return { status: 'Overdue', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
  };

  // Calculate stats
  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(r => r.isActive).length;
  const expiredRentals = rentals.filter(r => !r.isActive).length;
  const overdueRentals = rentals.filter(r => r.isActive && r.endDate && new Date(r.endDate) < new Date()).length;
  const totalRevenue = rentals
    .filter(r => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const averageRentalCost = totalRentals > 0 ? totalRevenue / totalRentals : 0;

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-pink-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Package className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Locations de Boîtes</h1>
              <p className="mt-1 text-gray-600">Gestion des locations de boîtes de stockage</p>
            </div>
          </div>
          <button
            onClick={fetchRentals}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 font-medium text-white bg-pink-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-pink-700 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalRentals}</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg">
              <Package className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-pink-600">{activeRentals}</span>
            <span className="ml-1 text-gray-500">actives</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">€{averageRentalCost.toFixed(2)}</span>
            <span className="ml-1 text-gray-500">coût moyen</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Locations Actives</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{activeRentals}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">{((activeRentals / totalRentals) * 100 || 0).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500">du total</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Locations Expirées</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{expiredRentals}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-orange-600">{overdueRentals}</span>
            <span className="ml-1 text-gray-500">en retard</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par code de boîte, lieu, ou nom d'utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="expired">Expirées</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Tous les paiements</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payé</option>
              <option value="FAILED">Échoué</option>
              <option value="REFUNDED">Remboursé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Locations ({filteredRentals.length})
          </h2>
        </div>
        
        {filteredRentals.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-500">Aucune location trouvée</p>
            <p className="text-sm text-gray-400">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Boîte</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Locataire</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Période</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Coût</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRentals.map((rental) => {
                  const rentalStatus = getRentalStatus(rental.isActive, rental.endDate);
                  return (
                    <tr key={rental.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rental.box.code}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="mr-1 w-3 h-3" />
                            {rental.box.location}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(rental.box.size)}`}>
                            {rental.box.size}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.user.firstName} {rental.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{rental.user.email}</div>
                          {rental.user.phoneNumber && (
                            <div className="text-sm text-gray-500">{rental.user.phoneNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Début: {formatDate(rental.startDate)}</div>
                          {rental.endDate && (
                            <div>Fin: {formatDate(rental.endDate)}</div>
                          )}
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 w-3 h-3" />
                            {calculateRentalDuration(rental.startDate, rental.endDate)} jours
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{rental.totalCost?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                          €{rental.box.pricePerDay}/jour
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${rentalStatus.color}`}>
                          {rentalStatus.status === 'Active' ? 'Active' : 
                           rentalStatus.status === 'Expired' ? 'Expirée' : 'En retard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(rental.paymentStatus)}`}>
                          {rental.paymentStatus === 'PENDING' ? 'En attente' :
                           rental.paymentStatus === 'PAID' ? 'Payé' :
                           rental.paymentStatus === 'FAILED' ? 'Échoué' : 'Remboursé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchRentalDetails(rental.id)}
                            className="text-pink-600 hover:text-pink-900 transition-colors duration-150"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rental.isActive && (
                            <button
                              onClick={() => updateRentalStatus(rental.id, false)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-150"
                              title="Terminer la location"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {!rental.isActive && (
                            <button
                              onClick={() => updateRentalStatus(rental.id, true)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-150"
                              title="Réactiver la location"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Détails de la Location</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Rental Info */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Informations de la Boîte</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Code:</span>
                      <span className="text-sm font-medium">{selectedRental.box.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lieu:</span>
                      <span className="text-sm font-medium">{selectedRental.box.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taille:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSizeColor(selectedRental.box.size)}`}>
                        {selectedRental.box.size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Prix/jour:</span>
                      <span className="text-sm font-medium">€{selectedRental.box.pricePerDay}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Informations du Locataire</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nom:</span>
                      <span className="text-sm font-medium">
                        {selectedRental.user.firstName} {selectedRental.user.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedRental.user.email}</span>
                    </div>
                    {selectedRental.user.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Téléphone:</span>
                        <span className="text-sm font-medium">{selectedRental.user.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rental Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Détails de la Location</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date de début:</span>
                      <span className="text-sm font-medium">{formatDate(selectedRental.startDate)}</span>
                    </div>
                    {selectedRental.endDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date de fin:</span>
                        <span className="text-sm font-medium">{formatDate(selectedRental.endDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Durée:</span>
                      <span className="text-sm font-medium">
                        {calculateRentalDuration(selectedRental.startDate, selectedRental.endDate)} jours
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coût total:</span>
                      <span className="text-sm font-medium">€{selectedRental.totalCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Statut:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRentalStatus(selectedRental.isActive, selectedRental.endDate).color}`}>
                        {getRentalStatus(selectedRental.isActive, selectedRental.endDate).status === 'Active' ? 'Active' : 
                         getRentalStatus(selectedRental.isActive, selectedRental.endDate).status === 'Expired' ? 'Expirée' : 'En retard'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paiement:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPaymentStatusColor(selectedRental.paymentStatus)}`}>
                        {selectedRental.paymentStatus === 'PENDING' ? 'En attente' :
                         selectedRental.paymentStatus === 'PAID' ? 'Payé' :
                         selectedRental.paymentStatus === 'FAILED' ? 'Échoué' : 'Remboursé'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRental.accessCode && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Code d'Accès</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-lg font-mono font-medium">{selectedRental.accessCode}</span>
                  </div>
                </div>
              )}

              {selectedRental.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedRental.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                {selectedRental.isActive ? (
                  <button
                    onClick={() => {
                      updateRentalStatus(selectedRental.id, false);
                      closeDetailsModal();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Terminer la Location
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateRentalStatus(selectedRental.id, true);
                      closeDetailsModal();
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Réactiver la Location
                  </button>
                )}
                <button
                  onClick={() => renewRental(selectedRental.id, 30)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Prolonger (30 jours)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 