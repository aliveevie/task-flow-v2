import pg from 'pg';

const { Client } = pg;

/**
 * Create all database tables for local PostgreSQL
 * This function creates tables one by one without transactions to avoid permission issues
 */
export async function createTablesLocally(db) {
  if (!db) {
    throw new Error('Database connection is required');
  }

  const tablesCreated = [];
  const errors = [];

  try {
    console.log('━'.repeat(70));
    console.log('🔧 CREATING DATABASE TABLES (Local PostgreSQL)...');
    console.log('━'.repeat(70));

    // 1. CREATE USERS TABLE
    try {
      console.log('📋 Creating users table...');
      await db.query(`
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
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);');
      console.log('✅ Users table created');
      tablesCreated.push('users');
    } catch (error) {
      if (error.code !== '42P07') { // 42P07 = table already exists
        console.error('❌ Error creating users table:', error.message);
        errors.push({ table: 'users', error: error.message });
      } else {
        console.log('✅ Users table already exists');
        tablesCreated.push('users');
      }
    }

    // 2. CREATE USER SESSIONS TABLE
    try {
      console.log('📋 Creating user_sessions table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          refresh_token TEXT UNIQUE,
          ip_address INET,
          user_agent TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);');
      console.log('✅ User sessions table created');
      tablesCreated.push('user_sessions');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating user_sessions table:', error.message);
        errors.push({ table: 'user_sessions', error: error.message });
      } else {
        console.log('✅ User sessions table already exists');
        tablesCreated.push('user_sessions');
      }
    }

    // 3. CREATE PASSWORD RESET TOKENS TABLE
    try {
      console.log('📋 Creating password_reset_tokens table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);');
      console.log('✅ Password reset tokens table created');
      tablesCreated.push('password_reset_tokens');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating password_reset_tokens table:', error.message);
        errors.push({ table: 'password_reset_tokens', error: error.message });
      } else {
        console.log('✅ Password reset tokens table already exists');
        tablesCreated.push('password_reset_tokens');
      }
    }

    // 4. CREATE EMAIL VERIFICATION TOKENS TABLE
    try {
      console.log('📋 Creating email_verification_tokens table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          verified_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);');
      console.log('✅ Email verification tokens table created');
      tablesCreated.push('email_verification_tokens');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating email_verification_tokens table:', error.message);
        errors.push({ table: 'email_verification_tokens', error: error.message });
      } else {
        console.log('✅ Email verification tokens table already exists');
        tablesCreated.push('email_verification_tokens');
      }
    }

    // 5. CREATE PROJECTS TABLE
    try {
      console.log('📋 Creating projects table...');
      await db.query(`
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
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);');
      console.log('✅ Projects table created');
      tablesCreated.push('projects');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating projects table:', error.message);
        errors.push({ table: 'projects', error: error.message });
      } else {
        console.log('✅ Projects table already exists');
        tablesCreated.push('projects');
      }
    }

    // 6. CREATE TASKS TABLE
    try {
      console.log('📋 Creating tasks table...');
      await db.query(`
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
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);');
      console.log('✅ Tasks table created');
      tablesCreated.push('tasks');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating tasks table:', error.message);
        errors.push({ table: 'tasks', error: error.message });
      } else {
        console.log('✅ Tasks table already exists');
        tablesCreated.push('tasks');
      }
    }

    // 7. CREATE PROJECT MEMBERS TABLE
    try {
      console.log('📋 Creating project_members table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS project_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id, user_id)
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);');
      console.log('✅ Project members table created');
      tablesCreated.push('project_members');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating project_members table:', error.message);
        errors.push({ table: 'project_members', error: error.message });
      } else {
        console.log('✅ Project members table already exists');
        tablesCreated.push('project_members');
      }
    }

    // 8. CREATE NOTIFICATIONS TABLE
    try {
      console.log('📋 Creating notifications table...');
      await db.query(`
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
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);');
      console.log('✅ Notifications table created');
      tablesCreated.push('notifications');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating notifications table:', error.message);
        errors.push({ table: 'notifications', error: error.message });
      } else {
        console.log('✅ Notifications table already exists');
        tablesCreated.push('notifications');
      }
    }

    // 9. CREATE AUDIT LOGS TABLE
    try {
      console.log('📋 Creating audit_logs table...');
      await db.query(`
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
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);');
      console.log('✅ Audit logs table created');
      tablesCreated.push('audit_logs');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating audit_logs table:', error.message);
        errors.push({ table: 'audit_logs', error: error.message });
      } else {
        console.log('✅ Audit logs table already exists');
        tablesCreated.push('audit_logs');
      }
    }

    // 10. CREATE PROJECT INVITATIONS TABLE
    try {
      console.log('📋 Creating project_invitations table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS project_invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          invitee_email VARCHAR(255) NOT NULL,
          invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
          invitation_token TEXT UNIQUE NOT NULL,
          message TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_invitations_inviter_id ON project_invitations(inviter_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_invitations_invitee_email ON project_invitations(invitee_email);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(invitation_token);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON project_invitations(status);');
      console.log('✅ Project invitations table created');
      tablesCreated.push('project_invitations');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating project_invitations table:', error.message);
        errors.push({ table: 'project_invitations', error: error.message });
      } else {
        console.log('✅ Project invitations table already exists');
        tablesCreated.push('project_invitations');
      }
    }

    // 11. CREATE LEAVE REQUESTS TABLE
    try {
      console.log('📋 Creating leave_requests table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS leave_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          reason TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_leave_requests_project_id ON leave_requests(project_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);');
      await db.query('CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);');
      console.log('✅ Leave requests table created');
      tablesCreated.push('leave_requests');
    } catch (error) {
      if (error.code !== '42P07') {
        console.error('❌ Error creating leave_requests table:', error.message);
        errors.push({ table: 'leave_requests', error: error.message });
      } else {
        console.log('✅ Leave requests table already exists');
        tablesCreated.push('leave_requests');
      }
    }

    // 12. CREATE HELPER FUNCTIONS
    console.log('📋 Creating helper functions...');
    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER 
        LANGUAGE plpgsql
        AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$;
      `);
      console.log('✅ Function update_updated_at_column created');
    } catch (funcError) {
      console.log('⚠️  Could not create update_updated_at_column function:', funcError.message);
    }

    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
        RETURNS INTEGER
        LANGUAGE plpgsql
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
      console.log('✅ Function cleanup_expired_sessions created');
    } catch (funcError) {
      console.log('⚠️  Could not create cleanup_expired_sessions function:', funcError.message);
    }

    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
        RETURNS INTEGER
        LANGUAGE plpgsql
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
      console.log('✅ Function cleanup_expired_tokens created');
    } catch (funcError) {
      console.log('⚠️  Could not create cleanup_expired_tokens function:', funcError.message);
    }

    // 13. CREATE TRIGGERS
    console.log('📋 Creating triggers...');
    const tablesWithTriggers = ['users', 'user_sessions', 'projects', 'tasks', 'project_invitations', 'leave_requests'];
    for (const table of tablesWithTriggers) {
      try {
        await db.query(`
          DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
          CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log(`✅ Trigger for ${table} created`);
      } catch (triggerError) {
        console.log(`⚠️  Could not create trigger for ${table}:`, triggerError.message);
      }
    }

    console.log('━'.repeat(70));
    console.log('✅ TABLE CREATION COMPLETE!');
    console.log('━'.repeat(70));
    console.log(`📊 Successfully created/verified: ${tablesCreated.length} tables`);
    console.log(`   ${tablesCreated.join(', ')}`);
    
    if (errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${errors.length}`);
      errors.forEach(err => {
        console.log(`   - ${err.table}: ${err.error}`);
      });
    }
    
    console.log('━'.repeat(70));
    console.log('🎉 Database is ready to use!');
    console.log('━'.repeat(70));

    return {
      success: errors.length === 0,
      tablesCreated: tablesCreated.length,
      errors: errors.length
    };

  } catch (error) {
    console.error('━'.repeat(70));
    console.error('❌ FATAL ERROR creating tables:', error.message);
    console.error('━'.repeat(70));
    
    if (error.code === '42501' || error.message.includes('permission denied')) {
      console.log('💡 PERMISSION ERROR - To fix this, run as PostgreSQL superuser:');
      console.log('   psql -U postgres -d your_database');
      console.log('   GRANT CREATE ON SCHEMA public TO your_username;');
      console.log('   GRANT ALL PRIVILEGES ON SCHEMA public TO your_username;');
      console.log('━'.repeat(70));
    }
    
    throw error;
  }
}

export default createTablesLocally;

