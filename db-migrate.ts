import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './server/db';

// This will run migrations on the database, creating tables if they don't exist
// and adding new columns based on the schema.
async function main() {
  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Migrations completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running migrations:', err);
  process.exit(1);
});