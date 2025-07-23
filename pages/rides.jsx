import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import RideProposals from '../components/RideProposals';
import { 
  Plus,
  MapPin,
  Calendar,
  Clock,
  Truck,
  DollarSign,
  Eye,
  Edit3,
  Trash2,
  Route,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Navigation,
  RefreshCw,
  Filter,
  Search,
  Star,
  Phone,
  Mail,
  Sun,
  Moon,
  User,
  Menu,
  X,
  Bell
} from 'lucide-react';

export default function RidesManagement({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('active');
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Form state for creating new ride
  const [newRide, setNewRide] = useState({
    fromCity: '',
    toCity: '',
    departureDate: '',
    departureTime: '',
    availableSpaces: 3,
    pricePerKm: 0.8,
    description: '',
    vehicleType: 'car',
    maxWeight: 50,
    isRecurring: false,
    recurringDays: []
  });

  useEffect(() => {
    if (!loading && (!user || user.userType !== 'CARRIER')) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchRides();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterRides();
  }, [rides, searchTerm, activeTab]);

  const fetchRides = async () => {
    try {
      const response = await fetch('/api/rides');
      if (response.ok) {
        const data = await response.json();
        setRides(data.filter(ride => ride.carrierId === user?.id));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRides = () => {
    let filtered = rides.filter(ride => {
      const matchesSearch = `${ride.fromCity} ${ride.toCity}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (activeTab) {
        case 'active':
          return matchesSearch && ride.status === 'ACTIVE' && new Date(ride.departureDate) >= new Date();
        case 'completed':
          return matchesSearch && ride.status === 'COMPLETED';
        case 'cancelled':
          return matchesSearch && ride.status === 'CANCELLED';
        default:
          return matchesSearch;
      }
    });
    setFilteredRides(filtered);
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRide,
          userId: user.id,
          carrierId: user.id // Pour compatibilité
        })
      });

      if (response.ok) {
        fetchRides();
        setShowCreateForm(false);
        setNewRide({
          fromCity: '',
          toCity: '',
          departureDate: '',
          departureTime: '',
          availableSpaces: 3,
          pricePerKm: 0.8,
          description: '',
          vehicleType: 'car',
          maxWeight: 50,
          isRecurring: false,
          recurringDays: []
        });
        alert('Trajet créé avec succès!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création du trajet');
      }
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error);
      alert('Erreur lors de la création du trajet');
    }
  };

  const handleUpdateRideStatus = async (rideId, status) => {
    try {
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchRides();
        alert('Statut mis à jour avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
      try {
        const response = await fetch(`/api/rides/${rideId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchRides();
          alert('Trajet supprimé avec succès!');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'CANCELLED': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'truck': return '🚛';
      case 'van': return '🚐';
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      default: return '🚗';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des trajets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Gestion des Trajets - ecodeli</title>
        <meta name="description" content="Gérez vos trajets et propositions de transport" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main className="container px-6 py-8 mx-auto">
        {/* Page Header */}
        <div className="flex flex-col mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Trajets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Créez et gérez vos trajets de transport
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/rides/create" className="flex items-center px-6 py-3 mt-4 text-white bg-sky-500 rounded-lg transition-colors sm:mt-0 hover:bg-sky-600">
              <Plus className="mr-2 w-5 h-5" />
              Nouveau Trajet
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-6 py-3 mt-4 text-gray-600 bg-gray-100 rounded-lg transition-colors sm:mt-0 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <Plus className="mr-2 w-5 h-5" />
              Rapide
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button className="flex items-center px-4 py-2 rounded-lg border border-gray-300 transition-colors dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="mr-2 w-5 h-5" />
            Filtres
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { key: 'active', label: 'Actifs', count: rides.filter(r => r.status === 'ACTIVE').length },
              { key: 'completed', label: 'Terminés', count: rides.filter(r => r.status === 'COMPLETED').length },
              { key: 'cancelled', label: 'Annulés', count: rides.filter(r => r.status === 'CANCELLED').length },
              { key: 'proposals', label: 'Propositions', count: 0, icon: Bell }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon && <tab.icon className="mr-2 w-4 h-4" />}
                {tab.label} {tab.key !== 'proposals' && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'proposals' ? (
          <RideProposals 
            userId={user?.id} 
            onProposalUpdate={(proposalId, status) => {
              // Refresh rides when proposal is updated
              fetchRides();
            }}
          />
        ) : (
          /* Rides List */
          <div className="space-y-4">
            {filteredRides.length === 0 ? (
              <div className="py-12 text-center">
                <Route className="mx-auto mb-4 w-16 h-16 text-gray-400 dark:text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Aucun trajet trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'active' ? 'Créez votre premier trajet pour commencer' : 'Aucun trajet dans cette catégorie'}
                </p>
              </div>
            ) : (
              filteredRides.map((ride) => (
              <div key={ride.id} className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    {/* Route Info */}
                    <div className="flex items-center mb-4 space-x-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{ride.fromCity}</span>
                      </div>
                      <Route className="w-5 h-5 text-gray-400" />
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{ride.toCity}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(ride.departureDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ride.departureTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getVehicleIcon(ride.vehicleType)}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ride.vehicleType}
                        </span>
                      </div>
                    </div>

                    {/* Capacity and Price */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {ride.availableSpaces} places disponibles
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Max {ride.maxWeight}kg
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          €{ride.pricePerKm}/km
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ride.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                      {ride.matches && ride.matches.length > 0 && (
                        <span className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                          <Users className="w-4 h-4" />
                          <span>{ride.matches.length} correspondance(s)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center mt-4 space-x-2 lg:mt-0 lg:ml-6">
                    <Link
                      href={`/rides/view/${ride.id}`}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Eye className="mr-1 w-4 h-4" />
                      Voir
                    </Link>
                    {ride.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => router.push(`/rides/edit/${ride.id}`)}
                          className="flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg transition-colors dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          <Edit3 className="mr-1 w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleUpdateRideStatus(ride.id, 'CANCELLED')}
                          className="flex items-center px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg transition-colors dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          <XCircle className="mr-1 w-4 h-4" />
                          Annuler
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteRide(ride.id)}
                      className="flex items-center px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg transition-colors dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <Trash2 className="mr-1 w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </main>

      {/* Create Ride Modal */}
      {showCreateForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Créer un nouveau trajet
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRide} className="space-y-6">
              {/* Route */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ville de départ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newRide.fromCity}
                      onChange={(e) => setNewRide({...newRide, fromCity: e.target.value})}
                      className="p-3 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ville d'arrivée
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newRide.toCity}
                      onChange={(e) => setNewRide({...newRide, toCity: e.target.value})}
                      className="p-3 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Lyon"
                    />
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de départ
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={newRide.departureDate}
                      onChange={(e) => setNewRide({...newRide, departureDate: e.target.value})}
                      className="p-3 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Heure de départ
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="time"
                      required
                      value={newRide.departureTime}
                      onChange={(e) => setNewRide({...newRide, departureTime: e.target.value})}
                      className="p-3 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle and Capacity */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type de véhicule
                  </label>
                  <select
                    value={newRide.vehicleType}
                    onChange={(e) => setNewRide({...newRide, vehicleType: e.target.value})}
                    className="p-3 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="car">Voiture</option>
                    <option value="van">Fourgonnette</option>
                    <option value="truck">Camion</option>
                    <option value="motorcycle">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Places disponibles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRide.availableSpaces}
                    onChange={(e) => setNewRide({...newRide, availableSpaces: parseInt(e.target.value)})}
                    className="p-3 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Poids max (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRide.maxWeight}
                    onChange={(e) => setNewRide({...newRide, maxWeight: parseInt(e.target.value)})}
                    className="p-3 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prix par kilomètre (€)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newRide.pricePerKm}
                    onChange={(e) => setNewRide({...newRide, pricePerKm: parseFloat(e.target.value)})}
                    className="p-3 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (optionnel)
                </label>
                <textarea
                  value={newRide.description}
                  onChange={(e) => setNewRide({...newRide, description: e.target.value})}
                  rows={3}
                  className="p-3 w-full text-gray-900 bg-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Informations supplémentaires sur le trajet..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 text-white bg-sky-500 rounded-lg transition-colors hover:bg-sky-600"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Créer le trajet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 