import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskModal from "@/components/tasks/TaskModal";
import { toast } from "sonner";

const API_URL = "http://localhost:3000/api";

const AdminTasks = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchDefaultProject();
  }, []);

  const fetchDefaultProject = async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      
      // Get user's first project (created or invited to)
      const projectsResponse = await fetch(`${API_URL}/projects/created/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const projectsResult = await projectsResponse.json();
      
      if (projectsResult.success && projectsResult.data.length > 0) {
        setDefaultProjectId(projectsResult.data[0].id);
      } else {
        // Try to get projects user was invited to
        const invitedResponse = await fetch(`${API_URL}/projects/invited/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const invitedResult = await invitedResponse.json();
        if (invitedResult.success && invitedResult.data.length > 0) {
          setDefaultProjectId(invitedResult.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching default project:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Format tasks to match the expected structure
        const formattedTasks = (result.data || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: task.assigned_to,
          dueDate: task.due_date,
          status: task.status,
          priority: task.priority,
          projectTitle: task.project_title
        }));
        setTasks(formattedTasks);
      } else {
        toast.error(result.error || "Failed to load tasks");
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = async (data: any) => {
    try {
      if (!defaultProjectId) {
        toast.error("No project found. Please create a project first.");
        return;
      }

      // Calculate timelines from dates
      let calculatedTimelines = "";
      if (data.dateAssigned && data.dueDate) {
        const assignedDate = new Date(data.dateAssigned);
        const dueDate = new Date(data.dueDate);
        const diffTime = Math.abs(dueDate.getTime() - assignedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          calculatedTimelines = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          calculatedTimelines = `${weeks} week${weeks > 1 ? 's' : ''}`;
        } else {
          const months = Math.floor(diffDays / 30);
          calculatedTimelines = `${months} month${months > 1 ? 's' : ''}`;
        }
      }

      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          project_id: defaultProjectId,
          title: data.deliverables,
          description: data.description || "",
          assigned_to: data.assignedTo || "",
          assigned_by: data.assignedBy || "",
          date_assigned: data.dateAssigned || null,
          due_date: data.dueDate || null,
          timelines: calculatedTimelines || data.timelines || "",
          priority: data.priority ? data.priority.toLowerCase() : "medium",
          status: data.status ? data.status.toLowerCase().replace(/\s+/g, '-') : "pending",
          comments: data.comments || ""
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Task created successfully!");
        setIsTaskModalOpen(false);
        fetchTasks(); // Refresh tasks list
      } else {
        toast.error(result.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleEditTask = async (data: any) => {
    try {
      // Calculate timelines from dates if not provided
      let calculatedTimelines = data.timelines;
      if (!calculatedTimelines && data.dateAssigned && data.dueDate) {
        const assignedDate = new Date(data.dateAssigned);
        const dueDate = new Date(data.dueDate);
        const diffTime = Math.abs(dueDate.getTime() - assignedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          calculatedTimelines = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          calculatedTimelines = `${weeks} week${weeks > 1 ? 's' : ''}`;
        } else {
          const months = Math.floor(diffDays / 30);
          calculatedTimelines = `${months} month${months > 1 ? 's' : ''}`;
        }
      }

      const response = await fetch(`${API_URL}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: data.deliverables,
          description: data.description || "",
          assigned_to: data.assignedTo || "",
          assigned_by: data.assignedBy || "",
          date_assigned: data.dateAssigned || null,
          due_date: data.dueDate || null,
          timelines: calculatedTimelines || "",
          priority: data.priority ? data.priority.toLowerCase() : "medium",
          status: data.status ? data.status.toLowerCase().replace(/\s+/g, '-') : "pending",
          comments: data.comments || ""
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Task updated successfully!");
        setEditingTask(null);
        fetchTasks(); // Refresh tasks list
      } else {
        toast.error(result.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Task deleted successfully!");
        fetchTasks(); // Refresh tasks list
      } else {
        toast.error(result.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "warning";
      case "Medium": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "default";
      case "Blocked": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
            <p className="text-muted-foreground mt-1">Create, edit, and manage all tasks</p>
          </div>
          <Button onClick={() => setIsTaskModalOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
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
            <CardTitle>My Tasks ({filteredTasks.length})</CardTitle>
            <CardDescription>Tasks assigned to you or created by you</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "No tasks match your filters." 
                    : "No tasks assigned to you or created by you yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task.status) as any}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Assigned to: {task.assignee}</span>
                      <span>•</span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
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
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleCreateTask}
        projectId={defaultProjectId || undefined}
      />

      {editingTask && (
        <TaskModal
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSubmit={handleEditTask}
          initialData={editingTask}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminTasks;
