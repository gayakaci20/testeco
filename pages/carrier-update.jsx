import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Package,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Eye,
  Navigation,
  RefreshCw,
  DollarSign,
  Activity,
  Calendar,
  AlertCircle,
  Info,
  Route,
  User,
  Star
} from 'lucide-react';
import { getStatusConfig, isActiveStatus, isCompletedStatus } from '../lib/status-utils';

export default function CarrierUpdate({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [earnings, setEarnings] = useState({ today: 0, month: 0, total: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Vérifier si l'utilisateur est un transporteur
        if (userData.role !== 'CARRIER') {
          router.push('/dashboard');
          return;
        }
        
        await fetchDeliveryData();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryData = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dashboard/carrier?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Carrier dashboard data received:', data);
        
        setDeliveries(data.deliveries || []);
        setDashboardStats(data.stats || {});
        setEarnings(data.earnings || { today: 0, month: 0, total: 0 });
      } else {
        console.error('❌ Failed to fetch delivery data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching delivery data:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchDeliveryData();
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPackageId = (delivery) => {
    return delivery.packageId || delivery.id;
  };

  const updateDeliveryStatus = async (delivery, status) => {
    try {
      const packageId = getPackageId(delivery);
      const response = await fetch(`/api/packages/${packageId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Rafraîchir les données
        await fetchDeliveryData();
      } else {
        console.error('Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const handleViewDelivery = (delivery) => {
    const packageId = getPackageId(delivery);
    window.open(`/delivery-tracking?packageId=${packageId}`, '_blank');
  };

  const getDeliveryStatusCount = (status) => {
    return deliveries.filter(delivery => delivery.status === status).length;
  };

  const getActiveDeliveries = () => {
    return deliveries.filter(delivery => isActiveStatus(delivery.status));
  };

  const getCompletedDeliveries = () => {
    return deliveries.filter(delivery => isCompletedStatus(delivery.status));
  };

  const getRecentDeliveries = () => {
    return deliveries
      .sort((a, b) => new Date(b.createdAt || b.acceptedAt) - new Date(a.createdAt || a.acceptedAt))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement de vos livraisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Mes Livraisons - ecodeli</title>
        <meta name="description" content="Gérez vos livraisons et suivez vos performances" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mes Livraisons
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Tableau de bord des livraisons - Transporteur
              </p>
            </div>
            <button
              onClick={refreshData}
              className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Statistics Overview Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total livraisons</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deliveries.length}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full dark:from-blue-900 dark:to-blue-800">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livraisons actives</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getActiveDeliveries().length}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full dark:from-orange-900 dark:to-orange-800">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livraisons terminées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getCompletedDeliveries().length}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus du mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earnings.month)}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full dark:from-purple-900 dark:to-purple-800">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Deliveries */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Livraisons récentes
              </h3>
            </div>
            <div className="p-6">
              {getRecentDeliveries().length > 0 ? (
                <div className="space-y-4">
                  {getRecentDeliveries().map((delivery) => {
                    const statusConfig = getStatusConfig(delivery.status);
                    return (
                      <div key={delivery.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{delivery.title}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                {statusConfig.text}
                              </span>
                              {delivery.isMultiSegment && (
                                <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                  Segment {delivery.segmentNumber}/{delivery.totalSegments}
                                </span>
                              )}
                            </div>
                            <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-2">
                              <div className="flex gap-1 items-center">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{delivery.fromAddress}</span>
                              </div>
                              <div className="flex gap-1 items-center">
                                <Navigation className="w-3 h-3" />
                                <span className="truncate">{delivery.toAddress}</span>
                              </div>
                            </div>
                            <div className="flex gap-4 items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Client: {delivery.senderName}</span>
                              <span>{delivery.weight} kg</span>
                              <span>Accepté le {new Date(delivery.acceptedAt || delivery.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(delivery.price)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewDelivery(delivery)}
                            className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md transition hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                          >
                            <Eye className="w-3 h-3" />
                            Voir détails
                          </button>
                          
                          {/* Actions selon l'état */}
                          {(delivery.status === 'CONFIRMED' || delivery.status === 'ACCEPTED_BY_SENDER') && (
                            <button
                              onClick={() => updateDeliveryStatus(delivery, 'ACCEPTED_BY_CARRIER')}
                              className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md transition hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Prendre en charge
                            </button>
                          )}
                          
                          {delivery.status === 'ACCEPTED_BY_CARRIER' && (
                            <button
                              onClick={() => updateDeliveryStatus(delivery, 'IN_TRANSIT')}
                              className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md transition hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 dark:hover:bg-orange-900/50"
                            >
                              <Truck className="w-3 h-3" />
                              Démarrer
                            </button>
                          )}
                          
                          {delivery.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => updateDeliveryStatus(delivery, 'DELIVERED')}
                              className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md transition hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Livrer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune livraison récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Status Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Répartition par statut
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">Confirmées</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {getDeliveryStatusCount('CONFIRMED') + getDeliveryStatusCount('ACCEPTED_BY_SENDER')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg dark:from-orange-900/20 dark:to-red-900/20">
                  <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">En transit</span>
                  </div>
                  <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {getDeliveryStatusCount('ACCEPTED_BY_CARRIER') + getDeliveryStatusCount('IN_TRANSIT')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">Livrées</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {getDeliveryStatusCount('DELIVERED')}
                  </span>
                </div>
                
                {dashboardStats.averageRating && (
                  <div className="p-4 mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg dark:from-yellow-900/20 dark:to-amber-900/20">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                        <span className="font-medium text-gray-900 dark:text-white">Note moyenne</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          {dashboardStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Information */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
              Informations sur les performances
            </h3>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Revenus totaux</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(earnings.total)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Depuis le début de votre activité
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Taux de completion</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {deliveries.length > 0 ? Math.round((getCompletedDeliveries().length / deliveries.length) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Livraisons terminées avec succès
                </p>
              </div>
            </div>
            
            <div className="p-4 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="mb-1 font-medium text-gray-900 dark:text-white">Conseils pour optimiser vos livraisons</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Mettez à jour le statut de vos livraisons régulièrement</li>
                    <li>• Communiquez avec vos clients via la messagerie intégrée</li>
                    <li>• Utilisez le système de relais pour optimiser vos trajets</li>
                    <li>• Consultez le suivi client pour une meilleure transparence</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
