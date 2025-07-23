import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  Mail,
  Phone,
  Home,
  ArrowRight
} from 'lucide-react';

export default function OrderSuccess({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/customer-orders?orderId=${orderId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const orders = await response.json();
        if (orders.length > 0) {
          setOrder(orders[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
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
        <title>Commande confirmée - ecodeli</title>
        <meta name="description" content="Votre commande a été confirmée avec succès" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-12 mx-auto">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex justify-center items-center w-20 h-20 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Commande confirmée !
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Merci pour votre commande. Vous allez recevoir un email de confirmation.
            </p>
            {order && (
              <div className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg">
                <Package className="mr-2 w-4 h-4" />
                Commande #{order.id}
              </div>
            )}
          </div>

          {order && (
            <div className="space-y-6">
              {/* Order Details */}
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Détails de votre commande
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Customer Info */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Informations client
                    </h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-900 dark:text-white">
                        <Mail className="mr-2 w-4 h-4 text-gray-400" />
                        {order.customerEmail}
                      </p>
                      <p className="flex items-center text-gray-900 dark:text-white">
                        <Phone className="mr-2 w-4 h-4 text-gray-400" />
                        {order.customerPhone}
                      </p>
                    </div>
                  </div>

                  {/* Merchant Info */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Marchand
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`}
                      </p>
                      {order.merchant?.address && (
                        <p className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPin className="mr-2 w-4 h-4" />
                          {order.merchant.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {order.hasDelivery ? (
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    <Truck className="inline mr-2 w-5 h-5 text-blue-500" />
                    Informations de livraison
                  </h2>
                  <div className="space-y-3">
                    <p className="flex items-start text-gray-900 dark:text-white">
                      <MapPin className="mr-2 w-4 h-4 mt-1 text-gray-400" />
                      <span>{order.deliveryAddress}</span>
                    </p>
                    <p className="flex items-center text-gray-900 dark:text-white">
                      <Clock className="mr-2 w-4 h-4 text-gray-400" />
                      <span>
                        {order.deliveryTimeSlot === 'morning' && 'Matin (8h-12h)'}
                        {order.deliveryTimeSlot === 'afternoon' && 'Après-midi (12h-18h)'}
                        {order.deliveryTimeSlot === 'evening' && 'Soirée (18h-20h)'}
                      </span>
                    </p>
                    {order.deliveryInstructions && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Instructions:</strong> {order.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    <Home className="inline mr-2 w-5 h-5 text-green-500" />
                    Retrait en magasin
                  </h2>
                  <p className="text-gray-900 dark:text-white">
                    Votre commande sera prête pour retrait. Vous recevrez une notification lorsqu'elle sera prête.
                  </p>
                  {order.merchant?.address && (
                    <p className="flex items-center mt-3 text-gray-600 dark:text-gray-400">
                      <MapPin className="mr-2 w-4 h-4" />
                      {order.merchant.address}
                    </p>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Articles commandés
                </h2>
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0 dark:border-gray-700">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.productName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          €{item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          €{item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                    <span className="text-gray-900 dark:text-white">€{order.subtotal?.toFixed(2)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Livraison</span>
                      <span className="text-gray-900 dark:text-white">€{order.deliveryFee?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 text-lg font-bold border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">€{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-6 bg-gray-100 rounded-lg dark:bg-gray-700">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Prochaines étapes
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 mr-3 text-xs font-bold text-white bg-blue-500 rounded-full flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Confirmation par email</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vous allez recevoir un email avec tous les détails de votre commande
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 mr-3 text-xs font-bold text-white bg-blue-500 rounded-full flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Préparation</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Le marchand va préparer votre commande
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 mr-3 text-xs font-bold text-white bg-blue-500 rounded-full flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {order.hasDelivery ? 'Livraison' : 'Notification de retrait'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.hasDelivery 
                          ? 'Votre commande sera livrée dans le créneau choisi'
                          : 'Vous recevrez une notification quand votre commande sera prête'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/courses">
                  <button className="flex items-center justify-center px-6 py-3 w-full text-sky-600 bg-white border border-sky-600 rounded-lg hover:bg-sky-50 sm:w-auto">
                    Continuer mes achats
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </Link>
                
                <Link href="/profile">
                  <button className="flex items-center justify-center px-6 py-3 w-full text-white bg-sky-600 rounded-lg hover:bg-sky-700 sm:w-auto">
                    Voir mes commandes
                    <Package className="ml-2 w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {!order && !loading && (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 w-16 h-16 text-gray-400" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Commande non trouvée
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Impossible de trouver les détails de cette commande
              </p>
              <Link href="/courses">
                <button className="px-6 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600">
                  Retour aux marchands
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 