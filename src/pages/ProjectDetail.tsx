import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserPlus, FileSpreadsheet, ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskModal from "@/components/tasks/TaskModal";
import InviteUsersModal from "@/components/projects/InviteUsersModal";
import ImportTasksModal from "@/components/projects/ImportTasksModal";
import { toast } from "sonner";

const API_URL = "https://api.galaxyitt.com.ng/api";

// Helper function to calculate timelines from dates
const calculateTimelines = (dateAssigned: string, dueDate: string): string => {
  if (!dateAssigned || !dueDate) {
    return "";
  }

  try {
    const assignedDate = new Date(dateAssigned);
    const due = new Date(dueDate);
    const diffTime = Math.abs(due.getTime() - assignedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (remainingDays === 0) {
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
    } else {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays < 7) {
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const weeks = Math.floor(remainingDays / 7);
        return `${months} month${months > 1 ? 's' : ''} ${weeks} week${weeks > 1 ? 's' : ''}`;
      }
    }
  } catch (error) {
    return "";
  }
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

      // Fetch member count
      const membersResponse = await fetch(`${API_URL}/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const membersResult = await membersResponse.json();

      setProject({
        ...projectResult.data,
        dueDate: projectResult.data.due_date,
        members: (membersResult.success ? membersResult.data.length : 0) + 1
      });

      // Fetch tasks
      const tasksResponse = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
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
      navigate('/admin/projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.deliverables?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                         (task.assignedTo?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const progressPercentage = tasks.length === 0 ? 0 : (completedTasks / tasks.length) * 100;

  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          project_id: projectId,
          title: data.deliverables,
          description: data.description || "",
          assigned_to: data.assignedTo || "",
          assigned_by: data.assignedBy || "",
          date_assigned: data.dateAssigned || null,
          due_date: data.dueDate || null,
          timelines: data.timelines || calculateTimelines(data.dateAssigned, data.dueDate) || "",
          priority: data.priority ? data.priority.toLowerCase() : "medium",
          status: data.status ? data.status.toLowerCase().replace(/\s+/g, '-') : "pending",
          comments: data.comments || ""
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Task created successfully!");
      setIsTaskModalOpen(false);
      fetchProjectAndTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    }
  };

  const handleEditTask = async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: data.deliverables,
          description: data.description || "",
          assigned_to: data.assignedTo || "",
          assigned_by: data.assignedBy || "",
          date_assigned: data.dateAssigned || null,
          due_date: data.dueDate || null,
          timelines: data.timelines || calculateTimelines(data.dateAssigned, data.dueDate) || "",
          priority: data.priority ? data.priority.toLowerCase() : "medium",
          status: data.status ? data.status.toLowerCase().replace(/\s+/g, '-') : "pending",
          comments: data.comments || ""
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Task updated successfully!");
      setEditingTask(null);
      fetchProjectAndTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Task deleted successfully!");
      fetchProjectAndTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const handleInviteUsers = async (emails: string[]) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("You must be logged in");
        return;
      }

      const user = JSON.parse(userData);

      // Send invitations for each email
      for (const email of emails) {
        await fetch(`${API_URL}/projects/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            project_id: projectId,
            invitee_email: email,
            inviter_id: user.id,
            message: `You have been invited to join this project`
          })
        });
      }

      toast.success(`Invited ${emails.length} user(s) to the project!`);
      setIsInviteModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
    }
  };

  const handleImportTasks = async (importedTasks: any[]) => {
    try {
      // Import tasks one by one
      for (const task of importedTasks) {
        await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            project_id: projectId,
            title: task.deliverables,
            description: task.description,
            assigned_to: task.assignedTo,
            assigned_by: task.assignedBy,
            date_assigned: task.dateAssigned,
            due_date: task.dueDate,
            timelines: task.timelines,
            priority: task.priority,
            status: task.status,
            comments: task.comments
          })
        });
      }

      toast.success(`Imported ${importedTasks.length} task(s) successfully!`);
      setIsImportModalOpen(false);
      fetchProjectAndTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to import tasks");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "outline";
      case "Medium": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "In Progress": return "default";
      case "Blocked": return "destructive";
      default: return "secondary";
    }
  };

  if (loading || !project) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-12 text-muted-foreground">Loading project...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/projects")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Due: {project.dueDate}</span>
                <span>•</span>
                <span>{project.members} members</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsInviteModalOpen(true)} variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Users
              </Button>
              <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Import Tasks
              </Button>
              <Button onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project Progress</span>
                  <span className="font-semibold">
                    {completedTasks}/{tasks.length} tasks completed
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <CardDescription>Manage all tasks in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">S/N</TableHead>
                    <TableHead className="font-semibold">Deliverables</TableHead>
                    <TableHead className="font-semibold">Assigned To</TableHead>
                    <TableHead className="font-semibold">Assigned By</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Date Assigned</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Timelines</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Comments</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                        No tasks found. Create a new task or import from Excel.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">{task.sn || task.id}</TableCell>
                        <TableCell className="min-w-[150px]">{task.deliverables || "-"}</TableCell>
                        <TableCell className="min-w-[120px]">{task.assignedTo || "-"}</TableCell>
                        <TableCell className="min-w-[120px]">{task.assignedBy || "-"}</TableCell>
                        <TableCell className="min-w-[200px]">{task.description || "-"}</TableCell>
                        <TableCell className="min-w-[100px]">{task.dateAssigned || "-"}</TableCell>
                        <TableCell className="min-w-[100px]">{task.dueDate || "-"}</TableCell>
                        <TableCell className="min-w-[100px]">{task.timelines || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(task.priority) as any}>
                            {task.priority || "Not Set"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(task.status) as any}>
                            {task.status || "Not Set"}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[150px]">{task.comments || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleCreateTask}
        projectId={projectId}
      />

      {editingTask && (
        <TaskModal
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSubmit={handleEditTask}
          initialData={editingTask}
          projectId={projectId}
        />
      )}

      <InviteUsersModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSubmit={handleInviteUsers}
      />

      <ImportTasksModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSubmit={handleImportTasks}
      />
    </DashboardLayout>
  );
};

export default ProjectDetail;
