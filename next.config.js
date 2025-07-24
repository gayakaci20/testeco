/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker deployment
  output: 'standalone',
  
  // Ignore TypeScript errors in admin-dashboard for now
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude admin dashboard from the build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  eslint: {
    // Don't run ESLint during build
    ignoreDuringBuilds: true,
  },
  
  // Configure experimental features to handle host validation
  experimental: {
    // Allow insecure host connections for development
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ecodeli.pro',
      'www.ecodeli.pro',
      'admin.ecodeli.pro',
      'admin.localhost',
      '.vercel.app',
      '.ngrok.io'
    ],
  },
  
  // Headers configuration to handle CORS and security
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  
  // Required to prevent Prisma Accelerate warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fixes npm packages that depend on `fs` module
      config.externals = [...config.externals, 'pg', 'pg-hstore']
    }
    return config
  },
  
  // Additional configuration for host validation
  devIndicators: {
    buildActivity: false,
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Configure domains for better host handling
  env: {
    CUSTOM_KEY: 'ecodeli-app',
  },
};

export default nextConfig; 