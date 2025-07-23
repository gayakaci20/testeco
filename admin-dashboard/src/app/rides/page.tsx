'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Car, MapPin, Clock, Users, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Search, Filter, Truck, Bike, Bus } from 'lucide-react';

interface Ride {
  id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  estimatedArrivalTime: string | null;
  vehicleType: string | null;
  availableSeats: number | null;
  maxPackageWeight: number | null;
  maxPackageSize: string | null;
  pricePerKg: number | null;
  pricePerSeat: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    vehicleType: string | null; // Ajouter le type de véhicule de l'utilisateur
  };
  matches: Array<{
    id: string;
    status: string;
    package: {
      id: string;
      title: string;
    };
  }>;
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newRide, setNewRide] = useState({
    userId: '',
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    availableSpace: 'MEDIUM',
    pricePerKg: 2.5,
    vehicleType: '',
    maxWeight: 50,
    description: '',
  });

  useEffect(() => {
    fetchRides();
  }, [statusFilter]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/rides?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch rides');
      
      const data = await response.json();
      setRides(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (rideId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/rides', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rideId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchRides(); // Refresh the list
        alert(`Ride status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error updating ride');
      }
    } catch (error) {
      console.error('Error updating ride:', error);
      alert('Error updating ride');
    }
  };

  const createRide = async () => {
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRide),
      });

      if (response.ok) {
        fetchRides(); // Refresh the list
        setShowCreateModal(false);
        setNewRide({
          userId: '',
          origin: '',
          destination: '',
          departureTime: '',
          arrivalTime: '',
          availableSpace: 'MEDIUM',
          pricePerKg: 2.5,
          vehicleType: '',
          maxWeight: 50,
          description: '',
        });
        alert('Trajet créé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error creating ride');
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      alert('Error creating ride');
    }
  };

  const deleteRide = async (rideId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rides?id=${rideId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRides(); // Refresh the list
        alert('Trajet supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error deleting ride');
      }
    } catch (error) {
      console.error('Error deleting ride:', error);
      alert('Error deleting ride');
    }
  };

  const syncRidesFromMain = async () => {
    try {
      setSyncing(true);
      
      // Fetch rides from main application
      const mainResponse = await fetch('/api/rides', {
        method: 'GET',
      });

      if (!mainResponse.ok) {
        throw new Error('Failed to fetch rides from main application');
      }

      const mainRides = await mainResponse.json();
      
      // Sync rides to admin dashboard
      const syncResponse = await fetch('/api/sync-rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rides: mainRides }),
      });

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        fetchRides(); // Refresh the list
        alert(`Synchronisation terminée: ${syncResult.syncedCount} trajets synchronisés`);
      } else {
        const errorData = await syncResponse.json();
        alert(errorData.error || 'Error syncing rides');
      }
    } catch (error) {
      console.error('Error syncing rides:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disponible' },
      FULL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Complet' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminé' },
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

  // Fonction pour obtenir les classes de couleur pour chaque rôle
  const getRoleColorClasses = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'CARRIER':
        return 'bg-green-100 text-green-800';
      case 'MERCHANT':
        return 'bg-purple-100 text-purple-800';
      case 'PROVIDER':
        return 'bg-orange-100 text-orange-800';
      case 'SERVICE_PROVIDER':
        return 'bg-cyan-100 text-cyan-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour formater les rôles en français
  const formatRole = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'Client';
      case 'CARRIER':
        return 'Transporteur';
      case 'MERCHANT':
        return 'Marchand';
      case 'PROVIDER':
        return 'Prestataire';
      case 'SERVICE_PROVIDER':
        return 'Service Provider';
      case 'ADMIN':
        return 'Admin';
      default:
        return role;
    }
  };

  // Fonction pour obtenir l'icône du type de véhicule
  const getVehicleIcon = (vehicleType: string | null) => {
    if (!vehicleType) return <Car className="w-4 h-4 text-gray-400" />;
    
    switch (vehicleType.toLowerCase()) {
      case 'car':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-green-500" />;
      case 'van':
        return <Car className="w-4 h-4 text-purple-500" />;
      case 'motorcycle':
        return <Bike className="w-4 h-4 text-orange-500" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-red-500" />;
      default:
        return <Car className="w-4 h-4 text-gray-500" />;
    }
  };

  // Fonction pour formater le nom du type de véhicule
  const formatVehicleType = (vehicleType: string | null) => {
    if (!vehicleType) return 'Non spécifié';
    
    const vehicleNames = {
      car: 'Voiture',
      truck: 'Camion',
      van: 'Fourgonnette',
      motorcycle: 'Moto',
      bus: 'Bus'
    };
    
    return vehicleNames[vehicleType.toLowerCase() as keyof typeof vehicleNames] || vehicleType;
  };

  const filteredRides = rides.filter(ride => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      ride.id.toLowerCase().includes(searchLower) ||
      ride.startLocation.toLowerCase().includes(searchLower) ||
      ride.endLocation.toLowerCase().includes(searchLower) ||
      getUserName(ride.user).toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const availableRides = rides.filter(r => r.status === 'AVAILABLE').length;
  const completedRides = rides.filter(r => r.status === 'COMPLETED').length;
  const totalCapacity = rides.reduce((sum, r) => sum + (r.availableSeats || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Car className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Trajets</h1>
              <p className="mt-1 text-gray-600">Suivez et gérez tous les trajets des transporteurs</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              <Car className="mr-2 w-5 h-5" />
              Créer un trajet
            </button>
            <button
              onClick={syncRidesFromMain}
              disabled={syncing}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-purple-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchroniser'}
            </button>
            <button
              onClick={fetchRides}
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
              <p className="text-sm font-medium text-gray-600">Total Trajets</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{rides.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
            <span className="font-medium text-green-600">+8%</span>
            <span className="ml-1 text-gray-500">ce mois</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{availableRides}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Prêts pour réservation</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{completedRides}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">92%</span>
            <span className="ml-1 text-gray-500">taux de réussite</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacité Totale</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">{totalCapacity}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Places disponibles</span>
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
              placeholder="Rechercher par lieu ou transporteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="FULL">Complet</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="p-12 bg-white rounded-xl border shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-4 border-green-600 animate-spin border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Chargement des trajets...</p>
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
      
      {/* Rides Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des Trajets ({filteredRides.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Car className="inline mr-1 w-4 h-4" />
                    Trajet
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Users className="inline mr-1 w-4 h-4" />
                    Transporteur
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <MapPin className="inline mr-1 w-4 h-4" />
                    Itinéraire
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Clock className="inline mr-1 w-4 h-4" />
                    Départ
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Capacité
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRides.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Car className="mb-4 w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">Aucun trajet trouvé</p>
                        <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRides.map((ride) => (
                    <tr key={ride.id} className="transition-colors duration-150 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {ride.vehicleType || 'Véhicule non spécifié'}
                          </div>
                          <div className="mt-1 font-mono text-xs text-gray-400">ID: {ride.id.slice(0, 8)}...</div>
                          {ride.notes && (
                            <div className="mt-1 max-w-xs text-xs text-gray-500 truncate">{ride.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(ride.user)}
                          </div>
                          <div className="text-sm text-gray-500">{ride.user.email}</div>
                          <div className="flex items-center mt-1 space-x-2">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClasses(ride.user.role)}`}>
                              {formatRole(ride.user.role)}
                            </div>
                            <div className="flex items-center space-x-1">
                              {getVehicleIcon(ride.user.vehicleType)}
                              <span className="text-xs text-gray-600">
                                {formatVehicleType(ride.user.vehicleType)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <span className="mr-1 text-xs font-medium text-green-600">De:</span>
                            <span className="max-w-xs text-sm text-gray-900 truncate">{ride.startLocation}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1 text-xs font-medium text-red-600">À:</span>
                            <span className="max-w-xs text-sm text-gray-900 truncate">{ride.endLocation}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(ride.departureTime), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(ride.departureTime), 'HH:mm')}
                        </div>
                        {ride.estimatedArrivalTime && (
                          <div className="text-xs text-blue-600">
                            Arrivée: {format(new Date(ride.estimatedArrivalTime), 'HH:mm')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ride.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ride.availableSeats ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {ride.availableSeats} places
                            </span>
                          ) : (
                            <span className="text-gray-400">Non spécifié</span>
                          )}
                        </div>
                        {ride.maxPackageWeight && (
                          <div className="mt-1 text-xs text-gray-500">
                            Max: {ride.maxPackageWeight}kg
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ride.pricePerKg && (
                            <div className="text-xs">
                              <span className="font-medium">{ride.pricePerKg}€/kg</span>
                            </div>
                          )}
                          {ride.pricePerSeat && (
                            <div className="text-xs">
                              <span className="font-medium">{ride.pricePerSeat}€/place</span>
                            </div>
                          )}
                          {!ride.pricePerKg && !ride.pricePerSeat && (
                            <span className="text-xs text-gray-400">Non spécifié</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {ride.status === 'AVAILABLE' && (
                            <button
                              onClick={() => updateRideStatus(ride.id, 'FULL')}
                              className="inline-flex items-center px-3 py-1 text-xs text-yellow-700 bg-yellow-100 rounded-md transition-colors duration-150 hover:bg-yellow-200"
                            >
                              Marquer Complet
                            </button>
                          )}
                          {(ride.status === 'AVAILABLE' || ride.status === 'FULL') && (
                            <button
                              onClick={() => updateRideStatus(ride.id, 'COMPLETED')}
                              className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                            >
                              Terminer
                            </button>
                          )}
                          {ride.status !== 'CANCELLED' && ride.status !== 'COMPLETED' && (
                            <button
                              onClick={() => updateRideStatus(ride.id, 'CANCELLED')}
                              className="inline-flex items-center px-3 py-1 text-xs text-red-700 bg-red-100 rounded-md transition-colors duration-150 hover:bg-red-200"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => deleteRide(ride.id)}
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
          {filteredRides.length > 0 && (
            <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{filteredRides.length}</span>
                <span className="ml-1">trajet{filteredRides.length > 1 ? 's' : ''} trouvé{filteredRides.length > 1 ? 's' : ''}</span>
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

      {/* Create Ride Modal */}
      {showCreateModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 w-full max-w-md bg-white rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Créer un nouveau trajet</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  ID Transporteur
                </label>
                <input
                  type="text"
                  value={newRide.userId}
                  onChange={(e) => setNewRide({...newRide, userId: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Entrez l'ID du transporteur"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Lieu de départ
                </label>
                <input
                  type="text"
                  value={newRide.origin}
                  onChange={(e) => setNewRide({...newRide, origin: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ville de départ"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Destination
                </label>
                <input
                  type="text"
                  value={newRide.destination}
                  onChange={(e) => setNewRide({...newRide, destination: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ville de destination"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Heure de départ
                </label>
                <input
                  type="datetime-local"
                  value={newRide.departureTime}
                  onChange={(e) => setNewRide({...newRide, departureTime: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Heure d'arrivée (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={newRide.arrivalTime}
                  onChange={(e) => setNewRide({...newRide, arrivalTime: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Espace disponible
                </label>
                <select
                  value={newRide.availableSpace}
                  onChange={(e) => setNewRide({...newRide, availableSpace: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="SMALL">Petit</option>
                  <option value="MEDIUM">Moyen</option>
                  <option value="LARGE">Grand</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Prix par kg (€)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newRide.pricePerKg}
                  onChange={(e) => setNewRide({...newRide, pricePerKg: parseFloat(e.target.value)})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Type de véhicule
                </label>
                <input
                  type="text"
                  value={newRide.vehicleType}
                  onChange={(e) => setNewRide({...newRide, vehicleType: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Voiture, camionnette, etc."
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Poids maximum (kg)
                </label>
                <input
                  type="number"
                  value={newRide.maxWeight}
                  onChange={(e) => setNewRide({...newRide, maxWeight: parseFloat(e.target.value)})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newRide.description}
                  onChange={(e) => setNewRide({...newRide, description: e.target.value})}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description du trajet"
                />
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
                onClick={createRide}
                disabled={!newRide.userId || !newRide.origin || !newRide.destination || !newRide.departureTime}
                className="px-4 py-2 text-white bg-green-600 rounded-md transition-colors duration-150 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer le trajet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 