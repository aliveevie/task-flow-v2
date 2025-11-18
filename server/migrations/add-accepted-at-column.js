import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'taskflow'}`;

async function addAcceptedAtColumn() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_invitations' 
      AND column_name = 'accepted_at'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Column accepted_at already exists in project_invitations table');
      console.log('   No migration needed.\n');
      return;
    }

    // Add the column
    console.log('📝 Adding accepted_at column to project_invitations table...');
    await client.query(`
      ALTER TABLE project_invitations 
      ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE
    `);

    console.log('✅ Successfully added accepted_at column to project_invitations table\n');
    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') {
      console.log('   (Column may already exist)');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAcceptedAtColumn();

