import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up database tables...\n');

  try {
    // Read SQL migration files
    const migrationsDir = join(__dirname, '../supabase/migrations');
    
    // Migration 1: Create tables
    console.log('📝 Reading migration files...');
    const migration1Path = join(migrationsDir, '20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
    const migration2Path = join(migrationsDir, '20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');
    
    const migration1 = readFileSync(migration1Path, 'utf8');
    const migration2 = readFileSync(migration2Path, 'utf8');

    console.log('✅ Migration files loaded\n');

    // Execute migrations using Supabase client
    console.log('🚀 Executing migrations...');
    console.log('Note: Using Supabase anon key has limited permissions.');
    console.log('For full database setup, please run migrations via Supabase CLI:\n');
    console.log('  cd /home/galaxy/swift-work-board');
    console.log('  npx supabase db reset\n');
    console.log('Or apply migrations manually in Supabase Dashboard SQL Editor.\n');

    // Test database connection and check if tables exist
    console.log('🔍 Checking database connection and tables...\n');

    // Check projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count');

    if (projectsError) {
      console.log('⚠️  Projects table check:', projectsError.message);
    } else {
      console.log('✅ Projects table is accessible');
    }

    // Check tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('count');

    if (tasksError) {
      console.log('⚠️  Tasks table check:', tasksError.message);
    } else {
      console.log('✅ Tasks table is accessible');
    }

    // Check project_members table
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('count');

    if (membersError) {
      console.log('⚠️  Project members table check:', membersError.message);
    } else {
      console.log('✅ Project members table is accessible');
    }

    console.log('\n📋 Database Setup Summary:');
    console.log('===========================');
    console.log('Tables to be created:');
    console.log('  1. projects - Store project information');
    console.log('  2. tasks - Store tasks for projects');
    console.log('  3. project_members - Store project team members');
    console.log('\nRow Level Security (RLS) policies will be enabled.');
    console.log('Triggers for automatic updated_at timestamps will be created.\n');

    if (projectsError || tasksError || membersError) {
      console.log('⚠️  Some tables may not exist yet.');
      console.log('\n🔧 To create tables, use one of these methods:\n');
      console.log('Method 1 - Supabase CLI (Recommended):');
      console.log('  1. Install Supabase CLI: npm install -g supabase');
      console.log('  2. Login: npx supabase login');
      console.log('  3. Link project: npx supabase link --project-ref imfgwymvdncqrzvzztzy');
      console.log('  4. Push migrations: npx supabase db push\n');
      console.log('Method 2 - Supabase Dashboard:');
      console.log('  1. Go to: https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql');
      console.log('  2. Copy content from: supabase/migrations/20251030154318_36f2c976-e67d-4b8c-99b8-2df5ac09ce96.sql');
      console.log('  3. Paste and run in SQL Editor');
      console.log('  4. Copy content from: supabase/migrations/20251030154457_895afa93-c108-4e08-8285-40452939f37d.sql');
      console.log('  5. Paste and run in SQL Editor\n');
    } else {
      console.log('✅ All tables are already set up and accessible!\n');
    }

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase();


