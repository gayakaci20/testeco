'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Navigation,
  Package,
  TrendingUp,
  Eye,
  Filter,
  Search,
  RefreshCw,
  User,
  Phone,
  Calendar,
  BarChart3,
  Users
} from 'lucide-react';

interface Delivery {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  price: number;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  package: {
    id: string;
    description: string;
    senderAddress: string;
    recipientAddress: string;
    weight?: number;
    sender?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };
    user?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };
    recipient?: {
      name: string;
      phone?: string;
    };
  };
  ride: {
    id: string;
    carrier?: {
      id: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      isOnline?: boolean;
    };
    user?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };
    startLocation: string;
    endLocation: string;
    departureTime: string;
  };
  trackingEvents?: Array<{
    id: string;
    status: string;
    timestamp: string;
    location?: string;
    notes?: string;
  }>;
}

interface DeliveryStats {
  total: number;
  pending: number;
  confirmed: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export default function DeliveryTrackingContent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
    avgDeliveryTime: 0,
    onTimeRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, selectedStatus, searchTerm]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deliveries');
      if (!response.ok) throw new Error('Failed to fetch deliveries');
      const data = await response.json();
      setDeliveries(data);
      calculateStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveries: Delivery[]) => {
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'PENDING').length,
      confirmed: deliveries.filter(d => d.status === 'CONFIRMED').length,
      inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
      delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
      cancelled: deliveries.filter(d => d.status === 'CANCELLED').length,
      avgDeliveryTime: 0,
      onTimeRate: 0
    };

    // Calculate average delivery time for delivered packages
    const deliveredPackages = deliveries.filter(d => d.status === 'DELIVERED' && d.actualDeliveryTime);
    if (deliveredPackages.length > 0) {
      const totalTime = deliveredPackages.reduce((sum, d) => {
        const created = new Date(d.createdAt);
        const delivered = new Date(d.actualDeliveryTime!);
        return sum + (delivered.getTime() - created.getTime());
      }, 0);
      stats.avgDeliveryTime = Math.round(totalTime / deliveredPackages.length / (1000 * 60 * 60)); // in hours
    }

    // Calculate on-time rate
    const onTimeDeliveries = deliveredPackages.filter(d => {
      if (!d.estimatedDeliveryTime) return true;
      const estimated = new Date(d.estimatedDeliveryTime);
      const actual = new Date(d.actualDeliveryTime!);
      return actual <= estimated;
    });
    stats.onTimeRate = deliveredPackages.length > 0 ? Math.round((onTimeDeliveries.length / deliveredPackages.length) * 100) : 0;

    setStats(stats);
  };

  const filterDeliveries = () => {
    let filtered = deliveries;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.package.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.package.senderAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.package.recipientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ride.carrier?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ride.carrier?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDeliveries(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmé';
      case 'IN_TRANSIT': return 'En transit';
      case 'DELIVERED': return 'Livré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des livraisons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-800 dark:text-red-200">Erreur: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-sky-50 rounded-xl border border-sky-200 dark:bg-sky-900/20 dark:border-sky-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sky-100 rounded-lg dark:bg-sky-900">
              <Navigation className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suivi des Livraisons</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Surveillez toutes vos livraisons en temps réel</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 font-medium text-sky-700 bg-sky-100 rounded-lg transition-colors duration-200 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-300"
            >
              <Filter className="mr-2 w-4 h-4" />
              Filtres
            </button>
            <button 
              onClick={fetchDeliveries}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-sky-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-sky-700 hover:shadow-md"
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total livraisons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
            <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900">
              <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrées aujourd'hui</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux ponctualité</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onTimeRate}%</p>
            </div>
            <div className="flex justify-center items-center w-12 h-12 bg-yellow-100 rounded-full dark:bg-yellow-900">
              <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par description, adresse ou transporteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Statut</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tous les statuts', count: stats.total },
                  { value: 'PENDING', label: 'En attente', count: stats.pending },
                  { value: 'CONFIRMED', label: 'Confirmés', count: stats.confirmed },
                  { value: 'IN_TRANSIT', label: 'En transit', count: stats.inTransit },
                  { value: 'DELIVERED', label: 'Livrés', count: stats.delivered },
                  { value: 'CANCELLED', label: 'Annulés', count: stats.cancelled }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedStatus === status.value
                        ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {status.value !== 'all' && getStatusIcon(status.value)}
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({status.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries List */}
      <div className="bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Livraisons ({filteredDeliveries.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredDeliveries.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 w-16 h-16 text-gray-400 dark:text-gray-500" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucune livraison trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucune livraison ne correspond à vos critères de recherche
              </p>
            </div>
          ) : (
            filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(delivery.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        #{delivery.id.slice(-8)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {delivery.package.description}
                    </h4>
                    
                    <div className="grid gap-2 md:grid-cols-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="font-medium">De:</span>
                        <span>{delivery.package.senderAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="font-medium">À:</span>
                        <span>{delivery.package.recipientAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Créé le {formatDate(delivery.createdAt)}</span>
                      </div>
                      {delivery.ride.carrier && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {delivery.ride.carrier.firstName} {delivery.ride.carrier.lastName}
                          </span>
                          {delivery.ride.carrier.isOnline && (
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-1"></span>
                          )}
                        </div>
                      )}
                      {delivery.package.weight && (
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{delivery.package.weight}kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        €{delivery.price.toFixed(2)}
                      </div>
                      {delivery.estimatedDeliveryTime && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Prévue: {formatDate(delivery.estimatedDeliveryTime)}
                        </div>
                      )}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}