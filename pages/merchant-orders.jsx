import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Package, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  Filter,
  Search,
  RefreshCw,
  DollarSign,
  Home,
  Calendar,
  X
} from 'lucide-react';

export default function MerchantOrders({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const orderStatuses = [
    { value: 'all', label: 'Toutes les commandes', color: 'gray' },
    { value: 'PENDING', label: 'En attente', color: 'yellow' },
    { value: 'CONFIRMED', label: 'Confirmées', color: 'blue' },
    { value: 'PROCESSING', label: 'En préparation', color: 'orange' },
    { value: 'SHIPPED', label: 'Expédiées', color: 'purple' },
    { value: 'DELIVERED', label: 'Livrées', color: 'green' },
    { value: 'CANCELLED', label: 'Annulées', color: 'red' }
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== 'MERCHANT')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'MERCHANT') {
      fetchOrders();
    }
  }, [user, loading, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customer-orders?merchantId=${user.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch('/api/customer-orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        // Update the order in the list
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        
        // Update selected order if it's the same
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        alert('Statut mis à jour avec succès');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'PROCESSING': return <RefreshCw className="w-4 h-4" />;
      case 'SHIPPED': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <Package className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-100';
      case 'PROCESSING': return 'text-orange-600 bg-orange-100';
      case 'SHIPPED': return 'text-purple-600 bg-purple-100';
      case 'DELIVERED': return 'text-green-600 bg-green-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getOrderTotal = () => {
    return orders.reduce((total, order) => total + order.total, 0);
  };

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Mes commandes - ecodeli</title>
        <meta name="description" content="Gérez vos commandes clients" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Mes commandes clients
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez et suivez toutes vos commandes clients
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-sky-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Total commandes</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOrdersByStatus('PENDING')}</p>
                <p className="text-gray-600 dark:text-gray-400">En attente</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOrdersByStatus('DELIVERED')}</p>
                <p className="text-gray-600 dark:text-gray-400">Livrées</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{getOrderTotal().toFixed(2)}</p>
                <p className="text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par client, email ou ID commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                {orderStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={fetchOrders}
                className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
              >
                <RefreshCw className="mr-2 w-4 h-4" />
                Actualiser
              </button>

              <button
                onClick={() => {
                  const csvContent = generateCSVExport();
                  downloadCSV(csvContent, `commandes-${new Date().toISOString().split('T')[0]}.csv`);
                }}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              >
                <Package className="mr-2 w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-8 h-8 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des commandes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Aucune commande trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter === 'all' 
                  ? "Vous n'avez pas encore reçu de commandes"
                  : `Aucune commande avec le statut "${orderStatuses.find(s => s.value === statusFilter)?.label}"`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Client
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Total
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Livraison
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          #{order.id.substring(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.orderType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Mail className="inline mr-1 w-3 h-3" />
                          {order.customerEmail}
                        </div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-500">
                            <Phone className="inline mr-1 w-3 h-3" />
                            {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.items?.length || 0} article(s)
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {order.items?.map(item => item.productName).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          €{order.total.toFixed(2)}
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="text-xs text-gray-500">
                            +€{order.deliveryFee.toFixed(2)} livraison
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {order.hasDelivery ? (
                          <div className="flex items-center text-sm text-blue-600">
                            <Truck className="mr-1 w-4 h-4" />
                            Livraison
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-green-600">
                            <Home className="mr-1 w-4 h-4" />
                            Retrait
                          </div>
                        )}
                        {order.deliveryTimeSlot && (
                          <div className="text-xs text-gray-500">
                            {order.deliveryTimeSlot === 'morning' && 'Matin'}
                            {order.deliveryTimeSlot === 'afternoon' && 'Après-midi'}
                            {order.deliveryTimeSlot === 'evening' && 'Soirée'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingStatus}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-none ${getStatusColor(order.status)} focus:ring-2 focus:ring-sky-500`}
                          >
                            <option value="PENDING">En attente</option>
                            <option value="CONFIRMED">Confirmée</option>
                            <option value="PROCESSING">En préparation</option>
                            <option value="SHIPPED">Expédiée</option>
                            <option value="DELIVERED">Livrée</option>
                            <option value="CANCELLED">Annulée</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs">
                          {new Date(order.createdAt).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="text-sky-600 hover:text-sky-900 mr-3"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.hasDelivery && order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                            className="text-green-600 hover:text-green-900"
                            title="Marquer comme expédiée"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {showOrderModal && selectedOrder && (
          <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Commande #{selectedOrder.id.substring(0, 8)}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Customer Information */}
                  <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      Informations client
                    </h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        <strong className="mr-2">Nom:</strong> {selectedOrder.customerName}
                      </p>
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        <Mail className="mr-2 w-4 h-4" />
                        {selectedOrder.customerEmail}
                      </p>
                      {selectedOrder.customerPhone && (
                        <p className="flex items-center text-gray-700 dark:text-gray-300">
                          <Phone className="mr-2 w-4 h-4" />
                          {selectedOrder.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.hasDelivery ? 'Livraison' : 'Retrait'}
                    </h3>
                    {selectedOrder.hasDelivery ? (
                      <div className="space-y-2">
                        <p className="flex items-start text-gray-700 dark:text-gray-300">
                          <MapPin className="mr-2 w-4 h-4 mt-1" />
                          {selectedOrder.deliveryAddress}
                        </p>
                        {selectedOrder.deliveryTimeSlot && (
                          <p className="flex items-center text-gray-700 dark:text-gray-300">
                            <Clock className="mr-2 w-4 h-4" />
                            {selectedOrder.deliveryTimeSlot === 'morning' && 'Matin (8h-12h)'}
                            {selectedOrder.deliveryTimeSlot === 'afternoon' && 'Après-midi (12h-18h)'}
                            {selectedOrder.deliveryTimeSlot === 'evening' && 'Soirée (18h-20h)'}
                          </p>
                        )}
                        {selectedOrder.deliveryInstructions && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Instructions:</strong> {selectedOrder.deliveryInstructions}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        <Home className="mr-2 w-4 h-4" />
                        Retrait en magasin
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Articles commandés
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                            Produit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                            Prix unitaire
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                            Quantité
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              €{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              €{item.totalPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sous-total:</span>
                        <span>€{selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedOrder.deliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span>Frais de livraison:</span>
                          <span>€{selectedOrder.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>€{selectedOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Fermer
                  </button>
                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        const nextStatus = getNextStatus(selectedOrder.status);
                        if (nextStatus) {
                          handleStatusChange(selectedOrder.id, nextStatus);
                        }
                      }}
                      className="px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                    >
                      {getNextStatusLabel(selectedOrder.status)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Helper functions
  function getNextStatus(currentStatus) {
    const statusFlow = {
      'PENDING': 'CONFIRMED',
      'CONFIRMED': 'PROCESSING',
      'PROCESSING': 'SHIPPED',
      'SHIPPED': 'DELIVERED'
    };
    return statusFlow[currentStatus];
  }

  function getNextStatusLabel(currentStatus) {
    const labels = {
      'PENDING': 'Confirmer',
      'CONFIRMED': 'Marquer en préparation',
      'PROCESSING': 'Marquer comme expédiée',
      'SHIPPED': 'Marquer comme livrée'
    };
    return labels[currentStatus] || 'Mettre à jour';
  }

  function generateCSVExport() {
    const headers = ['ID Commande', 'Client', 'Email', 'Téléphone', 'Articles', 'Total', 'Livraison', 'Statut', 'Date'];
    const csvData = [headers];
    
    filteredOrders.forEach(order => {
      csvData.push([
        order.id,
        order.customerName,
        order.customerEmail || '',
        order.customerPhone || '',
        order.items?.map(item => `${item.productName} (${item.quantity})`).join('; ') || '',
        order.total.toFixed(2),
        order.hasDelivery ? 'Livraison' : 'Retrait',
        order.status,
        new Date(order.createdAt).toLocaleDateString('fr-FR')
      ]);
    });
    
    return csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
} 