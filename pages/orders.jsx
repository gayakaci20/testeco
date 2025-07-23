import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Eye, 
  Edit2,
  Truck,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Archive
} from 'lucide-react';

export default function Orders({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

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
        
        if (userData.role !== 'MERCHANT') {
          router.push('/dashboard');
          return;
        }
        
        await fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/dashboard/merchant', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchOrders();
    setLoading(false);
  };

  const handleViewOrder = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        alert('Statut mis à jour avec succès');
      } else {
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleCreateShipment = (orderId) => {
    router.push(`/shipments/create?orderId=${orderId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { 
        label: 'En attente', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock
      },
      'CONFIRMED': { 
        label: 'Confirmé', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: CheckCircle
      },
      'PROCESSING': { 
        label: 'En préparation', 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        icon: Package
      },
      'SHIPPED': { 
        label: 'Expédié', 
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        icon: Truck
      },
      'DELIVERED': { 
        label: 'Livré', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle
      },
      'CANCELLED': { 
        label: 'Annulé', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: AlertCircle
      }
    };
    return configs[status] || configs['PENDING'];
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.id.toString().includes(searchTerm);
    const matchesStatus = selectedStatus === '' || order.status === selectedStatus;
    
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      
      switch (selectedPeriod) {
        case 'today':
          matchesPeriod = orderDate.toDateString() === now.toDateString();
          break;
        case 'week':
          matchesPeriod = (now - orderDate) <= 7 * dayMs;
          break;
        case 'month':
          matchesPeriod = (now - orderDate) <= 30 * dayMs;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-green-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Mes Commandes - ecodeli</title>
        <meta name="description" content="Gérez vos commandes clients" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mes Commandes
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez les commandes de vos clients
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                className="flex gap-2 items-center px-4 py-2 font-medium text-gray-700 bg-white rounded-lg shadow-sm border border-gray-200 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              <button
                onClick={() => router.push('/pos-checkout')}
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg transition-all transform hover:scale-105 hover:from-green-600 hover:to-green-700 shadow-green-500/25"
              >
                <ShoppingCart className="w-4 h-4" />
                Nouvelle commande
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalOrders}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingOrders}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full dark:from-yellow-900 dark:to-yellow-800">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedOrders}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full dark:from-blue-900 dark:to-blue-800">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full dark:from-purple-900 dark:to-purple-800">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom client ou numéro de commande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-3 pr-4 pl-10 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-3 text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-400"
                >
                  <option value="">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="PROCESSING">En préparation</option>
                  <option value="SHIPPED">Expédié</option>
                  <option value="DELIVERED">Livré</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-3 text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-400"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
                <button className="flex items-center px-4 py-3 text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex gap-3 items-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Commande #{order.id}
                          </h4>
                          <span className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.customerName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.customerEmail}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.items?.length || 0} article(s)
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.hasDelivery ? 'Livraison' : 'Retrait'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {order.hasDelivery && order.deliveryAddress && (
                          <div className="flex items-start gap-2 mt-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(order.total || 0)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total TTC
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Articles commandés</h5>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatCurrency(item.unitPrice || 0)} × {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(item.totalPrice || 0)}
                              </p>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                              +{order.items.length - 3} autre(s) article(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {order.confirmedAt && (
                          <span>Confirmé le {new Date(order.confirmedAt).toLocaleDateString('fr-FR')}</span>
                        )}
                        {order.shippedAt && (
                          <span>Expédié le {new Date(order.shippedAt).toLocaleDateString('fr-FR')}</span>
                        )}
                        {order.deliveredAt && (
                          <span>Livré le {new Date(order.deliveredAt).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                        
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                            className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmer
                          </button>
                        )}
                        
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}
                            className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20 dark:hover:bg-purple-900/30"
                          >
                            <Package className="w-4 h-4" />
                            Préparer
                          </button>
                        )}
                        
                        {order.status === 'PROCESSING' && (
                          <button
                            onClick={() => handleCreateShipment(order.id)}
                            className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
                          >
                            <Truck className="w-4 h-4" />
                            Expédier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="p-12 text-center">
                <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center dark:from-green-900 dark:to-green-800">
                  <ShoppingCart className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  {searchTerm || selectedStatus || selectedPeriod !== 'all' ? 'Aucune commande trouvée' : 'Aucune commande'}
                </h3>
                <p className="mb-6 text-gray-500 dark:text-gray-400">
                  {searchTerm || selectedStatus || selectedPeriod !== 'all' 
                    ? 'Essayez de modifier vos filtres de recherche' 
                    : 'Les commandes de vos clients apparaîtront ici'}
                </p>
                <button
                  onClick={() => router.push('/pos-checkout')}
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm transition-all hover:from-green-600 hover:to-green-700 hover:shadow-md"
                >
                  <ShoppingCart className="mr-2 w-5 h-5" />
                  Créer une commande
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 