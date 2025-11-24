import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, FileSpreadsheet, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectModal from "@/components/projects/ProjectModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminProjects = () => {
  const navigate = useNavigate();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.galaxyitt.com.ng/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const projectsData = result.data || [];

      // Fetch task counts and member counts for each project
      const projectsWithCounts = await Promise.all(
        projectsData.map(async (project: any) => {
          const tasksResponse = await fetch(`https://api.galaxyitt.com.ng/api/projects/${project.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const tasksResult = await tasksResponse.json();
          const tasks = tasksResult.data || [];

          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === 'completed' || t.status === 'Completed').length;

          const membersResponse = await fetch(`https://api.galaxyitt.com.ng/api/projects/${project.id}/members`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const membersResult = await membersResponse.json();
          const members = membersResult.data || [];

          return {
            ...project,
            totalTasks,
            completedTasks,
            members: members.length + 1, // +1 for the creator
            dueDate: project.due_date
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error: any) {
      toast.error(error.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async (data: any) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("You must be logged in to create a project");
        window.location.href = "/auth";
        return;
      }

      const user = JSON.parse(userData);

      const response = await fetch('https://api.galaxyitt.com.ng/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          status: 'active',
          created_by: user.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Project created successfully!");
      setIsProjectModalOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    }
  };

  const handleEditProject = async (data: any) => {
    try {
      const response = await fetch(`https://api.galaxyitt.com.ng/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          due_date: data.dueDate
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Project updated successfully!");
      setEditingProject(null);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`https://api.galaxyitt.com.ng/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Project deleted successfully!");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total === 0 ? 0 : (completed / total) * 100;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage all your projects and their tasks</p>
          </div>
          <Button onClick={() => setIsProjectModalOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/admin/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {project.completedTasks}/{project.totalTasks} tasks
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(project.completedTasks, project.totalTasks)} />
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{project.members} members</span>
                  </div>
                  <span>Due: {project.dueDate}</span>
                </div>

                {/* Status Badge */}
                <Badge variant={project.status === "completed" ? "default" : "outline"}>
                  {project.status === "completed" ? "Completed" : "Active"}
                </Badge>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              No projects found. Create your first project to get started!
            </CardContent>
          </Card>
        )}
      </div>

      <ProjectModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        onSubmit={handleCreateProject}
      />

      {editingProject && (
        <ProjectModal
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSubmit={handleEditProject}
          initialData={editingProject}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminProjects;
