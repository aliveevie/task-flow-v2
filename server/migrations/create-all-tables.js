import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server .env
dotenv.config({ path: join(__dirname, '../.env') });

const connectionString = process.env.connectiondb;

if (!connectionString) {
  console.error('❌ Error: connectiondb not found in .env file');
  process.exit(1);
}

console.log('━'.repeat(70));
console.log('🚀 SWIFT WORK BOARD - DATABASE SETUP');
console.log('━'.repeat(70));
console.log('');

async function createAllTables() {
  const client = new Client({ connectionString });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Database connected successfully!\n');

    // Start transaction
    await client.query('BEGIN');
    console.log('🔄 Starting transaction...\n');

    // ============================================================
    // 1. CREATE USERS TABLE (Authentication)
    // ============================================================
    console.log('📋 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      
      COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
      COMMENT ON COLUMN users.role IS 'User role: admin or user';
      COMMENT ON COLUMN users.is_email_verified IS 'Whether user verified their email';
      COMMENT ON COLUMN users.is_active IS 'Whether user account is active';
    `);
    console.log('✅ Users table created\n');

    // ============================================================
    // 2. CREATE USER SESSIONS TABLE
    // ============================================================
    console.log('📋 Creating user_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        refresh_token VARCHAR(255) UNIQUE,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      
      COMMENT ON TABLE user_sessions IS 'Active user login sessions';
    `);
    console.log('✅ User sessions table created\n');

    // ============================================================
    // 3. CREATE PASSWORD RESET TOKENS TABLE
    // ============================================================
    console.log('📋 Creating password_reset_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      
      COMMENT ON TABLE password_reset_tokens IS 'Tokens for password reset functionality';
    `);
    console.log('✅ Password reset tokens table created\n');

    // ============================================================
    // 4. CREATE EMAIL VERIFICATION TOKENS TABLE
    // ============================================================
    console.log('📋 Creating email_verification_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
      
      COMMENT ON TABLE email_verification_tokens IS 'Tokens for email verification';
    `);
    console.log('✅ Email verification tokens table created\n');

    // ============================================================
    // 5. CREATE PROJECTS TABLE
    // ============================================================
    console.log('📋 Creating projects table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
      
      COMMENT ON TABLE projects IS 'Projects for task management';
      COMMENT ON COLUMN projects.status IS 'Project status: active, completed, on-hold, cancelled';
    `);
    console.log('✅ Projects table created\n');

    // ============================================================
    // 6. CREATE TASKS TABLE
    // ============================================================
    console.log('📋 Creating tasks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        assigned_by TEXT,
        date_assigned DATE,
        due_date DATE,
        timelines TEXT,
        priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'not-started', 'in-progress', 'blocked', 'completed')),
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      
      COMMENT ON TABLE tasks IS 'Tasks associated with projects';
      COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, critical';
      COMMENT ON COLUMN tasks.status IS 'Task status: pending, not-started, in-progress, blocked, completed';
    `);
    console.log('✅ Tasks table created\n');

    // ============================================================
    // 7. CREATE PROJECT MEMBERS TABLE
    // ============================================================
    console.log('📋 Creating project_members table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
      
      COMMENT ON TABLE project_members IS 'Team members assigned to projects';
      COMMENT ON COLUMN project_members.role IS 'Member role in project: owner, admin, member';
    `);
    console.log('✅ Project members table created\n');

    // ============================================================
    // 8. CREATE NOTIFICATIONS TABLE
    // ============================================================
    console.log('📋 Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      
      COMMENT ON TABLE notifications IS 'User notifications for tasks and activities';
      COMMENT ON COLUMN notifications.type IS 'Notification type: task_assigned, task_completed, task_blocked, due_soon, user_invited, etc.';
    `);
    console.log('✅ Notifications table created\n');

    // ============================================================
    // 9. CREATE AUDIT LOGS TABLE
    // ============================================================
    console.log('📋 Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      
      COMMENT ON TABLE audit_logs IS 'Audit trail for security and compliance';
    `);
    console.log('✅ Audit logs table created\n');

    // ============================================================
    // 10. CREATE HELPER FUNCTIONS
    // ============================================================
    console.log('📋 Creating helper functions...');
    
    // Function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER 
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;
    `);

    // Function to clean up expired sessions
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM user_sessions WHERE expires_at < NOW();
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$;
    `);

    // Function to clean up expired tokens
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;
        DELETE FROM email_verification_tokens WHERE expires_at < NOW() AND verified_at IS NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$;
    `);

    console.log('✅ Helper functions created\n');

    // ============================================================
    // 11. CREATE TRIGGERS
    // ============================================================
    console.log('📋 Creating triggers...');
    
    const tables = ['users', 'user_sessions', 'projects', 'tasks'];
    for (const table of tables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    
    console.log('✅ Triggers created\n');

    // ============================================================
    // 12. INSERT DEFAULT ADMIN USER (for testing)
    // ============================================================
    console.log('📋 Creating default admin user...');
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_email_verified, is_active)
      VALUES (
        'admin@swiftworkboard.com',
        '$2a$10$rGXKj3wjJz9kHJX4k5qJ0OYQZpLq7zQJ5K8Ym5hX9wJZqYQzJqYQz',
        'Admin User',
        'admin',
        true,
        true
      )
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Default admin user created (email: admin@swiftworkboard.com)\n');

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully!\n');

    // Display success message
    console.log('━'.repeat(70));
    console.log('🎉 DATABASE SETUP COMPLETE!');
    console.log('━'.repeat(70));
    console.log('');
    console.log('✅ Created Tables:');
    console.log('   • users                     - User authentication & profiles');
    console.log('   • user_sessions             - Login session management');
    console.log('   • password_reset_tokens     - Password reset functionality');
    console.log('   • email_verification_tokens - Email verification');
    console.log('   • projects                  - Project management');
    console.log('   • tasks                     - Task management');
    console.log('   • project_members           - Team member assignments');
    console.log('   • notifications             - User notifications');
    console.log('   • audit_logs                - Security audit trail');
    console.log('');
    console.log('✅ Created Indexes:          25+ performance indexes');
    console.log('✅ Created Functions:        3 helper functions');
    console.log('✅ Created Triggers:         4 automatic timestamp triggers');
    console.log('');
    console.log('🔐 Default Admin Account:');
    console.log('   Email:    admin@swiftworkboard.com');
    console.log('   Password: admin123 (Please change after first login)');
    console.log('');
    console.log('📊 Database is ready for use!');
    console.log('🚀 Start your server: cd server && npm run dev');
    console.log('━'.repeat(70));

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error creating tables:', error.message);
    console.error('\n💡 Transaction rolled back. No changes were made.');
    
    if (error.code === '42P07') {
      console.log('\n📝 Note: Some tables already exist. This is normal.');
      console.log('💡 To recreate tables, drop them first or modify the script.');
    }
    
    throw error;
  } finally {
    await client.end();
    console.log('\n📡 Database connection closed.');
  }
}

// Run the migration
createAllTables().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});

