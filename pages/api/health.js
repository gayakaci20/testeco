/**
 * Health check endpoint for diagnostic purposes
 */

export default function handler(req, res) {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    stripe: {
      secret_key: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
      publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'missing'
    },
    database: process.env.DATABASE_URL ? 'configured' : 'missing',
    jwt: process.env.JWT_SECRET ? 'configured' : 'missing'
  };

  res.status(200).json(health);
} 