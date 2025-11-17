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
    }

    // Fetch project members if projectId is provided
    if (projectId && open) {
      fetchProjectMembers();
    }

    if (initialData) {
      setFormData({
        deliverables: initialData.deliverables || "",
        description: initialData.description || "",
        assignedTo: initialData.assignedTo || "",
        assignedBy: initialData.assignedBy || "",
        dateAssigned: initialData.dateAssigned || "",
        dueDate: initialData.dueDate || "",
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
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setProjectMembers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
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
                onChange={(e) => setFormData({ ...formData, dateAssigned: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timelines">Timelines</Label>
            <Input
              id="timelines"
              placeholder="e.g., 2 weeks, 1 month"
              value={formData.timelines}
              onChange={(e) => setFormData({ ...formData, timelines: e.target.value })}
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
