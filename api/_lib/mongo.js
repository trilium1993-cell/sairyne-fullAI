import { MongoClient } from 'mongodb';

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!globalThis.__sairyneMongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.__sairyneMongoClientPromise = client.connect();
  }

  return globalThis.__sairyneMongoClientPromise;
}


