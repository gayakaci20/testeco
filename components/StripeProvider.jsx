import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const StripeProvider = ({ children, amount, currency = 'eur' }) => {
  const options = {
    mode: 'payment',
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0ea5e9', // sky-500
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: '"Inter", system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Tab': {
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '12px',
        },
        '.Tab--selected': {
          borderColor: '#0ea5e9',
          backgroundColor: '#eff6ff',
        },
        '.Input': {
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          padding: '12px',
          fontSize: '16px',
        },
        '.Input:focus': {
          borderColor: '#0ea5e9',
          boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px',
          color: '#374151',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider; 