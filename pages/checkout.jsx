import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
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
  X,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Checkout({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Cart and order state
  const [cart, setCart] = useState([]);
  const [merchant, setMerchant] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Delivery, 3: Payment
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  // Payment state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Time slots for delivery
  const timeSlots = [
    { id: 'morning', label: 'Matin (8h-12h)', value: 'morning' },
    { id: 'afternoon', label: 'Après-midi (12h-18h)', value: 'afternoon' },
    { id: 'evening', label: 'Soirée (18h-20h)', value: 'evening' }
  ];

  useEffect(() => {
    // Get cart data from localStorage or sessionStorage
    const cartData = localStorage.getItem('ecodeli_cart');
    const merchantData = localStorage.getItem('ecodeli_merchant');
    
    if (cartData && merchantData) {
      setCart(JSON.parse(cartData));
      setMerchant(JSON.parse(merchantData));
    } else {
      // No cart data, redirect to courses
      router.push('/courses');
      return;
    }

    // Pre-fill user info if logged in
    if (user) {
      setCustomerInfo({
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
    }
  }, [user, router]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    return wantsDelivery ? 5.99 : 0;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getDeliveryFee();
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      const updatedCart = cart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(updatedCart);
      localStorage.setItem('ecodeli_cart', JSON.stringify(updatedCart));
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('ecodeli_cart', JSON.stringify(updatedCart));
    
    if (updatedCart.length === 0) {
      localStorage.removeItem('ecodeli_cart');
      localStorage.removeItem('ecodeli_merchant');
      router.push('/courses');
    }
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return customerInfo.name && customerInfo.email && customerInfo.phone;
      case 2:
        return !wantsDelivery || (deliveryAddress && selectedTimeSlot);
      case 3:
        return true; // Stripe handles payment validation
      default:
        return false;
    }
  };

  const handlePaymentSuccess = (result) => {
    setPaymentSuccess(true);
    setOrderResult(result);
    
    // Clear cart
    localStorage.removeItem('ecodeli_cart');
    localStorage.removeItem('ecodeli_merchant');
    
    // Show success message briefly, then redirect
    setTimeout(() => {
      router.push(`/order-success?orderId=${result.orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setIsProcessing(false);
    alert('Erreur lors du paiement: ' + error.message);
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

  if (!cart.length || !merchant) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-4 w-16 h-16 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">Panier vide</h2>
          <p className="mb-4 text-gray-600">Ajoutez des produits à votre panier pour continuer</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
          >
            Découvrir les marchands
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Finaliser ma commande - ecodeli</title>
        <meta name="description" content="Finalisez votre commande avec livraison à domicile" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-8 mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center mr-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Finaliser ma commande
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Commande chez {merchant.name}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-4">
            {[
              { num: 1, label: 'Informations', icon: User },
              { num: 2, label: 'Livraison', icon: Truck },
              { num: 3, label: 'Paiement', icon: CreditCard }
            ].map((step) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.num 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {currentStep > step.num ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.num ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </span>
                {step.num < 3 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.num ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                  <User className="inline mr-2 w-5 h-5" />
                  Vos informations
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="06 12 34 56 78"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Delivery Options */}
            {currentStep === 2 && (
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                  <Truck className="inline mr-2 w-5 h-5" />
                  Options de livraison
                </h3>
                
                <div className="space-y-6">
                  {/* Delivery Choice */}
                  <div className="space-y-4">
                    <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="delivery"
                        checked={!wantsDelivery}
                        onChange={() => setWantsDelivery(false)}
                        className="mr-3"
                      />
                      <Home className="mr-3 w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">Retrait en magasin</div>
                        <div className="text-sm text-gray-500">Gratuit - Récupérez votre commande directement</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="delivery"
                        checked={wantsDelivery}
                        onChange={() => setWantsDelivery(true)}
                        className="mr-3"
                      />
                      <Truck className="mr-3 w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Livraison à domicile</div>
                        <div className="text-sm text-gray-500">+5,99€ - Livraison dans votre créneau préféré</div>
                      </div>
                    </label>
                  </div>

                  {/* Delivery Details */}
                  {wantsDelivery && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <MapPin className="inline mr-1 w-4 h-4" />
                            Adresse de livraison *
                          </label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            rows="3"
                            placeholder="Entrez votre adresse complète de livraison..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Clock className="inline mr-1 w-4 h-4" />
                            Créneau horaire préféré *
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
                                  required
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
                            className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Étage, code d'accès, autres instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Récapitulatif de commande
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
                </div>

                {/* Payment Success Message */}
                {paymentSuccess && orderResult && (
                  <div className="p-6 mb-6 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex items-center">
                      <CheckCircle className="mr-3 w-6 h-6 text-green-500" />
                      <div>
                        <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                          Commande confirmée !
                        </h4>
                        <p className="text-green-600 dark:text-green-400">
                          Numéro de commande: {orderResult.orderId}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Redirection vers la page de confirmation...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stripe Payment Form */}
                {!paymentSuccess && (
                  <StripeProvider amount={getFinalTotal()} currency="eur">
                    <PaymentForm
                      amount={getFinalTotal()}
                      currency="eur"
                      orderData={{
                        merchantId: merchant.id,
                        customerInfo: customerInfo,
                        items: cart.map(item => ({
                          productId: item.id,
                          productName: item.name,
                          quantity: item.quantity,
                          unitPrice: item.price
                        })),
                        delivery: wantsDelivery ? {
                          wantsDelivery: true,
                          address: deliveryAddress,
                          timeSlot: selectedTimeSlot,
                          instructions: deliveryInstructions
                        } : { wantsDelivery: false },
                        subtotal: getCartTotal(),
                        deliveryFee: getDeliveryFee(),
                        total: getFinalTotal()
                      }}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </StripeProvider>
                )}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                <ShoppingCart className="inline mr-2 w-5 h-5" />
                Votre commande ({cart.length})
              </h3>

              <div className="mb-6 space-y-3">
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

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
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
                      disabled={!validateStep(currentStep)}
                      className="px-4 py-2 w-full text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {currentStep === 1 ? 'Continuer vers livraison' : 'Continuer vers paiement'}
                    </button>
                  )}
                  
                  {currentStep === 3 && !paymentSuccess && (
                    <div className="p-4 text-sm text-center text-gray-600 dark:text-gray-400">
                      <Lock className="inline mr-2 w-4 h-4" />
                      Utilisez le formulaire de paiement ci-dessus pour finaliser votre commande
                    </div>
                  )}
                  
                  {paymentSuccess && (
                    <div className="p-4 text-center">
                      <CheckCircle className="mx-auto mb-2 w-8 h-8 text-green-500" />
                      <p className="font-medium text-green-600 dark:text-green-400">
                        Commande confirmée !
                      </p>
                    </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 