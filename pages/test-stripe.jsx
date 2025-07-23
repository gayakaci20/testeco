import { useState } from 'react';
import Head from 'next/head';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
import RoleBasedNavigation from '../components/RoleBasedNavigation';

export default function TestStripe({ isDarkMode, toggleDarkMode }) {
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setError(null);
    console.log('Payment success:', result);
  };

  const handlePaymentError = (error) => {
    setError(error);
    setPaymentResult(null);
    console.error('Payment error:', error);
  };

  const testOrderData = {
    merchantId: 'test-merchant',
    items: [
      {
        productId: 'test-product-1',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 15.99
      }
    ],
    delivery: {
      wantsDelivery: true,
      address: '123 Test Street, Paris',
      timeSlot: 'morning',
      instructions: 'Test delivery instructions'
    },
    subtotal: 31.98,
    deliveryFee: 5.99,
    total: 37.97
  };

  const testCustomerInfo = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+33123456789'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Test Stripe Integration - ecodeli</title>
        <meta name="description" content="Test Stripe payment integration" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-6 py-8 mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-center text-gray-900 dark:text-white">
          Test Stripe Integration
        </h1>

        {/* Test Order Summary */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Test Order
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Test Product × 2</span>
              <span>€31.98</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>€5.99</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold border-t">
              <span>Total</span>
              <span>€37.97</span>
            </div>
          </div>
        </div>

        {/* Stripe Payment Form */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Payment Test
          </h2>
          
          <StripeProvider>
            <PaymentForm
              amount={37.97}
              currency="eur"
              customerInfo={testCustomerInfo}
              orderData={testOrderData}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </StripeProvider>
        </div>

        {/* Results */}
        {paymentResult && (
          <div className="p-6 mt-6 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-300">
              Payment Successful!
            </h3>
            <pre className="text-sm text-green-700 dark:text-green-400 overflow-auto">
              {JSON.stringify(paymentResult, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="p-6 mt-6 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
              Payment Error
            </h3>
            <p className="text-red-700 dark:text-red-400">
              {error.message}
            </p>
          </div>
        )}

        {/* Test Instructions */}
        <div className="p-6 mt-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <h3 className="mb-2 text-lg font-semibold text-blue-800 dark:text-blue-300">
            Test Instructions
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
            <p><strong>Test Cards:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Success:</strong> 4242 4242 4242 4242</li>
              <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
              <li><strong>3D Secure:</strong> 4000 0027 6000 3184</li>
            </ul>
            <p><strong>Expiry:</strong> Any future date (e.g., 12/25)</p>
            <p><strong>CVC:</strong> Any 3 digits (e.g., 123)</p>
          </div>
        </div>
      </div>
    </div>
  );
} 