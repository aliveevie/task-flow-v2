import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'imfgwymvdncqrzvzztzy';

console.log('🔧 Creating tables using Supabase Management API (v1)...\n');

// Read migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

const migration1 = readFileSync(migration1Path, 'utf8');
const migration2 = readFileSync(migration2Path, 'utf8');

async function executeSQL(sql, name) {
  console.log(`📝 Executing ${name}...`);
  
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${name} completed successfully!`);
      return true;
    } else {
      console.error(`❌ ${name} failed:`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in ${name}:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('Using Supabase Management API...\n');
  console.log('Service Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 30)}...` : 'NOT FOUND');
  console.log('');

  const success1 = await executeSQL(migration1, 'Migration 1 (Create Tables)');
  
  if (!success1) {
    console.log('\n⚠️  Migration 1 failed. Stopping...\n');
    process.exit(1);
  }

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

  const success2 = await executeSQL(migration2, 'Migration 2 (Fix Security)');

  if (success2) {
    console.log('\n' + '━'.repeat(70));
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
  } else {
    console.log('\n⚠️  Migration 2 failed.\n');
    process.exit(1);
  }
}

runMigrations();


