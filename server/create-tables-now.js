import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

console.log('🔧 Creating database tables in Supabase...\n');

// Read migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

const migration1 = readFileSync(migration1Path, 'utf8');
const migration2 = readFileSync(migration2Path, 'utf8');

console.log('📝 Migration files loaded');
console.log('🚀 Executing SQL migrations via Supabase REST API...\n');

// Execute SQL using Supabase REST API
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

// Try alternative method - direct SQL execution via postgres
async function executeViaDatabaseUrl(sql) {
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({})
  });
  
  return response;
}

// Split SQL into individual statements and execute
async function executeMigrations() {
  try {
    console.log('Method: Using Supabase Management API');
    console.log('Note: This requires proper permissions\n');
    
    // Try to execute migrations
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    
    console.log('📡 Attempting to create tables...\n');
    
    // Use fetch to call Supabase's SQL execution endpoint
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: migration1
      })
    });

    if (response.ok) {
      console.log('✅ Migration 1 executed successfully!');
      
      const response2 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: migration2
        })
      });
      
      if (response2.ok) {
        console.log('✅ Migration 2 executed successfully!');
        console.log('\n🎉 All tables created successfully!\n');
        return true;
      }
    }

    throw new Error('API method failed, trying alternative...');
    
  } catch (error) {
    console.log('⚠️  Management API requires service role key.');
    console.log('📝 Using alternative method: Supabase SQL Editor\n');
    return false;
  }
}

// Alternative: Use psql command if available
async function useSupabaseCLI() {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    // Save migrations to temp files
    const fs = await import('fs');
    fs.writeFileSync('/tmp/migration1.sql', migration1);
    fs.writeFileSync('/tmp/migration2.sql', migration2);
    
    console.log('🔧 Attempting to use Supabase CLI...\n');
    
    const { stdout, stderr } = await execAsync('cd /home/galaxy/swift-work-board && npx supabase db push 2>&1 || echo "CLI_FAILED"');
    
    if (stdout.includes('CLI_FAILED') || stderr) {
      throw new Error('CLI not available');
    }
    
    console.log('✅ Tables created via Supabase CLI!');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const apiSuccess = await executeMigrations();
  
  if (!apiSuccess) {
    const cliSuccess = await useSupabaseCLI();
    
    if (!cliSuccess) {
      console.log('━'.repeat(60));
      console.log('⚠️  Automatic table creation requires service role key');
      console.log('━'.repeat(60));
      console.log('\n📋 Please create tables manually:\n');
      console.log('1. Open: https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql');
      console.log('2. Copy and paste the following SQL:\n');
      console.log('━'.repeat(60));
      console.log(migration1);
      console.log('\n' + '━'.repeat(60) + '\n');
      console.log('3. Then run this second migration:\n');
      console.log('━'.repeat(60));
      console.log(migration2);
      console.log('━'.repeat(60));
      console.log('\n✅ After running both, your tables will be ready!\n');
    }
  }
})();

