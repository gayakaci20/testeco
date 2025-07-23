import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Clock, 
  CreditCard,
  Package,
  Home,
  Truck,
  Check,
  User,
  Mail,
  Phone,
  X
} from 'lucide-react';

export default function POSCheckout({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Items, 2: Delivery, 3: Payment
  
  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // Delivery Options
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  
  // Available products - loaded from API
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // Time slots for delivery
  const timeSlots = [
    { id: 'morning', label: 'Matin (8h-12h)', value: 'morning' },
    { id: 'afternoon', label: 'Après-midi (12h-18h)', value: 'afternoon' },
    { id: 'evening', label: 'Soirée (18h-20h)', value: 'evening' }
  ];
  
  useEffect(() => {
    if (!loading && (!user || user.role !== 'MERCHANT')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'MERCHANT') {
      fetchMerchantProducts();
    }
  }, [user, loading, router]);

  const fetchMerchantProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/merchants/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products);
      } else {
        console.error('Failed to fetch products');
        // Set some default products if API fails
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setAvailableProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Cart functions
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    return wantsDelivery ? 5.99 : 0;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getDeliveryFee();
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const processOrder = async () => {
    try {
      const orderData = {
        customerInfo,
        items: cart,
        subtotal: getCartTotal(),
        deliveryFee: getDeliveryFee(),
        total: getFinalTotal(),
        delivery: wantsDelivery ? {
          address: deliveryAddress,
          timeSlot: selectedTimeSlot,
          instructions: deliveryInstructions
        } : null,
        merchantId: user.id,
        orderType: 'POS_CHECKOUT'
      };

      // Send order to API
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du traitement de la commande');
      }

      const result = await response.json();
      
      // Reset form
      setCart([]);
      setCurrentStep(1);
      setCustomerInfo({ name: '', email: '', phone: '' });
      setWantsDelivery(false);
      setDeliveryAddress('');
      setSelectedTimeSlot('');
      setDeliveryInstructions('');
      
      // Show success message with order number
      alert(`Commande #${result.order.id} traitée avec succès !${wantsDelivery ? '\nLa livraison sera organisée selon les préférences du client.' : ''}`);
      
    } catch (error) {
      console.error('Error processing order:', error);
      alert(`Erreur: ${error.message}`);
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
        <title>Point de Vente - ecodeli</title>
        <meta name="description" content="Interface de caisse pour marchands" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Point de Vente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interface de caisse avec option livraison à domicile
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-4">
            {[
              { num: 1, label: 'Articles', icon: ShoppingCart },
              { num: 2, label: 'Livraison', icon: Truck },
              { num: 3, label: 'Paiement', icon: CreditCard }
            ].map((step) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.num 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.num ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.num ? 'text-sky-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {step.num < 3 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.num ? 'bg-sky-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Informations Client
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Nom du client"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Selection */}
                <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Sélection de Produits
                  </h3>
                  
                  {productsLoading ? (
                    <div className="py-8 text-center">
                      <div className="mx-auto w-8 h-8 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des produits...</p>
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Aucun produit disponible</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Ajoutez des produits depuis votre tableau de bord marchand
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {availableProducts.map((product) => (
                      <div key={product.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                          <span className="text-lg font-bold text-sky-600">€{product.price}</span>
                        </div>
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                          Stock: {product.stock}
                        </p>
                        <button
                          onClick={() => addToCart(product)}
                          className="flex justify-center items-center px-3 py-2 w-full text-white bg-sky-500 rounded-md hover:bg-sky-600"
                        >
                          <Plus className="mr-1 w-4 h-4" />
                          Ajouter
                        </button>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Delivery Option */}
                <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Option de Livraison
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Delivery Choice */}
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="delivery"
                          checked={!wantsDelivery}
                          onChange={() => setWantsDelivery(false)}
                          className="mr-2"
                        />
                        <Home className="mr-2 w-5 h-5" />
                        Retrait en magasin (Gratuit)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="delivery"
                          checked={wantsDelivery}
                          onChange={() => setWantsDelivery(true)}
                          className="mr-2"
                        />
                        <Truck className="mr-2 w-5 h-5" />
                        Livraison à domicile (+€5.99)
                      </label>
                    </div>

                    {/* Delivery Details */}
                    {wantsDelivery && (
                      <div className="p-4 bg-sky-50 rounded-lg border border-sky-200 dark:bg-sky-900/20 dark:border-sky-800">
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <MapPin className="inline mr-1 w-4 h-4" />
                              Adresse de livraison
                            </label>
                            <textarea
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              rows="3"
                              placeholder="Entrez l'adresse complète de livraison..."
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Clock className="inline mr-1 w-4 h-4" />
                              Créneau horaire préféré
                            </label>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                              {timeSlots.map((slot) => (
                                <label key={slot.id} className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                  <input
                                    type="radio"
                                    name="timeSlot"
                                    value={slot.value}
                                    checked={selectedTimeSlot === slot.value}
                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                    className="mr-3"
                                  />
                                  <span className="text-sm">{slot.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Instructions de livraison (optionnel)
                            </label>
                            <input
                              type="text"
                              value={deliveryInstructions}
                              onChange={(e) => setDeliveryInstructions(e.target.value)}
                              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="Étage, code d'accès, autres instructions..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Récapitulatif de la Commande
                  </h3>
                  
                  {/* Customer Info Summary */}
                  <div className="p-4 mb-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Client</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {customerInfo.name} • {customerInfo.email} • {customerInfo.phone}
                    </p>
                  </div>

                  {/* Delivery Info Summary */}
                  {wantsDelivery && (
                    <div className="p-4 mb-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                      <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Livraison</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="inline mr-1 w-4 h-4" />
                        {deliveryAddress}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="inline mr-1 w-4 h-4" />
                        {timeSlots.find(slot => slot.value === selectedTimeSlot)?.label}
                      </p>
                      {deliveryInstructions && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Instructions: {deliveryInstructions}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Mode de paiement</h4>
                    <div className="flex space-x-4">
                      <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                        <input type="radio" name="payment" defaultChecked className="mr-3" />
                        <CreditCard className="mr-2 w-5 h-5" />
                        <span>Carte bancaire</span>
                      </label>
                      <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                        <input type="radio" name="payment" className="mr-3" />
                        <span>Espèces</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Panier ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Panier vide</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-xs text-gray-500">€{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>€{getCartTotal().toFixed(2)}</span>
                    </div>
                    {wantsDelivery && (
                      <div className="flex justify-between">
                        <span>Livraison</span>
                        <span>€{getDeliveryFee().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-lg font-bold border-t border-gray-200 dark:border-gray-700">
                      <span>Total</span>
                      <span>€{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    {currentStep < 3 && (
                      <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={cart.length === 0 || (currentStep === 1 && !customerInfo.name)}
                        className="px-4 py-2 w-full text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {currentStep === 1 ? 'Continuer vers livraison' : 'Continuer vers paiement'}
                      </button>
                    )}
                    
                    {currentStep === 3 && (
                      <button
                        onClick={processOrder}
                        disabled={!customerInfo.name || (wantsDelivery && !deliveryAddress)}
                        className="px-4 py-2 w-full text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Finaliser la commande
                      </button>
                    )}
                    
                    {currentStep > 1 && (
                      <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-4 py-2 w-full text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                      >
                        Retour
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 