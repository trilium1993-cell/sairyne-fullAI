import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __sairyneMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!global.__sairyneMongoClientPromise) {
    const client = new MongoClient(uri);
    global.__sairyneMongoClientPromise = client.connect();
  }

  return global.__sairyneMongoClientPromise;
}


