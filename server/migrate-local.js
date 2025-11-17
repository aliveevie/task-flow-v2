import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local PostgreSQL connection string with password
const LOCAL_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/swift_work_board';

console.log('🔧 Setting up local PostgreSQL database...\n');
console.log('Connection:', LOCAL_DB_URL.replace(/:[^:@]*@/, ':****@'));
console.log('');

async function setupDatabase() {
  // First, connect to the default 'postgres' database to create our database
  const defaultDbUrl = LOCAL_DB_URL.replace('/swift_work_board', '/postgres');
  const setupClient = new Client({ connectionString: defaultDbUrl });

  try {
    await setupClient.connect();
    console.log('✅ Connected to PostgreSQL server\n');

    // Create database if it doesn't exist
    console.log('📝 Creating database "swift_work_board" if it doesn\'t exist...');
    try {
      await setupClient.query('CREATE DATABASE swift_work_board;');
      console.log('✅ Database created!\n');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Database already exists!\n');
      } else {
        throw error;
      }
    }
    
    await setupClient.end();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.log('\n💡 Make sure PostgreSQL is running and accessible.');
    console.log('   Default connection: postgresql://postgres:postgres@localhost:5432/postgres');
    console.log('\n   Or set DATABASE_URL environment variable:\n');
    console.log('   export DATABASE_URL="postgresql://username:password@localhost:5432/swift_work_board"\n');
    process.exit(1);
  }
}

async function runMigrations() {
  await setupDatabase();

  // Now connect to our database
  const client = new Client({ connectionString: LOCAL_DB_URL });

  try {
    await client.connect();
    console.log('✅ Connected to swift_work_board database\n');

    // Read migration files
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
    const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

    let migration1 = readFileSync(migration1Path, 'utf8');
    let migration2 = readFileSync(migration2Path, 'utf8');

    // Remove Supabase-specific auth.users references for local setup
    console.log('📝 Adapting migrations for local PostgreSQL...');
    migration1 = migration1.replace(/REFERENCES auth\.users\(id\)/g, '');
    migration1 = migration1.replace(/auth\.uid\(\)/g, 'current_user');
    
    console.log('');

    console.log('📝 Running Migration 1: Create Tables...');
    await client.query(migration1);
    console.log('✅ Migration 1 completed!\n');

    console.log('📝 Running Migration 2: Fix Security...');
    await client.query(migration2);
    console.log('✅ Migration 2 completed!\n');

    console.log('━'.repeat(70));
    console.log('🎉 SUCCESS! Local database is ready!\n');
    console.log('✅ Created tables:');
    console.log('   • projects');
    console.log('   • tasks');
    console.log('   • project_members\n');
    console.log('✅ Created all necessary policies');
    console.log('✅ Added performance indexes');
    console.log('✅ Set up automatic timestamp triggers\n');
    console.log('📊 Connection string: ' + LOCAL_DB_URL.replace(/:[^:@]*@/, ':****@'));
    console.log('━'.repeat(70));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n✅ Tables already exist! Checking...');
      const { rows } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('projects', 'tasks', 'project_members')
        ORDER BY table_name
      `);
      console.log('   Found tables:', rows.map(r => r.table_name).join(', '));
      console.log('\n🎉 Database is ready!');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

runMigrations();

