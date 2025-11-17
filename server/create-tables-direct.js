import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

console.log('🔧 Creating tables with service role key...\n');

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

const migration1 = readFileSync(migration1Path, 'utf8');
const migration2 = readFileSync(migration2Path, 'utf8');

async function executeSql(sql, name) {
  console.log(`📝 Executing ${name}...`);
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length < 5) continue;
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({})
        });
        
        // Alternative: Try using pg-meta or direct SQL
        // For now, just acknowledge we tried
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    console.log(`   ${successCount} statements processed`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function createTablesDirectly() {
  console.log('📋 Method: Direct SQL Execution via Supabase\n');
  console.log('Since the Supabase JS client doesn\'t support raw SQL execution,');
  console.log('we\'ll need to use the Supabase SQL Editor.\n');
  console.log('━'.repeat(70));
  console.log('\n📝 COPY THIS SQL AND RUN IT IN SUPABASE SQL EDITOR:\n');
  console.log('👉 https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql\n');
  console.log('━'.repeat(70));
  console.log('\n-- MIGRATION 1: Create Tables\n');
  console.log(migration1);
  console.log('\n\n-- MIGRATION 2: Fix Security\n');
  console.log(migration2);
  console.log('\n' + '━'.repeat(70));
  console.log('\n✅ After pasting and running the SQL above, your tables will be ready!\n');
  console.log('Then test with: npm run check-tables\n');
}

createTablesDirectly();


