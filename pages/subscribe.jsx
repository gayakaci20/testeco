import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Crown,
  Package,
  Car,
  MessageCircle,
  TrendingUp,
  Users
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ clientSecret, subscription, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe n\'est pas encore chargé. Veuillez patienter...');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm subscription activation
        const response = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            subscriptionId: subscription.id
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          onPaymentSuccess(result);
        } else {
          throw new Error(result.error || 'Erreur lors de l\'activation de l\'abonnement');
        }
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
        className="flex justify-center items-center px-4 py-3 space-x-2 w-full text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
            <span>Traitement en cours...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>S'abonner pour 10€/mois</span>
          </>
        )}
      </button>
    </form>
  );
};

export default function SubscribePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !['PROVIDER', 'SERVICE_PROVIDER', 'CARRIER'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      checkSubscriptionStatus();
    }
  }, [user, loading, router]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        
        if (data.hasActiveSubscription) {
          // User already has active subscription, redirect to dashboard
          const dashboardUrl = user.role === 'CARRIER' ? '/dashboard/carrier' : '/dashboard/provider';
          router.push(dashboardUrl);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClientSecret(data.clientSecret);
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Erreur lors de la création de l\'abonnement');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Erreur lors de la création de l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    setSuccess(true);
    setTimeout(() => {
      const dashboardUrl = user.role === 'CARRIER' ? '/dashboard/carrier' : '/dashboard/provider';
      router.push(dashboardUrl);
    }, 3000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="flex items-center mb-4 space-x-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-xl font-bold text-red-600">Erreur</h1>
          </div>
          <p className="mb-4 text-gray-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="flex justify-center items-center px-4 py-2 space-x-2 w-full text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 w-full max-w-md text-center bg-white rounded-lg shadow-md">
          <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-600" />
          <h1 className="mb-2 text-2xl font-bold text-green-600">Abonnement Activé !</h1>
          <p className="mb-4 text-gray-700">
            Votre abonnement professionnel est maintenant actif. Vous pouvez accéder à toutes les fonctionnalités.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Head>
        <title>S'abonner - ecodeli</title>
        <meta name="description" content="Abonnement professionnel ecodeli" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <div className="mx-auto max-w-4xl px-6">
        {!clientSecret ? (
          // Subscription overview and call-to-action
          <>
            <div className="mb-8 text-center">
              <Crown className="mx-auto mb-4 w-16 h-16 text-yellow-500" />
              <h1 className="mb-4 text-4xl font-bold text-gray-900">
                Abonnement Professionnel
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Accédez à toutes les fonctionnalités d'ecodeli pour développer votre activité
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Features */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Fonctionnalités incluses
                </h2>
                
                <div className="space-y-4">
                  {[
                    {
                      icon: Package,
                      title: 'Services illimités',
                      description: 'Créez et gérez autant de services que vous voulez'
                    },
                    {
                      icon: Car,
                      title: 'Annonces de transport',
                      description: 'Publiez vos trajets et trouvez des colis à livrer'
                    },
                    {
                      icon: MessageCircle,
                      title: 'Messagerie premium',
                      description: 'Communication directe avec vos clients'
                    },
                    {
                      icon: TrendingUp,
                      title: 'Statistiques avancées',
                      description: 'Suivez vos performances et vos gains'
                    },
                    {
                      icon: Users,
                      title: 'Support prioritaire',
                      description: 'Assistance dédiée pour les professionnels'
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="text-center mb-8">
                  <h2 className="mb-2 text-2xl font-bold">Plan Professionnel</h2>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">10€</span>
                    <span className="text-xl">/mois</span>
                  </div>
                  <p className="text-blue-100">
                    Facturé mensuellement • Sans engagement
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Accès complet à toutes les fonctionnalités</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Paiements sécurisés avec Stripe</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Résiliation possible à tout moment</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Création en cours...' : 'S\'abonner maintenant'}
                </button>

                <p className="mt-4 text-sm text-center text-blue-100">
                  Paiement sécurisé • Annulation facile
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.back()}
                className="flex items-center mx-auto space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour au tableau de bord</span>
              </button>
            </div>
          </>
        ) : (
          // Payment form
          <div className="mx-auto max-w-md">
            <div className="p-8 bg-white rounded-2xl shadow-xl">
              <div className="mb-6 text-center">
                <CreditCard className="mx-auto mb-4 w-12 h-12 text-blue-600" />
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Finaliser l'abonnement</h1>
                <p className="text-gray-600">Abonnement Professionnel</p>
                <div className="p-4 mt-4 bg-blue-50 rounded-md">
                  <p className="text-2xl font-bold text-blue-600">10€/mois</p>
                </div>
              </div>

              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  subscription={subscription}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </Elements>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setClientSecret(null);
                    setSubscription(null);
                  }}
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
        )}
      </div>
    </div>
  );
} 