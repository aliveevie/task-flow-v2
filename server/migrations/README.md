# Swift Work Board - Database Migrations

## Overview

This directory contains database migration scripts for the Swift Work Board project. The migrations create a complete PostgreSQL database schema with authentication, project management, and collaboration features.

## Database Schema

### 📋 Tables Created

#### 1. **users** - User Authentication & Profiles
Main table for user authentication and account management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email (unique) |
| password_hash | VARCHAR(255) | Hashed password |
| full_name | VARCHAR(255) | User's full name |
| avatar_url | TEXT | Profile picture URL |
| role | VARCHAR(50) | User role (admin/user) |
| is_email_verified | BOOLEAN | Email verification status |
| is_active | BOOLEAN | Account active status |
| last_login_at | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** email, role, is_active

---

#### 2. **user_sessions** - Session Management
Tracks active user login sessions with JWT tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| session_token | VARCHAR(255) | JWT session token |
| refresh_token | VARCHAR(255) | Refresh token |
| ip_address | INET | User's IP address |
| user_agent | TEXT | Browser/client info |
| expires_at | TIMESTAMP | Session expiration |
| created_at | TIMESTAMP | Session start time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** user_id, session_token, expires_at

---

#### 3. **password_reset_tokens** - Password Reset
Secure tokens for password reset functionality.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| token | VARCHAR(255) | Reset token (unique) |
| expires_at | TIMESTAMP | Token expiration |
| used_at | TIMESTAMP | When token was used |
| created_at | TIMESTAMP | Token creation time |

**Indexes:** token, user_id

---

#### 4. **email_verification_tokens** - Email Verification
Tokens for verifying user email addresses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| token | VARCHAR(255) | Verification token (unique) |
| expires_at | TIMESTAMP | Token expiration |
| verified_at | TIMESTAMP | When email was verified |
| created_at | TIMESTAMP | Token creation time |

**Indexes:** token

---

#### 5. **projects** - Project Management
Core table for managing projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Project title |
| description | TEXT | Project description |
| due_date | DATE | Project deadline |
| status | VARCHAR(50) | Project status (active/completed/on-hold/cancelled) |
| created_by | UUID | Foreign key to users |
| created_at | TIMESTAMP | Project creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** created_by, status, due_date

---

#### 6. **tasks** - Task Management
Tasks associated with projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| title | TEXT | Task title |
| description | TEXT | Task description |
| assigned_to | TEXT | Who the task is assigned to |
| assigned_by | TEXT | Who assigned the task |
| date_assigned | DATE | Assignment date |
| due_date | DATE | Task deadline |
| timelines | TEXT | Timeline information |
| priority | VARCHAR(50) | Priority (low/medium/high/critical) |
| status | VARCHAR(50) | Status (pending/not-started/in-progress/blocked/completed) |
| comments | TEXT | Task comments |
| created_at | TIMESTAMP | Task creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** project_id, status, priority, assigned_to, due_date

---

#### 7. **project_members** - Team Collaboration
Team members assigned to projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| user_id | UUID | Foreign key to users |
| role | VARCHAR(50) | Member role (owner/admin/member) |
| created_at | TIMESTAMP | Assignment time |

**Unique Constraint:** (project_id, user_id)
**Indexes:** project_id, user_id

---

#### 8. **notifications** - User Notifications
System notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| type | VARCHAR(100) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| read | BOOLEAN | Read status |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | Notification time |

**Types:** task_assigned, task_completed, task_blocked, due_soon, user_invited, etc.
**Indexes:** user_id, read, created_at

---

#### 9. **audit_logs** - Security Audit Trail
Tracks all important actions for security and compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users (nullable) |
| action | VARCHAR(100) | Action performed |
| entity_type | VARCHAR(100) | Type of entity affected |
| entity_id | UUID | ID of entity affected |
| ip_address | INET | User's IP address |
| user_agent | TEXT | Browser/client info |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | Action time |

**Indexes:** user_id, action, created_at

---

## 🔧 Helper Functions

### 1. `update_updated_at_column()`
Automatically updates the `updated_at` timestamp when a record is modified.

**Applied to:** users, user_sessions, projects, tasks

### 2. `cleanup_expired_sessions()`
Removes expired session tokens from the database.

**Usage:**
```sql
SELECT cleanup_expired_sessions();
```

### 3. `cleanup_expired_tokens()`
Removes expired password reset and email verification tokens.

**Usage:**
```sql
SELECT cleanup_expired_tokens();
```

---

## 🚀 Running Migrations

### Create All Tables

```bash
cd server
npm run create-all-tables
```

This will:
- ✅ Create all 9 database tables
- ✅ Add 25+ performance indexes
- ✅ Create 3 helper functions
- ✅ Add 4 automatic triggers
- ✅ Insert a default admin user

### Default Admin Account

After running the migration, you can login with:

```
Email:    admin@swiftworkboard.com
Password: admin123
```

**⚠️ IMPORTANT:** Change the default password after first login!

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ Session token management
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for compliance
- ✅ Automatic session cleanup
- ✅ IP address tracking

---

## 📊 Database Statistics

After running the migration, your database will have:

| Feature | Count |
|---------|-------|
| Tables | 9 |
| Indexes | 25+ |
| Functions | 3 |
| Triggers | 4 |
| Foreign Keys | 11 |

---

## 🔍 Checking Tables

To verify the tables were created successfully:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records in each table
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'project_members', COUNT(*) FROM project_members
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
```

---

## 📝 Notes

- All tables use UUID as primary keys for better distribution
- Timestamps are stored with timezone information
- Automatic `updated_at` triggers keep track of modifications
- Foreign keys enforce referential integrity
- Indexes optimize common queries
- JSONB columns allow flexible metadata storage

---

## 🆘 Troubleshooting

### Tables already exist

If you get an error that tables already exist, you can:

1. **Drop all tables:**
```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

2. **Run migration again:**
```bash
npm run create-all-tables
```

### Connection issues

Make sure your `.env` file has the correct `connectiondb` value:

```env
connectiondb=postgresql://postgres:yourpassword@localhost:5432/swift_work_board
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [UUID Extension](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [JSONB Data Type](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Created with ❤️ for Swift Work Board**

