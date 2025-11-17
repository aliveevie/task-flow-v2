-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  assigned_by TEXT,
  date_assigned DATE,
  due_date DATE,
  timelines TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects they are members of"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = projects.id
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update their projects"
  ON public.projects FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Project creators can delete their projects"
  ON public.projects FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their projects"
  ON public.tasks FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their projects"
  ON public.tasks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their projects"
  ON public.tasks FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their projects"
  ON public.tasks FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for project_members
CREATE POLICY "Users can view members of their projects"
  ON public.project_members FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Project creators can add members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Project creators can remove members"
  ON public.project_members FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();