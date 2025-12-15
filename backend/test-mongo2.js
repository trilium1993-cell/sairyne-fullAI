import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://sairyne_app:vgJOT25AhEfr4IHq@sairynereg.7b4p81m.mongodb.net/?appName=Sairynereg&retryWrites=true&w=majority';

console.log('🔍 Attempting to connect to MongoDB (attempt 2)...');
console.log(`URI: ${mongoUri.replace(/:[^:]*@/, ':***@')}`);

try {
  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
  });
  
  console.log('✅ MongoDB connected successfully!');
  const admin = mongoose.connection.db.admin();
  const databases = await admin.listDatabases();
  console.log('📊 Available databases:', databases.databases.map(d => d.name));
  
  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:');
  console.error('Error:', error.message);
  console.error('Code:', error.codeName || error.code);
  console.error('Full error:', error);
  process.exit(1);
}
