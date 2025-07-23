import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ 
  paymentData, 
  onPaymentSuccess, 
  onPaymentError, 
  clientSecret,
  isProcessing,
  setIsProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe n\'est pas encore chargé. Veuillez patienter...');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Submit the payment form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm the payment on the backend
        const confirmResponse = await fetch('/api/box-rental-payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rentalId: paymentData.id,
            paymentIntentId: paymentIntent.id,
            confirmPayment: true
          })
        });

        const confirmResult = await confirmResponse.json();

        if (confirmResponse.ok && confirmResult.success) {
          onPaymentSuccess(confirmResult);
        } else {
          throw new Error(confirmResult.error || 'Payment confirmation failed');
        }
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Une erreur est survenue lors du paiement');
      onPaymentError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center p-4 space-x-3 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="flex-shrink-0 w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="p-4 bg-white rounded-lg border">
        <PaymentElement />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="flex justify-center items-center px-4 py-3 space-x-2 w-full text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
            <span>Traitement en cours...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Payer {paymentData.amount}€</span>
          </>
        )}
      </button>
    </form>
  );
};

// Legacy payment form for non-box-rental payments (keeping the old logic for other payment types)
const LegacyPaymentForm = ({ 
  paymentData, 
  onPaymentSuccess, 
  onPaymentError,
  isProcessing,
  setIsProcessing,
  user 
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'FR'
  });
  const [error, setError] = useState('');

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData) return;
    
    setIsProcessing(true);
    setError('');

    try {
      let endpoint = '';
      let payload = {};
      
      if (paymentData.type === 'ride_request') {
        endpoint = '/api/ride-payments';
        payload = {
          rideRequestId: paymentData.id,
          paymentData: {
            paymentMethod: 'CARD',
            cardNumber,
            expiryDate,
            cvv,
            cardholderName,
            billingAddress
          }
        };
      } else if (paymentData.type === 'match') {
        endpoint = '/api/match-payments';
        payload = {
          matchId: paymentData.id,
          paymentData: {
            paymentMethod: 'CARD',
            cardNumber,
            expiryDate,
            cvv,
            cardholderName,
            billingAddress
          },
          acceptMatch: true
        };
      } else if (paymentData.type === 'direct_package') {
        endpoint = '/api/package-payments';
        payload = {
          packageId: paymentData.id,
          paymentData: {
            paymentMethod: 'CARD',
            cardNumber,
            expiryDate,
            cvv,
            cardholderName,
            billingAddress
          }
        };
      } else if (paymentData.type === 'booking') {
        // For now, we'll use a generic approach for bookings
        // This should be replaced with a proper booking payment endpoint
        setError('Les paiements de réservation ne sont pas encore supportés avec ce formulaire.');
        return;
      }

      if (!endpoint) {
        setError('Type de paiement non supporté');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onPaymentSuccess(result);
      } else {
        setError(result.error || result.details || 'Le paiement a échoué');
        onPaymentError(new Error(result.error || 'Payment failed'));
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError('Une erreur inattendue s\'est produite');
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {error && (
        <div className="flex items-center p-4 space-x-3 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="flex-shrink-0 w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Nom du porteur de carte
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Jean Dupont"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Numéro de carte
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          required
          maxLength={19}
          className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1234 5678 9012 3456"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Date d'expiration
          </label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            required
            maxLength={5}
            className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="MM/AA"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
            required
            maxLength={4}
            className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Ville
          </label>
          <input
            type="text"
            value={billingAddress.city}
            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
            required
            className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paris"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Code postal
          </label>
          <input
            type="text"
            value={billingAddress.postalCode}
            onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
            required
            className="p-3 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="75001"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="flex justify-center items-center px-4 py-3 space-x-2 w-full text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
            <span>Traitement en cours...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Payer {paymentData.amount}€</span>
          </>
        )}
      </button>
    </form>
  );
};

export default function PaymentProcess() {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPaymentData = async () => {
      console.log('🔄 Initializing payment page...', router.query);
      try {
        const { rentalId, rideRequestId, matchId, packageId, bookingId, type } = router.query;
        
        // Auto-detect payment type based on provided parameters
        let detectedType = type;
        if (!detectedType) {
          if (rentalId) detectedType = 'storage_rental';
          else if (rideRequestId) detectedType = 'ride_request';
          else if (matchId) detectedType = 'match';
          else if (packageId) detectedType = 'direct_package';
          else if (bookingId) detectedType = 'booking';
        }

        if (!detectedType) {
          console.error('❌ No payment type detected', router.query);
          setError('Impossible de déterminer le type de paiement. Paramètres manquants.');
          setLoading(false);
          return;
        }

        console.log('✅ Payment type detected:', detectedType);

        let endpoint = '';
        let id = '';
        
        if (detectedType === 'storage_rental' && rentalId) {
          // For box rentals, first create a payment intent
          console.log('🏠 Processing box rental payment for:', rentalId);
          const response = await fetch('/api/box-rental-payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rentalId: rentalId
            })
          });

          console.log('📡 API Response status:', response.status);

          const result = await response.json();

          if (response.ok && result.success) {
            console.log('✅ Payment Intent created successfully', {
              amount: result.amount,
              boxCode: result.rental?.box?.code
            });
            setPaymentData({
              id: rentalId,
              type: 'storage_rental',
              amount: result.amount,
              description: `Location boîte ${result.rental.box.code}`,
              rental: result.rental
            });
            setClientSecret(result.clientSecret);
          } else {
            console.error('❌ Payment Intent creation failed:', result);
            throw new Error(result.error || 'Failed to initialize payment');
          }
        } else if (detectedType === 'ride_request' && rideRequestId) {
          // For ride requests, we need to get data differently since we don't have a single endpoint
          // We'll set minimal data needed for payment processing
          setPaymentData({
            id: rideRequestId,
            type: 'ride_request',
            amount: 0, // Will be fetched by the payment API
            description: 'Paiement de trajet'
          });
        } else if (detectedType === 'match' && matchId) {
          endpoint = `/api/matches/${matchId}`;
          id = matchId;
        } else if (detectedType === 'direct_package' && packageId) {
          endpoint = `/api/packages/${packageId}`;
          id = packageId;
        } else if (detectedType === 'booking' && bookingId) {
          // For bookings, set minimal data as we don't have a single endpoint yet
          setPaymentData({
            id: bookingId,
            type: 'booking',
            amount: 0,
            description: 'Paiement de réservation'
          });
        } else {
          setError('Données de paiement invalides ou incomplètes');
          setLoading(false);
          return;
        }

        // For specific types that need API calls, fetch the data
        if (endpoint) {
          const response = await fetch(endpoint, {
            headers: {
              'x-user-id': user?.id || ''
            }
          });
          const data = await response.json();

          if (response.ok) {
            let amount = 0;
            let description = 'Paiement EcoDeli';
            
            // Extract payment info based on data type
            if (detectedType === 'match') {
              amount = data.package?.price || 0;
              description = `Livraison - ${data.package?.description || data.package?.title || 'Colis'}`;
            } else if (detectedType === 'direct_package') {
              amount = data.price || 0;
              description = `Paiement direct - ${data.description || data.title || 'Colis'}`;
            }
            
            setPaymentData({
              id: id,
              type: detectedType,
              amount: amount,
              description: description,
              ...data
            });
          } else {
            throw new Error(data.error || 'Impossible de récupérer les données de paiement');
          }
        }

      } catch (error) {
        console.error('❌ Error fetching payment data:', error);
        setError('Erreur lors du chargement des données de paiement: ' + error.message);
      } finally {
        console.log('🏁 Payment data loading finished');
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchPaymentData();
    }
  }, [router.isReady, router.query]);

  const handlePaymentSuccess = (result) => {
    setSuccess(true);
    
    setTimeout(() => {
      const dashboardUrl = user?.role === 'CUSTOMER' 
        ? '/dashboard/customer?paymentSuccess=true' 
        : '/dashboard/carrier';
      router.push(dashboardUrl);
    }, 3000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (loading) {
    console.log('🔄 Still loading payment data...');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600">Chargement des données de paiement...</p>
          <p className="mt-2 text-sm text-gray-400">Si cette page reste bloquée, vérifiez la console du navigateur</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🚨 Displaying error to user:', error);
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="flex items-center mb-4 space-x-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-xl font-bold text-red-600">Erreur de Paiement</h1>
          </div>
          <p className="mb-4 text-gray-700">{error}</p>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 mb-4 text-xs bg-gray-100 rounded">
              <p><strong>Debug Info:</strong></p>
              <p>URL: {router.asPath}</p>
              <p>Query: {JSON.stringify(router.query)}</p>
              <p>User: {user ? user.email : 'Not logged in'}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="flex justify-center items-center px-4 py-2 space-x-2 w-full text-white bg-gray-600 rounded-md hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 w-full text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 w-full max-w-md text-center bg-white rounded-lg shadow-md">
          <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-600" />
          <h1 className="mb-2 text-2xl font-bold text-green-600">Paiement Réussi !</h1>
          <p className="mb-4 text-gray-700">
            Votre paiement de {paymentData?.amount}€ a été traité avec succès.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  };

  // Debug logging before render
  console.log('🎨 Rendering payment page', {
    paymentData: paymentData ? {
      type: paymentData.type,
      amount: paymentData.amount,
      id: paymentData.id
    } : null,
    clientSecret: clientSecret ? 'Available' : 'Missing',
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing'
  });

  return (
    <div className="py-12 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-6 text-center">
            <CreditCard className="mx-auto mb-4 w-12 h-12 text-blue-600" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Paiement Sécurisé</h1>
            <p className="text-gray-600">{paymentData?.description}</p>
            <div className="p-4 mt-4 bg-blue-50 rounded-md">
              <p className="text-2xl font-bold text-blue-600">{paymentData?.amount}€</p>
            </div>
          </div>

          {/* Use secure Stripe Elements for box rentals */}
          {paymentData?.type === 'storage_rental' && clientSecret ? (
            <Elements stripe={stripePromise} options={{ ...stripeOptions, clientSecret }}>
              <PaymentForm
                paymentData={paymentData}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                clientSecret={clientSecret}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </Elements>
          ) : (
            /* Use legacy form for other payment types (to be updated later) */
            <LegacyPaymentForm
              paymentData={paymentData}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              user={user}
            />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="flex justify-center items-center mx-auto space-x-1 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>

          <div className="flex justify-center items-center mt-6 space-x-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>Paiement sécurisé par Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
} 