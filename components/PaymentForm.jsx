import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const PaymentForm = ({ 
  onPaymentSuccess, 
  onPaymentError, 
  orderData,
  isProcessing,
  setIsProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [error, setError] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe n\'est pas encore chargé. Veuillez patienter...');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate required data before sending
      if (!orderData.merchantId) {
        throw new Error('ID du marchand manquant');
      }
      if (!orderData.customerInfo || !orderData.customerInfo.name || !orderData.customerInfo.email || !orderData.customerInfo.phone) {
        throw new Error('Informations client incomplètes');
      }
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Panier vide');
      }

      // Step 1: Submit the elements (required by Stripe before confirmPayment)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }
      
      // Step 2: Create a payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const { clientSecret, orderData: serverOrderData, paymentIntentId } = await response.json();
      setPaymentIntentId(paymentIntentId);

      // Step 3: Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment_intent=${paymentIntentId}`,
        },
        redirect: 'if_required', // Only redirect for 3D Secure if needed
      });

      if (stripeError) {
        // Handle different types of Stripe errors
        let errorMessage = 'Une erreur de paiement est survenue.';
        
        switch (stripeError.type) {
          case 'card_error':
          case 'validation_error':
            errorMessage = stripeError.message;
            break;
          case 'rate_limit_error':
            errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
            break;
          case 'invalid_request_error':
            errorMessage = 'Demande invalide. Veuillez vérifier vos informations.';
            break;
          case 'api_connection_error':
            errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
            break;
          case 'api_error':
            errorMessage = 'Erreur du serveur de paiement. Veuillez réessayer.';
            break;
          case 'authentication_error':
            errorMessage = 'Erreur d\'authentification. Veuillez réessayer.';
            break;
          default:
            errorMessage = stripeError.message || errorMessage;
        }
        
        setError(errorMessage);
        onPaymentError(stripeError);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful, now confirm on our backend
        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderData: serverOrderData
          }),
          credentials: 'include'
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.error || 'Erreur lors de la confirmation de la commande');
        }

        const confirmResult = await confirmResponse.json();
        onPaymentSuccess(confirmResult);
      } else {
        throw new Error(`Paiement non complété. Statut: ${paymentIntent.status}`);
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onPaymentError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        <CreditCard className="inline mr-2 w-5 h-5" />
        Paiement sécurisé
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stripe Payment Element */}
        <div className="space-y-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              business: {
                name: 'ecodeli'
              }
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900 dark:text-red-100 dark:border-red-800">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Erreur de paiement</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
          <Lock className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium mb-1">Paiement 100% sécurisé</p>
            <p>Vos informations de paiement sont cryptées et sécurisées par Stripe. Nous ne stockons jamais vos données bancaires.</p>
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="w-full px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 mr-2 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
              Traitement du paiement...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Finaliser le paiement
            </>
          )}
        </button>

        {/* Supported Payment Methods */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Cartes acceptées: Visa, Mastercard, American Express, Bancontact
          </p>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm; 