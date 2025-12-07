import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress TypeORM warnings for unused database drivers
      config.externals = [
        ...(config.externals || []),
        'react-native-sqlite-storage',
        '@sap/hana-client',
        '@sap/hana-client/extension/Stream',
        'hdb-pool',
        'mysql',
        'mysql2',
        'oracledb',
        'pg-native',
        'pg-query-stream',
        'redis',
        'ioredis',
        'mongodb',
        'sql.js',
        'typeorm-aurora-data-api-driver',
      ];
    }
    
    // Ignore critical dependency warnings from TypeORM
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    return config;
  },
};

export default nextConfig;

