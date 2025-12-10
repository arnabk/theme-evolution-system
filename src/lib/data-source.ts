import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Theme } from './entities/Theme';
import { Response } from './entities/Response';
import { Session } from './entities/Session';

// Singleton instance
let dataSource: DataSource | null = null;
let initializationPromise: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
  // If already initialized, return immediately
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializeDataSource();
  
  try {
    dataSource = await initializationPromise;
    return dataSource;
  } finally {
    // Clear promise after completion (success or failure)
    initializationPromise = null;
  }
}

async function initializeDataSource(): Promise<DataSource> {
  // Use data directory if specified (for Docker), otherwise use current directory
  const dataDir = process.env.DATA_DIR || './data';
  const dbPath = dataDir.endsWith('.db') 
    ? dataDir 
    : `${dataDir}/theme-evolution.db`;
  
  // Ensure directory exists (for Docker volumes)
  if (dataDir && !dataDir.endsWith('.db')) {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {
      // Ignore if directory already exists
    }
  }
  
  const newDataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    synchronize: true,
    logging: false,
    entities: [Theme, Response, Session],
    // Disable automatic transactions to avoid nested transaction issues
    maxQueryExecutionTime: 5000,
  });

  await newDataSource.initialize();
  console.log('✅ Database connected and synchronized');
  
  return newDataSource;
}
