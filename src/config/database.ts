import { Client, auth } from 'cassandra-driver';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  hosts: string[];
  keyspace: string;
  username?: string | undefined;
  password?: string | undefined;
  datacenter: string;
}

// Parse hosts from .env (JSON array string)
let hosts: string[] = ['127.0.0.1:9042'];
try {
  if (process.env.SCYLLA_HOSTS) {
    hosts = JSON.parse(process.env.SCYLLA_HOSTS);
  }
} catch {
  // fallback to split if not JSON
  hosts = process.env.SCYLLA_HOSTS?.replace(/[\[\]"]+/g, '').split(',') || ['127.0.0.1:9042'];
}

export const databaseConfig: DatabaseConfig = {
  hosts,
  keyspace: process.env.SCYLLA_KEYSPACE?.replace(/"/g, '') || 'youtube_comments',
  username: process.env.SCYLLA_USERNAME?.replace(/"/g, ''),
  password: process.env.SCYLLA_PASSWORD?.replace(/"/g, ''),
  datacenter: process.env.SCYLLA_DATACENTER?.replace(/"/g, '') || 'datacenter1'
};

let client: Client | null = null;

export async function connectToDatabase(): Promise<Client> {
  if (client) {
    return client;
  }

  const clientOptions: any = {
    contactPoints: databaseConfig.hosts,
    localDataCenter: databaseConfig.datacenter,
    keyspace: databaseConfig.keyspace,
  };

  if (databaseConfig.username && databaseConfig.password) {
    clientOptions.authProvider = new auth.PlainTextAuthProvider(
      databaseConfig.username,
      databaseConfig.password
    );
  }

  client = new Client(clientOptions);

  try {
    await client.connect();
    console.log('Database connection established successfully');

    // Create keyspace if it doesn't exist
    await createKeyspace();

    // Create tables
    await createTables();

    return client;
  } catch (error) {
    console.error('Failed to connect to Scylla DB:', error);
    throw error;
  }
}

async function createKeyspace(): Promise<void> {
  if (!client) throw new Error('Database client not initialized');

  const createKeyspaceQuery = `
    CREATE KEYSPACE IF NOT EXISTS ${databaseConfig.keyspace}
    WITH replication = {
      'class': 'SimpleStrategy',
      'replication_factor': 3
    }
  `;

  await client.execute(createKeyspaceQuery);
  console.log(`Keyspace ${databaseConfig.keyspace} ensured`);
}

async function createTables(): Promise<void> {
  if (!client) throw new Error('Database client not initialized');

  // Comments table as per db-schema.cql
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS ${databaseConfig.keyspace}.comments (
      id UUID PRIMARY KEY,
      video_id TEXT,
      user_id TEXT,
      content TEXT,
      likes INT,
      dislikes INT,
      created_at TIMESTAMP,
      parent_comment_id UUID,
      reply_count INT
    )
  `;

  // Indexes
  const createVideoIdIndex = `
    CREATE INDEX IF NOT EXISTS ON ${databaseConfig.keyspace}.comments (video_id)
  `;
  const createParentCommentIdIndex = `
    CREATE INDEX IF NOT EXISTS ON ${databaseConfig.keyspace}.comments (parent_comment_id)
  `;
  const createCreatedAtIndex = `
    CREATE INDEX IF NOT EXISTS ON ${databaseConfig.keyspace}.comments (created_at)
  `;

  await client.execute(createCommentsTable);
  await client.execute(createVideoIdIndex);
  await client.execute(createParentCommentIdIndex);
  await client.execute(createCreatedAtIndex);

  console.log('Database schema initialized successfully');
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
    console.log('Database connection closed');
  }
}

export function getDatabaseClient(): Client {
  if (!client) {
    throw new Error('Database client not connected. Call connectToDatabase() first.');
  }
  return client;
}

export default {
  connect: connectToDatabase,
  disconnect: disconnectFromDatabase,
  getClient: getDatabaseClient
};