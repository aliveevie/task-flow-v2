import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL must be set in .env file');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.log('━'.repeat(60));
  console.log('⚠️  Service Role Key Required');
  console.log('━'.repeat(60));
  console.log('\nTo create tables automatically, add this to your .env file:\n');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
  console.log('📍 Get your service role key from:');
  console.log('   https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/settings/api\n');
  console.log('⚠️  WARNING: Never expose this key in client-side code!\n');
  console.log('━'.repeat(60));
  process.exit(1);
}

console.log('🔧 Creating database tables with admin privileges...\n');

// Read migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

const migration1 = readFileSync(migration1Path, 'utf8');
const migration2 = readFileSync(migration2Path, 'utf8');

async function executeSqlStatements(sql, migrationName) {
  console.log(`📝 Executing ${migrationName}...`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      // If both fail, use Management API
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
      
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!mgmtResponse.ok) {
        const error = await mgmtResponse.text();
        throw new Error(`HTTP ${mgmtResponse.status}: ${error}`);
      }
      
      console.log(`✅ ${migrationName} completed!`);
      return true;
    }
    
    console.log(`✅ ${migrationName} completed!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error in ${migrationName}:`, error.message);
    return false;
  }
}

async function createTables() {
  console.log('Starting migration process...\n');
  
  // Execute migrations
  const migration1Success = await executeSqlStatements(migration1, 'Migration 1 (Create Tables)');
  
  if (!migration1Success) {
    console.log('\n⚠️  Migration 1 failed. Continuing anyway...\n');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  const migration2Success = await executeSqlStatements(migration2, 'Migration 2 (Fix Security)');
  
  if (!migration2Success) {
    console.log('\n⚠️  Migration 2 failed.\n');
  }
  
  if (migration1Success && migration2Success) {
    console.log('\n🎉 SUCCESS! All tables created!\n');
    console.log('✅ Created tables:');
    console.log('   • projects');
    console.log('   • tasks');
    console.log('   • project_members\n');
    console.log('✅ Enabled Row Level Security (RLS)');
    console.log('✅ Created all necessary policies');
    console.log('✅ Added performance indexes');
    console.log('✅ Set up automatic timestamp triggers\n');
    console.log('🚀 Your database is ready to use!\n');
  } else {
    console.log('\n━'.repeat(60));
    console.log('⚠️  Automatic creation failed. Please create tables manually:');
    console.log('━'.repeat(60));
    console.log('\n1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql\n');
    console.log('2. Copy the SQL from: server/DATABASE_SETUP.txt');
    console.log('   OR run: cat server/DATABASE_SETUP.txt\n');
    console.log('3. Paste and execute in the SQL Editor\n');
    console.log('━'.repeat(60) + '\n');
  }
}

createTables();

