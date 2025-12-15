import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://sairyne_app:vgJOT25AhEfr4IHq@sairynereg.7b4p81m.mongodb.net/?appName=Sairynereg';

console.log('🔍 Attempting to connect to MongoDB...');
console.log(`URI: ${mongoUri.replace(/:[^:]*@/, ':***@')}`);

try {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  
  console.log('✅ MongoDB connected successfully!');
  const admin = mongoose.connection.db.admin();
  const databases = await admin.listDatabases();
  console.log('📊 Available databases:', databases.databases.map(d => d.name));
  
  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:');
  console.error('Message:', error.message);
  console.error('Code:', error.codeName || error.code);
  if (error.reason) {
    console.error('Reason:', error.reason);
  }
  process.exit(1);
}
