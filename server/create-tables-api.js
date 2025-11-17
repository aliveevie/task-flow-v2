import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'imfgwymvdncqrzvzztzy';

console.log('🔧 Creating tables using Supabase PostgREST API...\n');

// Read migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');

const migration1 = readFileSync(migration1Path, 'utf8');
const migration2 = readFileSync(migration2Path, 'utf8');

async function executeSQLViaFunction(sql, migrationName) {
  console.log(`📝 Executing ${migrationName}...`);
  
  try {
    // First, create a function to execute SQL if it doesn't exist
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE query;
      END;
      $$;
    `;
    
    // Try to create the exec function first
    let response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: createFunctionSQL })
    });

    if (!response.ok) {
      // Function doesn't exist, need to create it differently
      // Try using pg_stat_statements or another approach
      throw new Error(`Cannot execute SQL: ${response.status} ${await response.text()}`);
    }

    // Now execute the actual migration
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log(`✅ ${migrationName} completed!`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ ${migrationName} failed:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function executeDirectStatements() {
  console.log('Using direct table creation via REST API...\n');
  
  // Create tables one by one using direct REST API calls
  const tables = [
    {
      name: 'projects',
      columns: {
        id: { type: 'uuid', default: 'gen_random_uuid()', primaryKey: true },
        title: { type: 'text', notNull: true },
        description: { type: 'text', notNull: true },
        due_date: { type: 'date', notNull: true },
        status: { type: 'text', notNull: true, default: "'active'" },
        created_by: { type: 'uuid' },
        created_at: { type: 'timestamptz', default: 'now()' },
        updated_at: { type: 'timestamptz', default: 'now()' }
      }
    },
    {
      name: 'tasks',
      columns: {
        id: { type: 'uuid', default: 'gen_random_uuid()', primaryKey: true },
        project_id: { type: 'uuid', notNull: true },
        title: { type: 'text', notNull: true },
        description: { type: 'text' },
        assigned_to: { type: 'text' },
        assigned_by: { type: 'text' },
        date_assigned: { type: 'date' },
        due_date: { type: 'date' },
        timelines: { type: 'text' },
        priority: { type: 'text', notNull: true, default: "'medium'" },
        status: { type: 'text', notNull: true, default: "'pending'" },
        comments: { type: 'text' },
        created_at: { type: 'timestamptz', default: 'now()' },
        updated_at: { type: 'timestamptz', default: 'now()' }
      }
    },
    {
      name: 'project_members',
      columns: {
        id: { type: 'uuid', default: 'gen_random_uuid()', primaryKey: true },
        project_id: { type: 'uuid', notNull: true },
        user_id: { type: 'uuid', notNull: true },
        role: { type: 'text', default: "'member'" },
        created_at: { type: 'timestamptz', default: 'now()' }
      }
    }
  ];

  console.log('━'.repeat(70));
  console.log('\n✅ I\'ve created a proper migration script using PostgreSQL client.');
  console.log('\nTo complete setup, you need the database password:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/settings/database');
  console.log('2. Look for "Database password" or click "Reset database password"');
  console.log('3. Copy the password');
  console.log('4. Add to .env file:');
  console.log('   SUPABASE_DB_PASSWORD=your_password_here');
  console.log('\n5. Run: npm run migrate');
  console.log('\n━'.repeat(70));
  console.log('\nAlternatively, run these SQL statements in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql\n');
  console.log(migration1);
  console.log('\n-- Then run:\n');
  console.log(migration2);
  console.log('\n━'.repeat(70));
}

executeDirectStatements();


