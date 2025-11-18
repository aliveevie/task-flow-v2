import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Inbox } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

const API_URL = "http://localhost:3000/api";

const ProjectAssignedTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndTasks();
    }
  }, [projectId]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await fetch(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const projectResult = await projectResponse.json();

      if (!projectResult.success) {
        throw new Error(projectResult.error || "Failed to load project");
      }

      setProject(projectResult.data);

      // Fetch assigned tasks for the user
      const tasksResponse = await fetch(`${API_URL}/projects/${projectId}/tasks/assigned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const tasksResult = await tasksResponse.json();

      if (tasksResult.success) {
        const tasksWithFormatting = (tasksResult.data || []).map((task: any, index: number) => ({
          ...task,
          sn: index + 1,
          deliverables: task.title,
          assignedTo: task.assigned_to,
          assignedBy: task.assigned_by,
          dateAssigned: task.date_assigned,
          dueDate: task.due_date
        }));

        setTasks(tasksWithFormatting);
      }
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error(error.message || "Failed to load project data");
      navigate('/user');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'not started':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const completedTasks = tasks.filter(t => t.status?.toLowerCase() === 'completed').length;
  const progressPercentage = tasks.length === 0 ? 0 : (completedTasks / tasks.length) * 100;

  if (loading) {
    return (
      <DashboardLayout role="user">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/user')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project?.title || 'Project'}</h1>
              {project?.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <div className="mt-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{Math.round(progressPercentage)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Tasks</CardTitle>
            <CardDescription>
              Tasks assigned to you in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tasks Assigned Yet</h3>
                <p className="text-muted-foreground">
                  You don't have any tasks assigned to you in this project yet.
                  <br />
                  Please wait for tasks to be assigned to you by the project administrator.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{task.title || task.deliverables}</h3>
                          {task.priority && (
                            <Badge variant={getPriorityColor(task.priority) as any}>
                              {task.priority}
                            </Badge>
                          )}
                          {task.status && (
                            <Badge variant={getStatusColor(task.status) as any}>
                              {task.status}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          {task.assignedBy && (
                            <span>Assigned by: {task.assignedBy}</span>
                          )}
                          {task.dateAssigned && (
                            <>
                              <span>•</span>
                              <span>Date: {new Date(task.dateAssigned).toLocaleDateString()}</span>
                            </>
                          )}
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        {task.comments && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Comments:</strong> {task.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProjectAssignedTasks;

