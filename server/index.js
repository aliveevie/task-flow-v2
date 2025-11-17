import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import emailService from './mails/emailService.js';
import { createTablesLocally } from './create-tables-locally.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for logo)
app.use(express.static(join(__dirname, '../public')));

// Initialize database connection
let db = null;
let dbConnected = false;

// Initialize email service
let emailReady = false;

// Function to create all database tables if they don't exist
async function createAllTablesIfNotExist() {
  if (!db || !dbConnected) {
    return false;
  }

  try {
    // Check which tables exist
    const existingTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const requiredTables = [
      'users', 'user_sessions', 'password_reset_tokens', 'email_verification_tokens',
      'projects', 'tasks', 'project_members', 'notifications', 'audit_logs',
      'project_invitations', 'leave_requests'
    ];

    const existingTableNames = existingTables.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

    if (missingTables.length === 0) {
      console.log('✅ All required tables already exist. No creation needed.');
      return true;
    }

    console.log('━'.repeat(70));
    console.log('🔧 CREATING DATABASE TABLES...');
    console.log('━'.repeat(70));
    console.log(`📋 Missing tables to create: ${missingTables.length}`);
    console.log(`   ${missingTables.join(', ')}`);
    console.log('━'.repeat(70));

    // Use the professional table creation function
    const result = await createTablesLocally(db);
    
    return result.success;
  } catch (error) {
    console.error('━'.repeat(70));
    console.error('❌ Error in createAllTablesIfNotExist:', error.message);
    console.error('━'.repeat(70));
    
    // Handle permission errors with helpful message
    if (error.code === '42501' || error.message.includes('permission denied')) {
      console.log('━'.repeat(70));
      console.log('⚠️  PERMISSION ERROR DETECTED');
      console.log('━'.repeat(70));
      console.log('💡 To fix this, run one of these commands in PostgreSQL:');
      console.log('');
      console.log('   Option 1 (as superuser):');
      console.log('   psql -U postgres -d your_database');
      console.log('   GRANT CREATE ON SCHEMA public TO your_username;');
      console.log('');
      console.log('   Option 2 (as superuser):');
      console.log('   GRANT ALL PRIVILEGES ON SCHEMA public TO your_username;');
      console.log('');
      console.log('   Option 3:');
      console.log('   ALTER USER your_username CREATEDB;');
      console.log('━'.repeat(70));
      return false;
    }
    
    return false;
  }
}

// Database connection function
async function connectToDatabase() {
  const connectionString = process.env.connectiondb;
  
  if (!connectionString) {
    console.error('❌ ERROR: connectiondb not found in .env file');
    console.log('💡 Please add connectiondb to your .env file');
    return false;
  }

  try {
    console.log('━'.repeat(70));
    console.log('📡 Connecting to PostgreSQL database...');
    
    db = new Client({ connectionString });
    await db.connect();
    
    // Test the connection
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    const tableCount = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    dbConnected = true;
    
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
    console.log('━'.repeat(70));
    console.log('📊 Database Info:');
    console.log(`   Time:   ${result.rows[0].current_time}`);
    console.log(`   Tables: ${tableCount.rows[0].count} tables found`);
    console.log('━'.repeat(70));
    
    // Automatically create tables if they don't exist
    // We expect 11 tables: users, user_sessions, password_reset_tokens, email_verification_tokens,
    // projects, tasks, project_members, notifications, audit_logs, project_invitations, leave_requests
    const currentTableCount = parseInt(tableCount.rows[0].count);
    
    if (currentTableCount === 0) {
      console.log('━'.repeat(70));
      console.log('🔧 NO TABLES FOUND IN DATABASE!');
      console.log('🔧 Starting automatic table creation...');
      console.log('━'.repeat(70));
      const tablesCreated = await createAllTablesIfNotExist();
      
      if (tablesCreated) {
        // Re-count tables after creation
        const newTableCount = await db.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log('━'.repeat(70));
        console.log(`✅ Table creation complete! Total tables: ${newTableCount.rows[0].count}`);
        console.log('━'.repeat(70));
      } else {
        console.log('━'.repeat(70));
        console.log('⚠️  Table creation had issues. Please check permissions or create tables manually.');
        console.log('━'.repeat(70));
      }
    } else if (currentTableCount < 11) {
      console.log('━'.repeat(70));
      console.log(`⚠️  INCOMPLETE DATABASE DETECTED!`);
      console.log(`   Found: ${currentTableCount} tables`);
      console.log(`   Expected: 11 tables`);
      console.log('🔧 Creating missing tables...');
      console.log('━'.repeat(70));
      const tablesCreated = await createAllTablesIfNotExist();
      
      if (tablesCreated) {
        const newTableCount = await db.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log('━'.repeat(70));
        console.log(`✅ Missing tables created! Total tables now: ${newTableCount.rows[0].count}`);
        console.log('━'.repeat(70));
      }
    } else {
      // Tables exist, but still check and create any missing ones
      console.log('📋 Verifying all required tables exist...');
      await createAllTablesIfNotExist();
    }
    
    return true;
  } catch (error) {
    console.error('━'.repeat(70));
    console.error('❌ DATABASE CONNECTION FAILED!');
    console.error('━'.repeat(70));
    console.error('Error:', error.message);
    console.log('💡 Please check:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. connectiondb in .env is correct');
    console.error('━'.repeat(70));
    
    dbConnected = false;
    db = null;
    return false;
  }
}

// Email service initialization function
async function initializeEmailService() {
  try {
    console.log('━'.repeat(70));
    console.log('📧 Initializing email service...');
    
    emailReady = await emailService.initialize();
    
    if (emailReady) {
      console.log('✅ EMAIL SERVICE INITIALIZED!');
      console.log('━'.repeat(70));
      const status = emailService.getStatus();
      console.log('📧 Email Info:');
      console.log(`   Email:  ${status.email}`);
      console.log(`   Status: ${status.transporter}`);
      console.log('━'.repeat(70));
    } else {
      console.log('⚠️  Email service not configured');
      console.log('━'.repeat(70));
      console.log('💡 To enable email:');
      console.log('   1. Add EMAIL to .env');
      console.log('   2. Add EMAIL_PASSWORD to .env');
      console.log('━'.repeat(70));
    }
    
    return emailReady;
  } catch (error) {
    console.error('━'.repeat(70));
    console.error('❌ EMAIL SERVICE INITIALIZATION FAILED!');
    console.error('━'.repeat(70));
    console.error('Error:', error.message);
    console.log('💡 Please check your EMAIL and EMAIL_PASSWORD in .env');
    console.error('━'.repeat(70));
    
    emailReady = false;
    return false;
  }
}

// Initialize Supabase client (fallback)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: {
      connected: dbConnected,
      type: dbConnected ? 'PostgreSQL' : 'Not connected'
    },
    email: {
      configured: emailReady,
      status: emailReady ? 'Ready' : 'Not configured'
    }
  });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database not connected',
      message: 'Please check database connection'
    });
  }
  
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({ 
      success: true, 
      message: 'Database connection is working!',
      data: {
        current_time: result.rows[0].current_time,
        pg_version: result.rows[0].pg_version,
        tables: tables.rows.map(t => t.table_name)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================================
// AUTHENTICATION ENDPOINTS
// ============================================================

// Helper function to generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to generate JWT token
function generateJWTToken(userId, email, role) {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  return jwt.sign(
    { userId, email, role },
    secret,
    { expiresIn: '7d' }
  );
}

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({
      success: false,
      error: 'Database not connected'
    });
  }

  try {
    const { email, password, full_name } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id, email, is_email_verified FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_email_verified) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email',
          message: 'Please login instead'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'User exists but email not verified',
          message: 'Please check your email for verification link or request a new one'
        });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Check if user has pending invitation (invited users get 'user' role, self-registered get 'admin')
    const invitationCheck = await db.query(
      `SELECT id FROM project_invitations WHERE invitee_email = $1 AND status = 'pending' LIMIT 1`,
      [email]
    );
    
    const userRole = invitationCheck.rows.length > 0 ? 'user' : 'admin';

    // Insert user
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role`,
      [email, password_hash, full_name, userRole, false, true]
    );

    const user = userResult.rows[0];

    // Insert verification token
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, expiresAt]
    );

    // Create audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'user_registered', 'user', user.id, JSON.stringify({ email })]
    );

    // Send verification email
    if (emailReady) {
      const verificationLink = `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`;
      
      try {
        await emailService.sendVerificationEmail({
          to: email,
          userName: full_name,
          verificationLink,
          expiryTime: '24 hours'
        });

        console.log(`✅ Verification email sent to: ${email}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    // Check if there's a pending invitation for this email
    const pendingInvitation = await db.query(
      `SELECT invitation_token FROM project_invitations 
       WHERE invitee_email = $1 AND status = 'pending' 
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (pendingInvitation.rows.length > 0) {
      console.log(`📧 User has pending invitation, will prompt after verification`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        verification_required: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to register user'
    });
  }
});

// Verify email endpoint
app.get('/api/auth/verify-email', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error - TaskFlow</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Service Unavailable</h1>
        <p>Database not connected. Please try again later.</p>
      </body>
      </html>
    `);
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - TaskFlow</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid Link</h1>
          <p>Verification token is missing.</p>
        </body>
        </html>
      `);
    }

    // Find verification token
    const tokenResult = await db.query(
      `SELECT evt.*, u.email, u.full_name
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token = $1 AND evt.verified_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - TaskFlow</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid or Expired Link</h1>
          <p>This verification link is invalid or has already been used.</p>
          <p><a href="http://localhost:3000/auth">Go to Login</a></p>
        </body>
        </html>
      `);
    }

    const tokenData = tokenResult.rows[0];

    // Check if token expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - TaskFlow</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏰ Link Expired</h1>
          <p>This verification link has expired.</p>
          <p>Please request a new verification email.</p>
          <p><a href="http://localhost:3000/auth">Go to Login</a></p>
        </body>
        </html>
      `);
    }

    // Update user as verified
    await db.query(
      `UPDATE users SET is_email_verified = true WHERE id = $1`,
      [tokenData.user_id]
    );

    // Mark token as used
    await db.query(
      `UPDATE email_verification_tokens SET verified_at = NOW() WHERE id = $1`,
      [tokenData.id]
    );

    // Create audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [tokenData.user_id, 'email_verified', 'user', tokenData.user_id]
    );

    // Send welcome email
    if (emailReady) {
      try {
        await emailService.sendEmailVerifiedEmail({
          to: tokenData.email,
          userName: tokenData.full_name,
          loginUrl: 'http://localhost:3000/auth'
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Check for pending invitations after verification
    const pendingInvitationsCheck = await db.query(
      `SELECT invitation_token FROM project_invitations 
       WHERE invitee_email = $1 AND status = 'pending' 
       ORDER BY created_at DESC LIMIT 1`,
      [tokenData.email]
    );

    const redirectUrl = pendingInvitationsCheck.rows.length > 0 
      ? `http://localhost:8080/auth?action=accept-invitation&token=${pendingInvitationsCheck.rows[0].invitation_token}`
      : 'http://localhost:8080/auth';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified - TaskFlow</title>
        <meta http-equiv="refresh" content="3;url=${redirectUrl}">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #667eea; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; margin: 15px 0; }
          .checkmark { font-size: 60px; color: #10b981; animation: scaleIn 0.5s ease; }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(102, 126, 234, 0.3);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
        <script>
          setTimeout(function() {
            window.location.href = '${redirectUrl}';
          }, 3000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1>Email Verified Successfully!</h1>
          <p>Your TaskFlow account is now active.</p>
          <p>${pendingInvitationsCheck.rows.length > 0 ? 'Redirecting to accept your invitation...' : 'Redirecting to login page...'}</p>
          <div class="spinner" style="margin-top: 20px;"></div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error - TaskFlow</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Error</h1>
        <p>An error occurred during verification.</p>
        <p>Error: ${error.message}</p>
      </body>
      </html>
    `);
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({
      success: false,
      error: 'Database not connected'
    });
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const userResult = await db.query(
      `SELECT id, email, password_hash, full_name, role, is_email_verified, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled',
        message: 'Please contact support'
      });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
        message: 'Please verify your email before logging in'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateJWTToken(user.id, user.email, user.role);

    // Update last login
    await db.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.query(
      `INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, sessionToken, token, expiresAt]
    );

    // Create audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'user_login', 'user', user.id, JSON.stringify({ email })]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token,
        sessionToken,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to login'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({
      success: false,
      error: 'Database not connected'
    });
  }

  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      // Delete session
      await db.query(
        `DELETE FROM user_sessions WHERE session_token = $1`,
        [sessionToken]
      );
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// EMAIL ENDPOINTS
// ============================================================

// Email service status
app.get('/api/email/status', (req, res) => {
  const status = emailService.getStatus();
  res.json({
    success: true,
    ...status,
    message: emailReady ? 'Email service is ready' : 'Email service is not configured'
  });
});

// Send test email
app.post('/api/email/test', async (req, res) => {
  if (!emailReady) {
    return res.status(503).json({
      success: false,
      error: 'Email service not configured',
      message: 'Please add EMAIL and EMAIL_PASSWORD to .env file'
    });
  }

  try {
    const { email, name, message } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const result = await emailService.sendTestEmail(
      email,
      name || 'User',
      message || 'Testing email functionality!'
    );

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      data: {
        to: email,
        messageId: result.messageId
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send test email'
    });
  }
});

// Send welcome email
app.post('/api/email/welcome', async (req, res) => {
  if (!emailReady) {
    return res.status(503).json({
      success: false,
      error: 'Email service not configured'
    });
  }

  try {
    const { email, userName, userEmail, loginUrl } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const result = await emailService.sendWelcomeEmail({
      to: email,
      userName: userName || 'User',
      userEmail: userEmail || email,
      loginUrl: loginUrl || 'http://localhost:3000'
    });

    res.json({
      success: true,
      message: 'Welcome email sent successfully!',
      data: {
        to: email,
        messageId: result.messageId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send password reset email
app.post('/api/email/password-reset', async (req, res) => {
  if (!emailReady) {
    return res.status(503).json({
      success: false,
      error: 'Email service not configured'
    });
  }

  try {
    const { email, userName, resetLink, expiryTime } = req.body;

    if (!email || !resetLink) {
      return res.status(400).json({
        success: false,
        error: 'Email and reset link are required'
      });
    }

    const result = await emailService.sendPasswordResetEmail({
      to: email,
      userName: userName || 'User',
      resetLink,
      expiryTime: expiryTime || '1 hour'
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully!',
      data: {
        to: email,
        messageId: result.messageId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send task assigned email
app.post('/api/email/task-assigned', async (req, res) => {
  if (!emailReady) {
    return res.status(503).json({
      success: false,
      error: 'Email service not configured'
    });
  }

  try {
    const { email, userName, taskTitle, taskDescription, projectName, dueDate, taskUrl } = req.body;

    if (!email || !taskTitle || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'Email, task title, and project name are required'
      });
    }

    const result = await emailService.sendTaskAssignedEmail({
      to: email,
      userName: userName || 'User',
      taskTitle,
      taskDescription,
      projectName,
      dueDate,
      taskUrl
    });

    res.json({
      success: true,
      message: 'Task assignment email sent successfully!',
      data: {
        to: email,
        messageId: result.messageId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send project invitation email
app.post('/api/email/project-invite', async (req, res) => {
  if (!emailReady) {
    return res.status(503).json({
      success: false,
      error: 'Email service not configured'
    });
  }

  try {
    const { email, userName, projectName, invitedBy, projectDescription, acceptUrl } = req.body;

    if (!email || !projectName || !invitedBy) {
      return res.status(400).json({
        success: false,
        error: 'Email, project name, and inviter name are required'
      });
    }

    const result = await emailService.sendProjectInviteEmail({
      to: email,
      userName: userName || 'User',
      projectName,
      invitedBy,
      projectDescription,
      acceptUrl
    });

    res.json({
      success: true,
      message: 'Project invitation email sent successfully!',
      data: {
        to: email,
        messageId: result.messageId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// PROJECT ENDPOINTS
// ============================================================

// Get all projects
app.get('/api/projects', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const result = await db.query(`
      SELECT p.*, u.full_name as creator_name, u.email as creator_email
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get projects created by user
app.get('/api/projects/created/:userId', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { userId } = req.params;
    
    const result = await db.query(`
      SELECT p.*, u.full_name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.created_by = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get projects user was invited to
app.get('/api/projects/invited/:userId', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { userId } = req.params;
    
    const result = await db.query(`
      SELECT p.*, u.full_name as creator_name, pm.role as member_role
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = $1 AND p.created_by != $1
      ORDER BY pm.created_at DESC
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT p.*, u.full_name as creator_name, u.email as creator_email
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { title, description, due_date, status, created_by } = req.body;

    const result = await db.query(`
      INSERT INTO projects (title, description, due_date, status, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, due_date, status || 'active', created_by]);

    // Create audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [created_by, 'project_created', 'project', result.rows[0].id, JSON.stringify({ title })]);

    // Create notification for user
    await createNotification(
      created_by,
      'project_created',
      'Project Created',
      `You created project "${title}"`,
      { project_id: result.rows[0].id, title }
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;
    const { title, description, due_date, status } = req.body;

    const result = await db.query(`
      UPDATE projects 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          due_date = COALESCE($3, due_date),
          status = COALESCE($4, status),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [title, description, due_date, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;

    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// TASK ENDPOINTS
// ============================================================

// Get all tasks for a project
app.get('/api/projects/:projectId/tasks', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { projectId } = req.params;
    const result = await db.query(`
      SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC
    `, [projectId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const result = await db.query(`
      SELECT t.*, p.title as project_title
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { project_id, title, description, assigned_to, assigned_by, date_assigned, due_date, timelines, priority, status, comments } = req.body;

    const result = await db.query(`
      INSERT INTO tasks (project_id, title, description, assigned_to, assigned_by, date_assigned, due_date, timelines, priority, status, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [project_id, title, description, assigned_to, assigned_by, date_assigned, due_date, timelines, priority || 'medium', status || 'pending', comments]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    
    const result = await db.query(`
      UPDATE tasks SET ${fields}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { userId } = req.params;
    
    const result = await db.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;
    
    await db.query(`
      UPDATE notifications SET read = true WHERE id = $1
    `, [id]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/:userId/read-all', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { userId } = req.params;
    
    await db.query(`
      UPDATE notifications SET read = true WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create notification helper function
async function createNotification(user_id, type, title, message, metadata = {}) {
  if (!dbConnected || !db) return;
  
  try {
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [user_id, type, title, message, JSON.stringify(metadata)]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// ============================================================
// PROJECT MEMBERS & INVITATION ENDPOINTS
// ============================================================

// Get project members
app.get('/api/projects/:projectId/members', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { projectId } = req.params;
    const result = await db.query(`
      SELECT pm.*, u.full_name, u.email, u.avatar_url
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [projectId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invite user to project (send invitation email)
app.post('/api/projects/invite', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { project_id, invitee_email, inviter_id, message } = req.body;

    if (!project_id || !invitee_email || !inviter_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, invitee email, and inviter ID are required'
      });
    }

    // Get project and inviter details
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [project_id]);
    const inviterResult = await db.query('SELECT * FROM users WHERE id = $1', [inviter_id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (inviterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inviter not found' });
    }

    const project = projectResult.rows[0];
    const inviter = inviterResult.rows[0];

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [invitee_email]);
    const invitee_id = existingUser.rows.length > 0 ? existingUser.rows[0].id : null;

    // Generate invitation token
    const invitation_token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert invitation
    const invitationResult = await db.query(`
      INSERT INTO project_invitations (project_id, inviter_id, invitee_email, invitee_id, invitation_token, message, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [project_id, inviter_id, invitee_email, invitee_id, invitation_token, message, expires_at]);

    // Send invitation email
    if (emailReady) {
      const acceptLink = `http://localhost:3000/api/invitations/accept?token=${invitation_token}`;
      const rejectLink = `http://localhost:3000/api/invitations/reject?token=${invitation_token}`;

      await emailService.sendProjectInvitationEmail({
        to: invitee_email,
        inviteeName: existingUser.rows.length > 0 ? existingUser.rows[0].full_name : '',
        projectName: project.title,
        inviterName: inviter.full_name,
        message,
        acceptLink,
        rejectLink,
        expiryTime: '7 days'
      });

      console.log(`✅ Project invitation sent to: ${invitee_email}`);
    }

    // Create notification for inviter
    await createNotification(
      inviter_id,
      'invitation_sent',
      'Invitation Sent',
      `You invited ${invitee_email} to join "${project.title}"`,
      { project_id, invitee_email }
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitationResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept invitation
app.get('/api/invitations/accept', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).send('<h1>Database not connected</h1>');
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<h1>Invalid invitation link</h1>');
    }

    // Get invitation
    const invitationResult = await db.query(`
      SELECT i.*, p.title as project_title, u.full_name as inviter_name, u.email as inviter_email
      FROM project_invitations i
      JOIN projects p ON i.project_id = p.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.invitation_token = $1 AND i.status = 'pending'
    `, [token]);

    if (invitationResult.rows.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Invitation - TaskFlow</title>
          <meta http-equiv="refresh" content="3;url=/auth">
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 50px; border-radius: 20px;">
            <h1 style="color: #ef4444;">❌ Invalid or Expired Invitation</h1>
            <p>This invitation link is invalid or has already been used.</p>
            <p>Redirecting to login...</p>
          </div>
        </body>
        </html>
      `);
    }

    const invitation = invitationResult.rows[0];

    // Check if expired
    if (new Date() > new Date(invitation.expires_at)) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Expired - TaskFlow</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏰ Invitation Expired</h1>
          <p>This invitation has expired. Please contact the project admin.</p>
        </body>
        </html>
      `);
    }

    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [invitation.invitee_email]);

    // If user doesn't exist, redirect to registration with invitation token
    if (userResult.rows.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Create Account - TaskFlow</title>
          <meta http-equiv="refresh" content="3;url=http://localhost:8080/auth?invitation=${token}">
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 50px; border-radius: 20px;">
            <h1 style="color: #667eea;">Welcome! 🎉</h1>
            <p>Please create your TaskFlow account to accept this invitation.</p>
            <p>Redirecting to registration...</p>
          </div>
        </body>
        </html>
      `);
    }

    const user = userResult.rows[0];

    // Add user to project
    await db.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, user_id) DO NOTHING
    `, [invitation.project_id, user.id, 'member']);

    // Update invitation status
    await db.query(`
      UPDATE project_invitations 
      SET status = 'accepted', accepted_at = NOW(), invitee_id = $1
      WHERE id = $2
    `, [user.id, invitation.id]);

    // Create notifications
    await createNotification(
      invitation.inviter_id,
      'invitation_accepted',
      'Invitation Accepted',
      `${user.full_name} accepted your invitation to join "${invitation.project_title}"`,
      { project_id: invitation.project_id, user_id: user.id }
    );

    await createNotification(
      user.id,
      'project_joined',
      'Joined Project',
      `You joined project "${invitation.project_title}" invited by ${invitation.inviter_name}`,
      { project_id: invitation.project_id, inviter_id: invitation.inviter_id }
    );

    // Notify admin
    if (emailReady) {
      await emailService.sendInvitationAcceptedEmail({
        to: invitation.inviter_email,
        adminName: invitation.inviter_name,
        userName: user.full_name,
        userEmail: user.email,
        projectName: invitation.project_title,
        projectUrl: `http://localhost:3000/admin/projects/${invitation.project_id}`
      });

      // Welcome user to project
      await emailService.sendWelcomeToProjectEmail({
        to: user.email,
        userName: user.full_name,
        projectName: invitation.project_title,
        inviterName: invitation.inviter_name,
        dashboardUrl: 'http://localhost:3000/user'
      });
    }

    // Redirect to login page so user can login and access their dashboard
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invitation Accepted - TaskFlow</title>
        <meta http-equiv="refresh" content="3;url=http://localhost:8080/user">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          .checkmark { font-size: 60px; color: #10b981; }
        </style>
        <script>
          setTimeout(function() { window.location.href = 'http://localhost:8080/user'; }, 3000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1 style="color: #667eea;">Invitation Accepted!</h1>
          <p>Welcome to ${invitation.project_title}!</p>
          <p>Please login to access your dashboard...</p>
          <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(102, 126, 234, 0.3); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-top: 20px;"></div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).send('<h1>Error processing invitation</h1>');
  }
});

// Reject invitation
app.get('/api/invitations/reject', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).send('<h1>Database not connected</h1>');
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<h1>Invalid invitation link</h1>');
    }

    // Get invitation
    const invitationResult = await db.query(`
      SELECT i.*, p.title as project_title, u.full_name as inviter_name, u.email as inviter_email
      FROM project_invitations i
      JOIN projects p ON i.project_id = p.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.invitation_token = $1 AND i.status = 'pending'
    `, [token]);

    if (invitationResult.rows.length === 0) {
      return res.send('<h1>Invalid or already processed invitation</h1>');
    }

    const invitation = invitationResult.rows[0];

    // Update invitation status
    await db.query(`
      UPDATE project_invitations 
      SET status = 'rejected', rejected_at = NOW()
      WHERE id = $1
    `, [invitation.id]);

    // Create notification for admin
    await createNotification(
      invitation.inviter_id,
      'invitation_rejected',
      'Invitation Rejected',
      `${invitation.invitee_email} rejected your invitation to join "${invitation.project_title}"`,
      { project_id: invitation.project_id, invitee_email: invitation.invitee_email }
    );

    // Notify admin
    if (emailReady) {
      await emailService.sendInvitationRejectedEmail({
        to: invitation.inviter_email,
        adminName: invitation.inviter_name,
        userEmail: invitation.invitee_email,
        projectName: invitation.project_title,
        projectUrl: `http://localhost:3000/admin/projects/${invitation.project_id}`
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invitation Declined - TaskFlow</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #667eea;">Invitation Declined</h1>
          <p>You have declined the invitation to join "${invitation.project_title}".</p>
          <p>The project admin has been notified.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).send('<h1>Error processing invitation</h1>');
  }
});

// Add project member directly
app.post('/api/project-members', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { project_id, user_id, role } = req.body;
    
    const result = await db.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [project_id, user_id, role || 'member']);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove project member
app.delete('/api/project-members/:id', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { id } = req.params;

    await db.query('DELETE FROM project_members WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request to leave project
app.post('/api/projects/leave-request', async (req, res) => {
  if (!dbConnected || !db) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }

  try {
    const { project_id, user_id, reason } = req.body;

    // Get project and user details
    const projectResult = await db.query('SELECT * FROM projects p JOIN users admin ON p.created_by = admin.id WHERE p.id = $1', [project_id]);
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);

    if (projectResult.rows.length === 0 || userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project or user not found' });
    }

    const project = projectResult.rows[0];
    const user = userResult.rows[0];

    // Create leave request
    const leaveRequestResult = await db.query(`
      INSERT INTO leave_requests (project_id, user_id, reason)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [project_id, user_id, reason]);

    // Send email to admin
    if (emailReady) {
      const approveLink = `http://localhost:3000/api/leave-requests/approve?id=${leaveRequestResult.rows[0].id}`;
      const rejectLink = `http://localhost:3000/api/leave-requests/reject?id=${leaveRequestResult.rows[0].id}`;

      await emailService.sendLeaveRequestEmail({
        to: project.email,
        adminName: project.full_name,
        userName: user.full_name,
        projectName: project.title,
        reason,
        approveLink,
        rejectLink
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequestResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server with database and email initialization
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Initialize email service
    await initializeEmailService();
    
    // Start Express server
app.listen(PORT, () => {
      console.log('');
      console.log('━'.repeat(70));
      console.log('🚀 SWIFT WORK BOARD SERVER');
      console.log('━'.repeat(70));
      console.log(`✅ Server:      http://localhost:${PORT}`);
      console.log(`✅ API:         http://localhost:${PORT}/api`);
      console.log(`✅ Health:      http://localhost:${PORT}/api/health`);
      console.log(`✅ DB Test:     http://localhost:${PORT}/api/db-test`);
      console.log(`✅ Email Test:  http://localhost:${PORT}/api/email/test`);
      console.log('━'.repeat(70));
      console.log(`📊 Database:  ${dbConnected ? '✅ Connected' : '❌ Not Connected'}`);
      console.log(`📧 Email:     ${emailReady ? '✅ Ready' : '⚠️  Not Configured'}`);
      console.log('━'.repeat(70));
      console.log('');
      console.log('Server is ready to accept requests! 🎉');
      console.log('');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      if (db && dbConnected) {
        await db.end();
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      if (db && dbConnected) {
        await db.end();
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();


