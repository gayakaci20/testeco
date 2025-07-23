import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
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
  MessageCircle
} from 'lucide-react';

export default function OrderTracking({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [guestOrder, setGuestOrder] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customer-orders?customerId=${user.id}`, {
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

  const searchGuestOrder = async () => {
    if (!searchOrderId || !guestEmail) {
      alert('Veuillez saisir votre ID de commande et votre email');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/customer-orders?orderId=${searchOrderId}&email=${guestEmail}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const ordersData = await response.json();
        if (ordersData.length > 0) {
          setGuestOrder(ordersData[0]);
          setSelectedOrder(ordersData[0]);
        } else {
          alert('Aucune commande trouvée avec ces informations');
        }
      } else {
        alert('Erreur lors de la recherche de votre commande');
      }
    } catch (error) {
      console.error('Error searching guest order:', error);
      alert('Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSteps = (order) => {
    const steps = [
      { key: 'PENDING', label: 'Commande reçue', icon: Package, completed: false },
      { key: 'CONFIRMED', label: 'Confirmée', icon: CheckCircle, completed: false },
      { key: 'PROCESSING', label: 'En préparation', icon: Clock, completed: false },
      { key: 'SHIPPED', label: 'Expédiée', icon: Truck, completed: false },
      { key: 'DELIVERED', label: 'Livrée', icon: CheckCircle, completed: false }
    ];

    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && order.status !== 'CANCELLED',
      current: index === currentIndex && order.status !== 'CANCELLED',
      cancelled: order.status === 'CANCELLED'
    }));
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

  const getEstimatedDelivery = (order) => {
    if (!order.hasDelivery || order.status === 'DELIVERED') return null;
    
    const createdDate = new Date(order.createdAt);
    const estimatedDate = new Date(createdDate);
    
    // Add delivery time based on status
    switch (order.status) {
      case 'PENDING':
      case 'CONFIRMED':
        estimatedDate.setDate(estimatedDate.getDate() + 3);
        break;
      case 'PROCESSING':
        estimatedDate.setDate(estimatedDate.getDate() + 2);
        break;
      case 'SHIPPED':
        estimatedDate.setDate(estimatedDate.getDate() + 1);
        break;
      default:
        return null;
    }
    
    return estimatedDate;
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
        <title>Suivi de commande - ecodeli</title>
        <meta name="description" content="Suivez l'état de vos commandes en temps réel" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            Suivi de commande
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Suivez l'état de vos commandes en temps réel et restez informé de chaque étape
          </p>
        </div>

        {!user && !selectedOrder && (
          // Guest order search
          <div className="max-w-md mx-auto mb-8">
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Rechercher votre commande
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID de commande
                  </label>
                  <input
                    type="text"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Entrez votre ID de commande"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Email utilisé pour la commande"
                  />
                </div>
                <button
                  onClick={searchGuestOrder}
                  disabled={isLoading}
                  className="flex justify-center items-center px-4 py-2 w-full text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-gray-300"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 w-4 h-4" />
                      Rechercher
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {user && orders.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 w-16 h-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Aucune commande trouvée
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Vous n'avez pas encore passé de commande
            </p>
            <Link href="/courses">
              <button className="px-6 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600">
                Découvrir nos marchands
              </button>
            </Link>
          </div>
        )}

        {user && orders.length > 0 && (
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
            {/* Orders List */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mes commandes ({orders.length})
                  </h2>
                  <button
                    onClick={fetchUserOrders}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      } bg-white dark:bg-gray-800`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          #{order.id.substring(0, 8)}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium">€{order.total.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
                <OrderDetails order={selectedOrder} />
              ) : (
                <div className="flex justify-center items-center h-64 text-center">
                  <div>
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Sélectionnez une commande pour voir les détails
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedOrder && !user && (
          <div className="max-w-4xl mx-auto">
            <OrderDetails order={selectedOrder} />
          </div>
        )}
      </div>
    </div>
  );

  function OrderDetails({ order }) {
    const steps = getStatusSteps(order);
    const estimatedDelivery = getEstimatedDelivery(order);

    return (
      <div className="space-y-6">
        {/* Order Header */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Commande #{order.id.substring(0, 8)}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status === 'PENDING' && 'En attente'}
              {order.status === 'CONFIRMED' && 'Confirmée'}
              {order.status === 'PROCESSING' && 'En préparation'}
              {order.status === 'SHIPPED' && 'Expédiée'}
              {order.status === 'DELIVERED' && 'Livrée'}
              {order.status === 'CANCELLED' && 'Annulée'}
            </span>
          </div>

          {estimatedDelivery && (
            <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
              <div className="flex items-center text-blue-700 dark:text-blue-300">
                <Truck className="mr-2 w-4 h-4" />
                <span className="text-sm font-medium">
                  Livraison estimée le {estimatedDelivery.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Suivi de votre commande
          </h3>
          <div className="relative">
            {steps.map((step, index) => (
              <div key={step.key} className="relative flex items-center pb-8 last:pb-0">
                {index < steps.length - 1 && (
                  <div className={`absolute left-4 top-8 w-0.5 h-8 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${
                  step.cancelled 
                    ? 'bg-red-500 text-white'
                    : step.completed 
                      ? 'bg-green-500 text-white' 
                      : step.current 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    step.completed || step.current ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.completed && order[`${step.key.toLowerCase()}At`] && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order[`${step.key.toLowerCase()}At`]).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Info */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Informations du marchand
          </h3>
          <div className="flex items-start space-x-4">
            <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-lg dark:bg-sky-900/20">
              <User className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`}
              </h4>
              {order.merchant?.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="inline mr-1 w-3 h-3" />
                  {order.merchant.address}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Mail className="inline mr-1 w-3 h-3" />
                {order.merchant?.email}
              </p>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  4.8 (127 avis)
                </span>
              </div>
            </div>
            <button 
              onClick={() => router.push(`/messages?merchantId=${order.merchant?.id}&merchantName=${encodeURIComponent(order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`)}&orderId=${order.id}`)}
              className="flex items-center px-3 py-2 text-sm text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-900/20"
            >
              <MessageCircle className="mr-1 w-4 h-4" />
              Contacter
            </button>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {order.hasDelivery ? 'Informations de livraison' : 'Retrait en magasin'}
          </h3>
          {order.hasDelivery ? (
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="mr-3 w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Adresse de livraison</p>
                  <p className="text-gray-600 dark:text-gray-400">{order.deliveryAddress}</p>
                </div>
              </div>
              {order.deliveryTimeSlot && (
                <div className="flex items-center">
                  <Clock className="mr-3 w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Créneau préféré</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {order.deliveryTimeSlot === 'morning' && 'Matin (8h-12h)'}
                      {order.deliveryTimeSlot === 'afternoon' && 'Après-midi (12h-18h)'}
                      {order.deliveryTimeSlot === 'evening' && 'Soirée (18h-20h)'}
                    </p>
                  </div>
                </div>
              )}
              {order.deliveryInstructions && (
                <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Instructions:</strong> {order.deliveryInstructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Home className="mr-3 w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Retrait en magasin</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Récupérez votre commande directement chez le marchand
                </p>
                {order.merchant?.address && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {order.merchant.address}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Articles commandés
          </h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                  <p className="text-sm text-gray-500">€{item.unitPrice.toFixed(2)} × {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    €{item.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>€{order.subtotal.toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Frais de livraison:</span>
                  <span>€{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>€{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">
            Télécharger la facture
          </button>
          <button 
            onClick={() => router.push(`/messages?merchantId=${order.merchant?.id}&merchantName=${encodeURIComponent(order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`)}&orderId=${order.id}`)}
            className="flex-1 px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
          >
            <MessageCircle className="inline mr-2 w-4 h-4" />
            Contacter le marchand
          </button>
        </div>
      </div>
    );
  }
} 