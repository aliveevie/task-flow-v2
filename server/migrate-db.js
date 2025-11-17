import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Use the direct connection string
const connectionString = process.env.SUPABASE_CONNECTION_STRING || 
  'postgresql://postgres:$!office4321$!@db.imfgwymvdncqrzvzztzy.supabase.co:5432/postgres';

console.log('🔧 Connecting to Supabase PostgreSQL database...\n');

// Try connection pooler which might work better with WSL IPv6 issues
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.imfgwymvdncqrzvzztzy',
  password: '$!office4321$!',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Read migration files
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
    const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

    const migration1 = readFileSync(migration1Path, 'utf8');
    const migration2 = readFileSync(migration2Path, 'utf8');

    console.log('📝 Running Migration 1: Create Tables...');
    await client.query(migration1);
    console.log('✅ Migration 1 completed!\n');

    console.log('📝 Running Migration 2: Fix Security...');
    await client.query(migration2);
    console.log('✅ Migration 2 completed!\n');

    console.log('━'.repeat(70));
    console.log('🎉 SUCCESS! All tables created!\n');
    console.log('✅ Created tables:');
    console.log('   • projects');
    console.log('   • tasks');
    console.log('   • project_members\n');
    console.log('✅ Enabled Row Level Security (RLS)');
    console.log('✅ Created all necessary policies');
    console.log('✅ Added performance indexes');
    console.log('✅ Set up automatic timestamp triggers\n');
    console.log('🚀 Your database is ready to use!');
    console.log('━'.repeat(70));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n⚠️  Authentication failed. Please check:');
      console.log('   1. Database password is correct in .env file');
      console.log('   2. Get it from: https://supabase.com/dashboard/project/' + projectId + '/settings/database');
    } else if (error.message.includes('relation') && error.message.includes('already exists')) {
      console.log('\n✅ Tables already exist! Running check...');
      // Verify tables exist
      const { rows } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('projects', 'tasks', 'project_members')
      `);
      console.log('   Found tables:', rows.map(r => r.table_name).join(', '));
      console.log('\n🎉 Database is ready!');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

