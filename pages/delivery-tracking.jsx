import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  getStatusConfig, 
  getStatusColor, 
  getStatusIcon, 
  getStatusText, 
  statusFilterOptions, 
  isActiveStatus, 
  isCompletedStatus,
  calculatePackageStats,
  getTimelineSteps 
} from '../lib/status-utils';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Search,
  RefreshCw,
  ExternalLink,
  Home,
  User,
  Star,
  MessageCircle,
  Navigation,
  AlertCircle,
  X,
  ChevronRight,
  Eye,
  Route,
  Filter,
  Grid,
  List,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';

export default function DeliveryTracking({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingDetails, setTrackingDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [realtimeUpdate, setRealtimeUpdate] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPackageForRating, setSelectedPackageForRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const statusOptions = statusFilterOptions;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user && user.role === 'CUSTOMER') {
      fetchPackages();
    }
  }, [user, loading]);

  // Ouvrir automatiquement un colis spécifique si packageId est dans l'URL
  useEffect(() => {
    if (router.query.packageId && packages.length > 0) {
      const targetPackage = packages.find(pkg => pkg.id === router.query.packageId);
      if (targetPackage) {
        openTrackingModal(targetPackage);
        // Nettoyer l'URL après ouverture
        router.replace('/delivery-tracking', undefined, { shallow: true });
      }
    }
  }, [router.query.packageId, packages]);

  // Écouter les mises à jour de statut en temps réel
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'deliveryUpdate') {
        const update = JSON.parse(e.newValue);
        if (update && update.updatedBy === 'carrier') {
          console.log('📦 Mise à jour de livraison reçue:', update);
          // Rafraîchir les données si le colis correspond à un de nos packages
          const hasPackage = packages.some(pkg => pkg.id === update.packageId);
          if (hasPackage) {
            setRealtimeUpdate(update);
            fetchPackages();
            // Masquer l'indicateur après 5 secondes
            setTimeout(() => setRealtimeUpdate(null), 5000);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [packages]);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/packages', {
        headers: {
          'x-user-id': user.id
        }
      });

      if (response.ok) {
        const packagesData = await response.json();
        
        // Get matches for each package
        const packagesWithMatches = await Promise.all(
          packagesData.map(async (pkg) => {
            try {
              const matchesResponse = await fetch(`/api/packages/${pkg.id}/matches`, {
                headers: {
                  'x-user-id': user.id
                }
              });
              
              if (matchesResponse.ok) {
                const matches = await matchesResponse.json();
                return { ...pkg, matches: matches || [] };
              }
              return { ...pkg, matches: [] };
            } catch (error) {
              console.error(`Error fetching matches for package ${pkg.id}:`, error);
              return { ...pkg, matches: [] };
            }
          })
        );

        setPackages(packagesWithMatches);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTracking = async () => {
    setRefreshing(true);
    await fetchPackages();
    setRefreshing(false);
  };

  const getTrackingDetails = async (packageId) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/tracking`);
      if (response.ok) {
        const tracking = await response.json();
        setTrackingDetails(tracking);
      }
    } catch (error) {
      console.error('Error fetching tracking details:', error);
    }
  };

  const openTrackingModal = (pkg) => {
    setSelectedPackage(pkg);
    setShowTrackingModal(true);
    getTrackingDetails(pkg.id);
  };

  const openRatingModal = (pkg) => {
    setSelectedPackageForRating(pkg);
    setShowRatingModal(true);
    setRating(0);
    setReview('');
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedPackageForRating(null);
    setRating(0);
    setReview('');
  };

  const submitRating = async () => {
    if (!selectedPackageForRating || rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`/api/packages/${selectedPackageForRating.id}/rate-carrier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          rating: rating,
          review: review
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Évaluation soumise avec succès !');
        closeRatingModal();
        fetchPackages(); // Refresh packages to update the UI
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur lors de la soumission de l\'évaluation');
    } finally {
      setSubmittingRating(false);
    }
  };

  const checkIfCarrierCanBeRated = (pkg) => {
    const activeMatch = getActiveMatch(pkg);
    return pkg.status === 'DELIVERED' && activeMatch && activeMatch.status === 'COMPLETED';
  };

  const hasCarrierBeenRated = (pkg) => {
    const activeMatch = getActiveMatch(pkg);
    return activeMatch && activeMatch.carrierReview;
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getActiveMatch = (pkg) => {
    return pkg.matches?.find(match => 
      isActiveStatus(match.status) || match.status === 'IN_PROGRESS'
    );
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  // Statistics calculation
  const stats = calculatePackageStats(packages);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Suivi des livraisons - ecodeli</title>
        <meta name="description" content="Suivez vos colis en temps réel" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Suivi des livraisons
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Suivez l'état de vos colis en temps réel
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshTracking}
                disabled={refreshing}
                className="flex items-center px-6 py-2 font-medium text-white bg-sky-500 rounded-full transition hover:bg-sky-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Indicateur de mise à jour en temps réel */}
        {realtimeUpdate && (
          <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center">
              <div className="mr-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Mise à jour en temps réel
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Le statut de votre colis a été mis à jour vers : <strong>{getStatusText(realtimeUpdate.status)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total colis</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPackages}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En transit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-yellow-100 rounded-full dark:bg-yellow-900">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par description ou numéro de suivi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 text-gray-900 rounded-lg border border-gray-200 transition-colors dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="mr-2 w-5 h-5 text-gray-900 dark:text-white" />
              Filtres
            </button>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-3 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-3 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="grid gap-6 md:grid-cols-1">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Statut</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => setStatusFilter(status.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        statusFilter === status.id
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <status.icon className="w-4 h-4" />
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des colis...</p>
              </div>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <Package className="mx-auto mb-4 w-16 h-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun colis trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun colis ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore de colis à suivre.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredPackages.map((pkg) => {
                const activeMatch = getActiveMatch(pkg);
                const carrier = activeMatch?.ride?.user;
                
                return (
                  <div 
                    key={pkg.id} 
                    className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md ${
                      viewMode === 'list' ? 'flex gap-6 p-6' : 'p-6'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Package className="w-8 h-8 text-sky-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pkg.description}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              N° de suivi: {pkg.trackingNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.status)}`}>
                            {getStatusIcon(pkg.status)}
                            <span className="ml-2">{getStatusText(pkg.status)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Package Details */}
                      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="mr-2 w-4 h-4" />
                          <span>De: {pkg.senderAddress}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="mr-2 w-4 h-4" />
                          <span>À: {pkg.recipientAddress}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="mr-2 w-4 h-4" />
                          <span>Créé le: {formatDate(pkg.createdAt)}</span>
                        </div>
                        {pkg.price && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="mr-2">💰</span>
                            <span>Prix: {pkg.price}€</span>
                          </div>
                        )}
                      </div>

                      {/* Carrier Info */}
                      {carrier && (
                        <div className="p-4 mb-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                          <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">
                            Transporteur assigné
                          </h4>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="flex justify-center items-center w-8 h-8 bg-blue-500 rounded-full">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {carrier.firstName} {carrier.lastName}
                                </p>
                                {carrier.phoneNumber && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {carrier.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {carrier.phoneNumber && (
                                <a
                                  href={`tel:${carrier.phoneNumber}`}
                                  className="p-2 text-blue-600 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => router.push(`/messages?carrierId=${carrier.id}&carrierName=${encodeURIComponent(carrier.firstName + ' ' + carrier.lastName)}&packageId=${pkg.id}`)}
                                className="p-2 text-blue-600 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openTrackingModal(pkg)}
                            className="flex items-center px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                          >
                            <Eye className="mr-2 w-4 h-4" />
                            Voir le suivi détaillé
                          </button>
                          
                          {pkg.status === 'DELIVERED' && checkIfCarrierCanBeRated(pkg) && !hasCarrierBeenRated(pkg) && (
                            <button 
                              onClick={() => openRatingModal(pkg)}
                              className="flex items-center px-4 py-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600"
                            >
                              <Star className="mr-2 w-4 h-4" />
                              Évaluer
                            </button>
                          )}
                          {pkg.status === 'DELIVERED' && hasCarrierBeenRated(pkg) && (
                            <button 
                              disabled
                              className="flex items-center px-4 py-2 text-sm text-gray-500 bg-gray-200 rounded-lg cursor-not-allowed"
                            >
                              <Star className="mr-2 w-4 h-4" />
                              Évalué
                            </button>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Mis à jour: {formatDate(pkg.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && selectedPackage && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Suivi détaillé - {selectedPackage.description}
                </h3>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <TrackingTimeline package={selectedPackage} />
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedPackageForRating && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Évaluer le livreur
                </h3>
                <button
                  onClick={closeRatingModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Package info */}
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Colis : {selectedPackageForRating.description}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Livré le : {formatDate(selectedPackageForRating.updatedAt)}
                  </p>
                </div>

                {/* Carrier info */}
                {getActiveMatch(selectedPackageForRating)?.ride?.user && (
                  <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Livreur
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {getActiveMatch(selectedPackageForRating).ride.user.firstName} {getActiveMatch(selectedPackageForRating).ride.user.lastName}
                    </p>
                  </div>
                )}

                {/* Rating stars */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Note (1-5 étoiles)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 rounded-full transition-colors ${
                          star <= rating 
                            ? 'text-yellow-400 hover:text-yellow-500' 
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="w-full h-full" fill={star <= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Dites-nous ce que vous avez pensé de ce livreur..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeRatingModal}
                    disabled={submittingRating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={rating === 0 || submittingRating}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRating ? 'Envoi...' : 'Soumettre l\'évaluation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tracking Timeline Component
function TrackingTimeline({ package: pkg }) {
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCheckpoints();
  }, [pkg.id]);

  const fetchCheckpoints = async () => {
    try {
      const response = await fetch(`/api/packages/${pkg.id}/checkpoints`);
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

  const getTimelineStepsWithCheckpoints = () => {
    const baseSteps = getTimelineSteps(pkg);

    // Add checkpoints to timeline
    const checkpointSteps = checkpoints.map(checkpoint => ({
      status: 'CHECKPOINT',
      label: checkpoint.location,
      icon: MapPin,
      timestamp: checkpoint.timestamp,
      completed: true,
      notes: checkpoint.notes
    }));

    return baseSteps.concat(checkpointSteps).sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  };

  const steps = getTimelineStepsWithCheckpoints();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 rounded-full border-b-2 border-sky-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Info */}
      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Expéditeur:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {pkg.senderName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pkg.senderAddress}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Destinataire:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {pkg.recipientName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pkg.recipientAddress}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Historique de suivi
        </h4>
        <div className="flow-root">
          <ul className="-mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== steps.length - 1 && (
                      <span className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                        step.completed ? 'bg-sky-500' : 'bg-gray-300'
                      }`} />
                    )}
                    <div className="flex relative space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                          step.completed 
                            ? 'bg-sky-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className={`text-sm font-medium ${
                            step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                          {step.notes && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {step.notes}
                            </p>
                          )}
                        </div>
                        {step.timestamp && (
                          <div className="text-sm text-right text-gray-500 whitespace-nowrap dark:text-gray-400">
                            {new Date(step.timestamp).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
} 