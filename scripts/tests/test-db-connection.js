// Simple test to check database connection
const { neon } = require('@neondatabase/serverless');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);

const connectionString = 'postgresql://postgres.buimypvgsqsrcasozqfx:Dorosh19882008@aws-0-us-west-1.pooler.supabase.com:6543/postgres';
console.log('Using connection string:', connectionString);

try {
  const sql = neon(connectionString);
  console.log('Database client created successfully');
} catch (error) {
  console.error('Error creating database client:', error.message);
}