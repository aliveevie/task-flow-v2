import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, Users, Clock, AlertCircle, FolderKanban, Plus, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectModal from "@/components/projects/ProjectModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [userName, setUserName] = useState("Admin");

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.full_name || "Admin");
    }
    
    // Fetch real projects from backend
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://10.1.1.205:3000/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Fetch task counts for each project
        const projectsWithData = await Promise.all(
          result.data.map(async (project: any) => {
            const tasksResponse = await fetch(`http://10.1.1.205:3000/api/projects/${project.id}/tasks`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const tasksResult = await tasksResponse.json();
            const tasks = tasksResult.data || [];

            const membersResponse = await fetch(`http://10.1.1.205:3000/api/projects/${project.id}/members`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const membersResult = await membersResponse.json();
            const members = membersResult.data || [];

            return {
              ...project,
              dueDate: project.due_date,
              totalTasks: tasks.length,
              completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
              members: members.length + 1
            };
          })
        );

        setProjects(projectsWithData);
      } else {
        toast.error(result.error || "Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0);
  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalMembers = projects.reduce((sum, p) => sum + p.members, 0);

  const stats = [
    { title: "Total Projects", value: projects.length.toString(), icon: FolderKanban, color: "text-blue-600" },
    { title: "Active Projects", value: activeProjects.toString(), icon: CheckCircle2, color: "text-green-600" },
    { title: "Total Tasks", value: totalTasks.toString(), icon: Clock, color: "text-purple-600" },
    { title: "Team Members", value: totalMembers.toString(), icon: Users, color: "text-orange-600" },
  ];

  const getProgressPercentage = (completed: number, total: number) => {
    return total === 0 ? 0 : (completed / total) * 100;
  };

  const chartData = projects.map(p => ({
    name: p.title.substring(0, 15),
    completed: p.completedTasks,
    total: p.totalTasks
  }));

  const handleCreateProject = async (data: any) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("You must be logged in to create a project");
        window.location.href = "/auth";
        return;
      }

      const user = JSON.parse(userData);

      const response = await fetch('http://10.1.1.205:3000/api/projects', {
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
      fetchProjects(); // Refresh projects list
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}! 👋</h1>
            <p className="text-muted-foreground mt-1">Manage your projects and track team progress</p>
          </div>
          <Button onClick={() => setIsProjectModalOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Progress Chart */}
        {loading ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading projects...
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No projects yet. Create your first project to get started!</p>
              <Button onClick={() => setIsProjectModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Project Progress Overview</CardTitle>
              <CardDescription>Task completion status across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Completed" />
                    <Bar dataKey="total" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Projects */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Your current projects and their progress</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/projects")}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Loading projects...</p>
              ) : projects.filter(p => p.status === "active").length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No active projects. Create one to get started!</p>
              ) : projects.filter(p => p.status === "active").map((project) => (
                <div
                  key={project.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    <Badge variant={project.status === "completed" ? "default" : "outline"}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {project.completedTasks}/{project.totalTasks} tasks
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(project.completedTasks, project.totalTasks)} />
                  </div>

                  <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{project.members} members</span>
                    </div>
                    <span>Due: {project.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        onSubmit={handleCreateProject}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
