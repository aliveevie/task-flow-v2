import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, FileCheck, Eye } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SubmissionModal from "@/components/tasks/SubmissionModal";
import ViewSubmissionFeedback from "@/components/tasks/ViewSubmissionFeedback";
import { toast } from "sonner";

const API_URL = "http://api.galaxyitt.com.ng:3000/api";

const UserDashboard = () => {
  const [userName, setUserName] = useState("User");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({});
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedTaskForFeedback, setSelectedTaskForFeedback] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.full_name || "User");
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    // Fetch submissions for all tasks
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        fetchSubmissions(task.id);
      });
    }
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks/assigned`, {
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
          dueDate: task.due_date,
          status: task.status,
          priority: task.priority,
          assignee: task.assigned_to,
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

  const fetchSubmissions = async (taskId: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSubmissions((prev) => ({
          ...prev,
          [taskId]: result.data || []
        }));
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const getLatestSubmission = (taskId: string) => {
    const taskSubmissions = submissions[taskId] || [];
    return taskSubmissions.length > 0 ? taskSubmissions[0] : null;
  };

  const hasSubmission = (taskId: string) => {
    return submissions[taskId] && submissions[taskId].length > 0;
  };

  const stats = [
    { title: "My Tasks", value: tasks.length.toString(), icon: CheckCircle2, color: "text-primary" },
    { title: "In Progress", value: tasks.filter(t => 
      t.status?.toLowerCase() === "in progress" || 
      t.status?.toLowerCase() === "in-progress" || 
      t.status === "In Progress"
    ).length.toString(), icon: Clock, color: "text-warning" },
    { title: "Completed", value: tasks.filter(t => 
      t.status?.toLowerCase() === "completed" || 
      t.status === "Completed"
    ).length.toString(), icon: CheckCircle2, color: "text-success" },
  ];

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        toast.success("Task status updated successfully!");
      } else {
        toast.error(result.error || "Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status");
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
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks assigned to you yet.</p>
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
                      {getLatestSubmission(task.id) && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Submission Status:</span>
                          {getLatestSubmission(task.id).status === 'approved' && (
                            <Badge className="bg-green-500">✓ Approved</Badge>
                          )}
                          {getLatestSubmission(task.id).status === 'rejected' && (
                            <Badge variant="destructive">✗ Rejected</Badge>
                          )}
                          {getLatestSubmission(task.id).status === 'revision-requested' && (
                            <Badge className="bg-yellow-500">↻ Revision Requested</Badge>
                          )}
                          {getLatestSubmission(task.id).status === 'pending' && (
                            <Badge variant="secondary">⏳ Pending Review</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSubmission(task.id) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          Submitted
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedTaskForFeedback(task);
                            setIsFeedbackModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Feedback
                        </Button>
                        {getLatestSubmission(task.id)?.status === 'revision-requested' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedTaskForSubmission(task);
                              setIsSubmissionModalOpen(true);
                            }}
                          >
                            <FileCheck className="w-4 h-4 mr-2" />
                            Resubmit
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedTaskForSubmission(task);
                          setIsSubmissionModalOpen(true);
                        }}
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Submit Work
                      </Button>
                    )}
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
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTaskForSubmission && (
        <SubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => {
            setIsSubmissionModalOpen(false);
            setSelectedTaskForSubmission(null);
          }}
          taskId={selectedTaskForSubmission.id}
          taskTitle={selectedTaskForSubmission.title}
          onSuccess={() => {
            fetchTasks();
            if (selectedTaskForSubmission) {
              fetchSubmissions(selectedTaskForSubmission.id);
            }
            toast.success("Proof of work submitted successfully!");
          }}
        />
      )}

      {selectedTaskForFeedback && (
        <ViewSubmissionFeedback
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedTaskForFeedback(null);
          }}
          taskId={selectedTaskForFeedback.id}
          taskTitle={selectedTaskForFeedback.title}
          onRefresh={() => {
            fetchTasks();
            if (selectedTaskForFeedback) {
              fetchSubmissions(selectedTaskForFeedback.id);
            }
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;
