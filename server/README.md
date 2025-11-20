# Swift Work Board Server

Express.js server for the Swift Work Board application with Supabase integration.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   The `.env` file should contain:
   ```
   SUPABASE_URL=https://imfgwymvdncqrzvzztzy.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   PORT=3000
   ```

3. **Set up database tables:**
   
   Run the database setup script to check your connection and get instructions:
   ```bash
   npm run setup-db
   ```

   To create tables, use Supabase CLI (recommended):
   ```bash
   # Install Supabase CLI globally
   npm install -g supabase

   # Login to Supabase
   npx supabase login

   # Link to your project
   npx supabase link --project-ref imfgwymvdncqrzvzztzy

   # Push migrations to create tables
   npx supabase db push
   ```

   Or manually run the SQL migrations in Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/imfgwymvdncqrzvzztzy/sql
   - Copy and run the SQL from `../supabase/migrations/` files

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/projects/:projectId/tasks` - Get tasks for a specific project
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Project Members
- `GET /api/projects/:projectId/members` - Get project members
- `POST /api/project-members` - Add project member
- `DELETE /api/project-members/:id` - Remove project member

## Database Schema

### Projects Table
- `id` (UUID) - Primary key
- `title` (TEXT) - Project title
- `description` (TEXT) - Project description
- `due_date` (DATE) - Project due date
- `status` (TEXT) - Project status (default: 'active')
- `created_by` (UUID) - User ID of creator
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tasks Table
- `id` (UUID) - Primary key
- `project_id` (UUID) - Foreign key to projects
- `title` (TEXT) - Task title
- `description` (TEXT) - Task description
- `assigned_to` (TEXT) - Assigned user
- `assigned_by` (TEXT) - User who assigned
- `date_assigned` (DATE)
- `due_date` (DATE)
- `timelines` (TEXT)
- `priority` (TEXT) - Task priority (default: 'medium')
- `status` (TEXT) - Task status (default: 'pending')
- `comments` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Project Members Table
- `id` (UUID) - Primary key
- `project_id` (UUID) - Foreign key to projects
- `user_id` (UUID) - User ID
- `role` (TEXT) - Member role (default: 'member')
- `created_at` (TIMESTAMP)

## Features

- ✅ Full CRUD operations for projects, tasks, and members
- ✅ RESTful API design
- ✅ CORS enabled for frontend integration
- ✅ Supabase integration with Row Level Security
- ✅ Automatic timestamp updates
- ✅ Error handling and validation