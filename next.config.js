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
  // Required to prevent Prisma Accelerate warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fixes npm packages that depend on `fs` module
      config.externals = [...config.externals, 'pg', 'pg-hstore']
    }
    return config
  }
};

export default nextConfig; 