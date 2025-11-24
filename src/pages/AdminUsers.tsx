import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Mail, MoreVertical, Shield, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InviteUsersModal from "@/components/projects/InviteUsersModal";
import { toast } from "sonner";

const API_URL = "https://api.galaxyitt.com.ng/api";

const AdminUsers = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchPendingInvites();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const response = await fetch(`${API_URL}/invitations/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setPendingInvites(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching pending invites:", error);
    }
  };

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteUsers = async (emails: string[]) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("User not found");
        return;
      }

      const user = JSON.parse(userData);
      
      // Get all projects to invite users to (or you can select a specific project)
      // For now, we'll need to get projects - but this should ideally be project-specific
      // Let's create invitations for all projects the admin created
      const projectsResponse = await fetch(`${API_URL}/projects/created/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const projectsResult = await projectsResponse.json();
      
      if (!projectsResult.success || projectsResult.data.length === 0) {
        toast.error("No projects found. Please create a project first.");
        return;
      }

      // For now, invite to the first project (you can enhance this later)
      const projectId = projectsResult.data[0].id;

      const invitePromises = emails.map(email =>
        fetch(`${API_URL}/projects/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            project_id: projectId,
            invitee_email: email,
            inviter_id: user.id,
            message: "You've been invited to join this project"
          })
        })
      );

      await Promise.all(invitePromises);
      
      toast.success(`Invitations sent to ${emails.length} user(s)!`);
      setIsInviteModalOpen(false);
      fetchUsers();
      fetchPendingInvites();
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast.error("Failed to send invitations");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    // This would remove user from all projects
    // You might want to make this project-specific
    toast.info("User removal functionality - to be implemented per project");
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole.toLowerCase() })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User role updated successfully!");
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Invite and manage team members</p>
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)} className="shadow-md">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.status === "Active").length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvites.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Team Members ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user access and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.role === "Admin" ? (
                        <Shield className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === "Active" ? "default" : "outline"}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.tasksCount} tasks assigned
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeRole(user.id, user.role === "Admin" ? "User" : "Admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        {user.role === "Admin" ? "Remove Admin" : "Make Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-destructive"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Remove User
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

      {/* Invite Users Modal */}
      <InviteUsersModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSubmit={handleInviteUsers}
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
