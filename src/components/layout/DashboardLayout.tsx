import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, LogOut, Menu, LayoutDashboard, CheckCircle2, Users, Settings, FolderKanban, ArrowLeftRight, User, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "user";
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const API_URL = "https://api.galaxyitt.com.ng/api";

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [createdProjects, setCreatedProjects] = useState<any[]>([]);
  const [invitedProjects, setInvitedProjects] = useState<any[]>([]);

  const currentPath = window.location.pathname;

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchUserProjects(user.id);
      fetchNotificationCount(user.id);
    }
  }, []);

  const fetchNotificationCount = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      if (result.success) {
        const unreadCount = result.data.filter((n: any) => !n.read).length;
        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const fetchUserProjects = async (userId: string) => {
    try {
      // Fetch created projects
      const createdResponse = await fetch(`${API_URL}/projects/created/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const createdResult = await createdResponse.json();
      if (createdResult.success) {
        setCreatedProjects(createdResult.data || []);
      }

      // Fetch invited projects
      const invitedResponse = await fetch(`${API_URL}/projects/invited/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const invitedResult = await invitedResponse.json();
      if (invitedResult.success) {
        setInvitedProjects(invitedResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching user projects:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionToken })
      });

      localStorage.removeItem("token");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");
      
      toast.success("Logged out successfully!");
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local data even if API fails
      localStorage.removeItem("token");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = role === "admin"
    ? [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Projects", href: "/admin/projects", icon: FolderKanban },
        { name: "Tasks", href: "/admin/tasks", icon: CheckCircle2 },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Notifications", href: "/admin/notifications", icon: Bell },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ]
    : [
        { name: "My Tasks", href: "/user", icon: CheckCircle2 },
        { name: "Notifications", href: "/user/notifications", icon: Bell },
        { name: "Settings", href: "/user/settings", icon: Settings },
      ];

  const NavContent = () => (
    <nav className="space-y-4">
      {/* Main Navigation */}
      <div className="space-y-1">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </a>
          );
        })}
      </div>

      {/* Created Projects Section */}
      {createdProjects.length > 0 && (
        <div className="border-t pt-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Created Projects
          </p>
          <div className="space-y-1">
            {createdProjects.slice(0, 5).map((project) => (
              <a
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              >
                <FolderKanban className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{project.title}</span>
              </a>
            ))}
            {createdProjects.length > 5 && (
              <a
                href="/admin/projects"
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                +{createdProjects.length - 5} more
              </a>
            )}
          </div>
        </div>
      )}

      {/* Invited Projects Section */}
      {invitedProjects.length > 0 && (
        <div className="border-t pt-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Invited Projects
          </p>
          <div className="space-y-1">
            {invitedProjects.slice(0, 5).map((project) => (
              <a
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              >
                <UserPlus className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{project.title}</span>
              </a>
            ))}
            {invitedProjects.length > 5 && (
              <a
                href="/admin/projects"
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                +{invitedProjects.length - 5} more
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">TaskFlow</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">TaskFlow</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => window.location.href = role === "admin" ? "/admin/notifications" : "/user/notifications"}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {notificationCount}
                </Badge>
              )}
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser ? getInitials(currentUser.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex text-sm font-medium">
                    {currentUser?.full_name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                    <Badge variant="outline" className="w-fit mt-1">
                      {currentUser?.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* View Switcher for Admins */}
                {currentUser?.role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin View</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/user"}>
                      <User className="mr-2 h-4 w-4" />
                      <span>User View</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={() => window.location.href = role === "admin" ? "/admin/settings" : "/user/settings"}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container flex gap-6 px-4 py-6">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 space-y-4">
            <Card className="p-4 shadow-md">
              <NavContent />
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-card rounded-lg border ${className}`}>
    {children}
  </div>
);

export default DashboardLayout;
