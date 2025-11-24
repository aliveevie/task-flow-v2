import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: any;
  projectId?: string;
}

interface TaskFormData {
  deliverables: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  dateAssigned: string;
  dueDate: string;
  timelines: string;
  priority: string;
  status: string;
  comments: string;
}

const TaskModal = ({ open, onOpenChange, onSubmit, initialData, projectId }: TaskModalProps) => {
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [currentUserName, setCurrentUserName] = useState("");
  const [formData, setFormData] = useState<TaskFormData>({
    deliverables: "",
    description: "",
    assignedTo: "",
    assignedBy: "",
    dateAssigned: "",
    dueDate: "",
    timelines: "",
    priority: "Medium",
    status: "Not Started",
    comments: "",
  });

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserName(user.full_name);
      setFormData(prev => ({ ...prev, assignedBy: user.full_name }));
    }

    // Fetch project members or all users who accepted invitations
    if (open) {
      if (projectId) {
        fetchProjectMembers();
      } else {
        fetchAllUsers();
      }
    }

    if (initialData) {
      setFormData({
        deliverables: initialData.deliverables || initialData.title || "",
        description: initialData.description || "",
        assignedTo: initialData.assignedTo || initialData.assigned_to || "",
        assignedBy: initialData.assignedBy || initialData.assigned_by || currentUserName,
        dateAssigned: initialData.dateAssigned || initialData.date_assigned || "",
        dueDate: initialData.dueDate || initialData.due_date || "",
        timelines: initialData.timelines || "",
        priority: initialData.priority || "Medium",
        status: initialData.status || "Not Started",
        comments: initialData.comments || "",
      });
    } else {
      // Set default values for new task
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        deliverables: "",
        description: "",
        assignedTo: "",
        assignedBy: currentUserName,
        dateAssigned: today,
        dueDate: "",
        timelines: "",
        priority: "Medium",
        status: "Not Started",
        comments: "",
      });
    }
  }, [initialData, open, projectId, currentUserName]);

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(`http://api.galaxyitt.com.ng:3000/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        // Format members to include full_name
        const formattedMembers = (result.data || []).map((member: any) => ({
          id: member.user_id || member.id,
          full_name: member.full_name
        }));
        setProjectMembers(formattedMembers);
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch all users who have accepted invitations (are project members)
      const response = await fetch(`http://api.galaxyitt.com.ng:3000/api/users/project-members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Format users to match project members structure
        const formattedUsers = (result.data || []).map((user: any) => ({
          id: user.id,
          full_name: user.full_name
        }));
        setProjectMembers(formattedUsers);
        console.log('Fetched project members:', formattedUsers);
      } else {
        console.error('Failed to fetch project members:', result.error);
        // Fallback to fetching all users
        const fallbackResponse = await fetch(`http://api.galaxyitt.com.ng:3000/api/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const fallbackResult = await fallbackResponse.json();
        
        if (fallbackResult.success) {
          const formattedUsers = (fallbackResult.data || []).map((user: any) => ({
            id: user.id,
            full_name: user.name
          }));
          setProjectMembers(formattedUsers);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Final fallback to fetching all users
      try {
        const response = await fetch(`http://api.galaxyitt.com.ng:3000/api/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();
        
        if (result.success) {
          const formattedUsers = (result.data || []).map((user: any) => ({
            id: user.id,
            full_name: user.name
          }));
          setProjectMembers(formattedUsers);
        }
      } catch (fallbackError) {
        console.error("Error in fallback user fetch:", fallbackError);
      }
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update task details" : "Fill in the details to create a new task"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables (Title)</Label>
            <Input
              id="deliverables"
              placeholder="Enter task deliverables"
              value={formData.deliverables}
              onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentUserName}>{currentUserName} (You)</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.full_name}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedBy">Assigned By</Label>
              <Input
                id="assignedBy"
                value={formData.assignedBy}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateAssigned">Date Assigned</Label>
              <Input
                id="dateAssigned"
                type="date"
                value={formData.dateAssigned}
                onChange={(e) => {
                  const newDateAssigned = e.target.value;
                  const calculatedTimelines = calculateTimelines(newDateAssigned, formData.dueDate);
                  setFormData({ ...formData, dateAssigned: newDateAssigned, timelines: calculatedTimelines });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  const newDueDate = e.target.value;
                  const calculatedTimelines = calculateTimelines(formData.dateAssigned, newDueDate);
                  setFormData({ ...formData, dueDate: newDueDate, timelines: calculatedTimelines });
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timelines">Timelines (Auto-calculated)</Label>
            <Input
              id="timelines"
              placeholder="Will be calculated from dates"
              value={formData.timelines}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
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

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
