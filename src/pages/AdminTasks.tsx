import { useState } from "react";
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

const AdminTasks = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [tasks, setTasks] = useState([
    { id: 1, title: "Update landing page", description: "Redesign homepage", assignee: "John Doe", dueDate: "2025-11-01", status: "In Progress", priority: "High" },
    { id: 2, title: "Fix login bug", description: "Users can't login with Google", assignee: "Jane Smith", dueDate: "2025-10-28", status: "Blocked", priority: "Critical" },
    { id: 3, title: "Design new dashboard", description: "Create modern dashboard UI", assignee: "Mike Johnson", dueDate: "2025-11-05", status: "Completed", priority: "Medium" },
    { id: 4, title: "Write documentation", description: "API documentation for developers", assignee: "Sarah Williams", dueDate: "2025-11-10", status: "In Progress", priority: "Low" },
    { id: 5, title: "Setup CI/CD pipeline", description: "Automate deployment process", assignee: "Tom Brown", dueDate: "2025-11-03", status: "Not Started", priority: "High" },
    { id: 6, title: "Mobile app testing", description: "Test app on iOS and Android", assignee: "Lisa Davis", dueDate: "2025-10-30", status: "In Progress", priority: "Medium" },
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = (data: any) => {
    const newTask = { ...data, id: tasks.length + 1 };
    setTasks([...tasks, newTask]);
    toast.success("Task created successfully!");
    setIsTaskModalOpen(false);
  };

  const handleEditTask = (data: any) => {
    setTasks(tasks.map(task => task.id === editingTask.id ? { ...task, ...data } : task));
    toast.success("Task updated successfully!");
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success("Task deleted successfully!");
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
            <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
            <CardDescription>Manage and monitor all project tasks</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleCreateTask}
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
