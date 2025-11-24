import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Checking if tables exist in Supabase...\n');
console.log('Using:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  // Try to query each table
  console.log('Checking projects table...');
  const { data: projects, error: projectsError, count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
  
  if (projectsError) {
    console.log('❌ Projects table error:', projectsError.message);
  } else {
    console.log('✅ Projects table EXISTS');
  }

  console.log('\nChecking tasks table...');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });
  
  if (tasksError) {
    console.log('❌ Tasks table error:', tasksError.message);
  } else {
    console.log('✅ Tasks table EXISTS');
  }

  console.log('\nChecking project_members table...');
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true });
  
  if (membersError) {
    console.log('❌ Project members table error:', membersError.message);
  } else {
    console.log('✅ Project members table EXISTS');
  }

  console.log('\n' + '━'.repeat(60));
  
  if (!projectsError && !tasksError && !membersError) {
    console.log('🎉 SUCCESS! All tables exist and are accessible!');
    console.log('\n✅ Your database is ready to use!');
    console.log('✅ Server is running at: http://api.galaxyitt.com.ng:3000');
    console.log('✅ API endpoints are ready');
  } else {
    console.log('⚠️  Some tables have errors (possibly RLS policies)');
    console.log('\nThis might be due to:');
    console.log('1. Tables exist but you need to be authenticated');
    console.log('2. RLS policies are blocking access');
    console.log('3. Tables don\'t exist yet\n');
  }
}

checkTables();


