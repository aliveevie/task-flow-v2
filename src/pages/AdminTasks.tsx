import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, MoreVertical, FileCheck, Eye, FileSpreadsheet, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskModal from "@/components/tasks/TaskModal";
import SubmissionModal from "@/components/tasks/SubmissionModal";
import ReviewSubmissionModal from "@/components/tasks/ReviewSubmissionModal";
import TaskSubmissionsView from "@/components/tasks/TaskSubmissionsView";
import ViewSubmissionFeedback from "@/components/tasks/ViewSubmissionFeedback";
import ImportTasksModal from "@/components/tasks/ImportTasksModal";
import InvitationStatusModal from "@/components/tasks/InvitationStatusModal";
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
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({});
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmissionsViewOpen, setIsSubmissionsViewOpen] = useState(false);
  const [selectedTaskForSubmissions, setSelectedTaskForSubmissions] = useState<any>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedTaskForFeedback, setSelectedTaskForFeedback] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInvitationStatusModalOpen, setIsInvitationStatusModalOpen] = useState(false);
  const [selectedProjectForInvitations, setSelectedProjectForInvitations] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchTasks();
    fetchDefaultProject();
  }, []);

  useEffect(() => {
    // Fetch submissions for all tasks
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        fetchSubmissions(task.id);
      });
    }
  }, [tasks]);

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
          projectTitle: task.project_title,
          projectId: task.project_id,
          projectCreatorId: task.project_creator_id
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

  const isTaskAssignedToMe = (task: any) => {
    return currentUser && task.assignee === currentUser.full_name;
  };

  const isTaskCreatedByMe = (task: any) => {
    return currentUser && task.projectCreatorId === currentUser.id;
  };

  const getLatestSubmission = (taskId: string) => {
    const taskSubmissions = submissions[taskId] || [];
    return taskSubmissions.length > 0 ? taskSubmissions[0] : null;
  };

  const getPendingSubmissionsCount = (taskId: string) => {
    const taskSubmissions = submissions[taskId] || [];
    return taskSubmissions.filter((s: any) => s.status === 'pending').length;
  };

  const hasSubmission = (taskId: string) => {
    return submissions[taskId] && submissions[taskId].length > 0;
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

  const handleDeleteTask = async (taskId: string) => {
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
        // Remove from selected tasks if it was selected
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      } else {
        toast.error(result.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const taskIds = Array.from(selectedTasks);
      let successCount = 0;
      let failCount = 0;

      // Delete tasks one by one
      for (const taskId of taskIds) {
        try {
          const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} task(s)`);
        fetchTasks();
        setSelectedTasks(new Set());
      }

      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} task(s)`);
      }
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const isAllSelected = filteredTasks.length > 0 && selectedTasks.size === filteredTasks.length;
  const isIndeterminate = selectedTasks.size > 0 && selectedTasks.size < filteredTasks.length;

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
          <div className="flex gap-2">
            {selectedTasks.size > 0 && (
              <Button 
                onClick={handleBulkDelete}
                variant="destructive"
                className="shadow-md"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedTasks.size})
              </Button>
            )}
            <Button 
              onClick={() => {
                if (defaultProjectId) {
                  setSelectedProjectForInvitations(defaultProjectId);
                  setIsInvitationStatusModalOpen(true);
                } else {
                  toast.error("No project found. Please create a project first.");
                }
              }} 
              variant="outline"
              className="shadow-md"
            >
              <Mail className="w-4 h-4 mr-2" />
              View Invitations
            </Button>
            <Button 
              onClick={() => {
                if (defaultProjectId) {
                  setIsImportModalOpen(true);
                } else {
                  toast.error("No project found. Please create a project first.");
                }
              }} 
              variant="outline"
              className="shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import Tasks
            </Button>
            <Button onClick={() => setIsTaskModalOpen(true)} className="shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Tasks ({filteredTasks.length})</CardTitle>
                <CardDescription>Tasks assigned to you or created by you</CardDescription>
              </div>
              {filteredTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedTasks.size > 0 ? `${selectedTasks.size} selected` : 'Select all'}
                  </span>
                </div>
              )}
            </div>
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
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center pt-1">
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>Assigned to: {task.assignee}</span>
                        <span>•</span>
                        <span>Due: {task.dueDate}</span>
                        {getLatestSubmission(task.id) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Latest: 
                              <Badge variant="outline" className="ml-1">
                                {getLatestSubmission(task.id).status}
                              </Badge>
                            </span>
                          </>
                        )}
                        {isTaskCreatedByMe(task) && getPendingSubmissionsCount(task.id) > 0 && (
                          <>
                            <span>•</span>
                            <Badge className="bg-yellow-500 text-white">
                              {getPendingSubmissionsCount(task.id)} Pending Review
                            </Badge>
                          </>
                        )}
                      </div>
                      {/* Show submission status for assigned tasks */}
                      {isTaskAssignedToMe(task) && getLatestSubmission(task.id) && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Your Submission:</span>
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
                    <div className="flex items-center gap-2 ml-4">
                    {isTaskAssignedToMe(task) && (
                      <>
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
                      </>
                    )}
                    {isTaskCreatedByMe(task) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedTaskForSubmissions(task);
                          setIsSubmissionsViewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {getLatestSubmission(task.id) ? 'View Submissions' : 'View Task'}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isTaskCreatedByMe(task) && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedTaskForSubmissions(task);
                              setIsSubmissionsViewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Submissions
                          </DropdownMenuItem>
                        )}
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
                  </div>
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
            fetchSubmissions(selectedTaskForSubmission.id);
            fetchTasks();
          }}
        />
      )}

      {selectedSubmission && (
        <ReviewSubmissionModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          onSuccess={() => {
            if (selectedSubmission) {
              fetchSubmissions(selectedSubmission.task_id);
              fetchTasks();
            }
          }}
        />
      )}

      {selectedTaskForSubmissions && (
        <TaskSubmissionsView
          isOpen={isSubmissionsViewOpen}
          onClose={() => {
            setIsSubmissionsViewOpen(false);
            setSelectedTaskForSubmissions(null);
          }}
          taskId={selectedTaskForSubmissions.id}
          taskTitle={selectedTaskForSubmissions.title}
          onReviewSuccess={() => {
            fetchSubmissions(selectedTaskForSubmissions.id);
            fetchTasks();
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

      {defaultProjectId && (
        <>
          <ImportTasksModal
            open={isImportModalOpen}
            onOpenChange={setIsImportModalOpen}
            projectId={defaultProjectId}
            onSuccess={() => {
              fetchTasks();
              setIsImportModalOpen(false);
            }}
          />

          <InvitationStatusModal
            isOpen={isInvitationStatusModalOpen}
            onClose={() => {
              setIsInvitationStatusModalOpen(false);
              setSelectedProjectForInvitations(null);
            }}
            projectId={selectedProjectForInvitations || defaultProjectId}
            onRefresh={() => {
              fetchTasks();
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminTasks;
