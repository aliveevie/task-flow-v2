import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

const connectionString = process.env.connectiondb;

if (!connectionString) {
  console.error('❌ ERROR: connectiondb not found in .env file');
  process.exit(1);
}

async function fixTokenColumns() {
  const client = new Client({ connectionString });

  try {
    console.log('━'.repeat(70));
    console.log('🔧 FIXING TOKEN COLUMNS - Migrating VARCHAR(255) to TEXT');
    console.log('━'.repeat(70));
    console.log('');

    await client.connect();
    console.log('✅ Connected to database\n');

    // Fix user_sessions table
    try {
      console.log('📋 Checking user_sessions table...');
      const check = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        AND column_name IN ('session_token', 'refresh_token');
      `);

      for (const col of check.rows) {
        if (col.data_type === 'character varying' && col.character_maximum_length === 255) {
          console.log(`   Migrating ${col.column_name} from VARCHAR(255) to TEXT...`);
          await client.query(`ALTER TABLE user_sessions ALTER COLUMN ${col.column_name} TYPE TEXT;`);
          console.log(`   ✅ ${col.column_name} migrated to TEXT`);
        } else {
          console.log(`   ✅ ${col.column_name} is already TEXT`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error fixing user_sessions:`, error.message);
    }

    // Fix password_reset_tokens table
    try {
      console.log('\n📋 Checking password_reset_tokens table...');
      const check = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'password_reset_tokens' 
        AND column_name = 'token';
      `);

      if (check.rows.length > 0) {
        const col = check.rows[0];
        if (col.data_type === 'character varying' && col.character_maximum_length === 255) {
          console.log(`   Migrating token from VARCHAR(255) to TEXT...`);
          await client.query(`ALTER TABLE password_reset_tokens ALTER COLUMN token TYPE TEXT;`);
          console.log(`   ✅ token migrated to TEXT`);
        } else {
          console.log(`   ✅ token is already TEXT`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error fixing password_reset_tokens:`, error.message);
    }

    // Fix email_verification_tokens table
    try {
      console.log('\n📋 Checking email_verification_tokens table...');
      const check = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'email_verification_tokens' 
        AND column_name = 'token';
      `);

      if (check.rows.length > 0) {
        const col = check.rows[0];
        if (col.data_type === 'character varying' && col.character_maximum_length === 255) {
          console.log(`   Migrating token from VARCHAR(255) to TEXT...`);
          await client.query(`ALTER TABLE email_verification_tokens ALTER COLUMN token TYPE TEXT;`);
          console.log(`   ✅ token migrated to TEXT`);
        } else {
          console.log(`   ✅ token is already TEXT`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error fixing email_verification_tokens:`, error.message);
    }

    // Fix project_invitations table
    try {
      console.log('\n📋 Checking project_invitations table...');
      const check = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'project_invitations' 
        AND column_name = 'invitation_token';
      `);

      if (check.rows.length > 0) {
        const col = check.rows[0];
        if (col.data_type === 'character varying' && col.character_maximum_length === 255) {
          console.log(`   Migrating invitation_token from VARCHAR(255) to TEXT...`);
          await client.query(`ALTER TABLE project_invitations ALTER COLUMN invitation_token TYPE TEXT;`);
          console.log(`   ✅ invitation_token migrated to TEXT`);
        } else {
          console.log(`   ✅ invitation_token is already TEXT`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error fixing project_invitations:`, error.message);
    }

    console.log('\n━'.repeat(70));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('━'.repeat(70));
    console.log('\n💡 You can now restart your server and login should work!');
    console.log('');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
fixTokenColumns();

