import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

const UserDashboard = () => {
  const [userName, setUserName] = useState("User");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Update landing page", description: "Redesign the homepage with new branding", dueDate: "2025-11-01", status: "In Progress", priority: "High" },
    { id: 2, title: "Write API documentation", description: "Document all REST API endpoints", dueDate: "2025-11-05", status: "Not Started", priority: "Medium" },
    { id: 3, title: "Fix mobile responsiveness", description: "Ensure all pages work on mobile devices", dueDate: "2025-10-30", status: "Completed", priority: "High" },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.full_name || "User");
    }
  }, []);

  const stats = [
    { title: "My Tasks", value: tasks.length.toString(), icon: CheckCircle2, color: "text-primary" },
    { title: "In Progress", value: tasks.filter(t => t.status === "In Progress").length.toString(), icon: Clock, color: "text-warning" },
    { title: "Completed", value: tasks.filter(t => t.status === "Completed").length.toString(), icon: CheckCircle2, color: "text-success" },
  ];

  const handleStatusChange = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    toast.success("Task status updated successfully!");
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
    <DashboardLayout role="user">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}! 👋</h1>
          <p className="text-muted-foreground mt-1">View and manage your assigned tasks</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
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

        {/* Tasks List */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Assigned Tasks</CardTitle>
            <CardDescription>Tasks currently assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <Badge variant={getPriorityColor(task.priority) as any}>
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusColor(task.status) as any}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
