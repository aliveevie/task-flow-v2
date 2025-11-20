import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = "http://10.1.1.205:3000/api";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  
  // Check for invitation token or messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invitation');
    const action = params.get('action');
    const message = params.get('message');
    
    if (token) {
      setInvitationToken(token);
      toast.info("Please create an account to accept the project invitation");
    }
    
    if (action === 'accept-invitation' && token) {
      toast.success("Email verified! Please login to complete your project invitation.");
      setInvitationToken(token);
    }
    
    if (message === 'invitation-accepted') {
      toast.success("Invitation accepted! Please login to access your projects.");
    }
  }, []);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        // Store user data and token
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("sessionToken", data.data.sessionToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        toast.success(`Welcome back, ${data.data.user.full_name}!`);
        
        // Check if there's a pending invitation to accept
        const tokenToAccept = data.data.invitation_token || invitationToken;
        if (tokenToAccept) {
          // Accept the invitation after login
          try {
            const acceptResponse = await fetch(`${API_URL}/invitations/accept`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${data.data.token}`
              },
              body: JSON.stringify({ token: tokenToAccept })
            });

            const acceptResult = await acceptResponse.json();
            
            if (acceptResult.success) {
              toast.success(`Invitation accepted! Redirecting to project...`);
              setTimeout(() => {
                window.location.href = `/projects/${acceptResult.data.project_id}/tasks`;
              }, 1000);
            } else {
              toast.error(acceptResult.error || "Failed to accept invitation");
              // Redirect to user dashboard if invitation acceptance fails
              setTimeout(() => {
                if (data.data.user.role === "admin") {
                  window.location.href = "/admin";
                } else {
                  window.location.href = "/user";
                }
              }, 1000);
            }
          } catch (acceptError) {
            console.error("Error accepting invitation:", acceptError);
            toast.error("Failed to accept invitation");
            // Redirect to user dashboard
            setTimeout(() => {
              if (data.data.user.role === "admin") {
                window.location.href = "/admin";
              } else {
                window.location.href = "/user";
              }
            }, 1000);
          }
          return;
        }
        
        // Redirect based on role
        setTimeout(() => {
          if (data.data.user.role === "admin") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/user";
          }
        }, 500);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (data.success) {
        // If user has pending invitation, they don't need email verification
        if (data.data.verification_required === false && data.data.invitation_token) {
          // Auto-login the user and accept invitation
          try {
            // First, login the user
            const loginResponse = await fetch(`${API_URL}/auth/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email: registerData.email,
                password: registerData.password
              })
            });

            const loginData = await loginResponse.json();

            if (loginData.success) {
              // Store user data and token
              localStorage.setItem("token", loginData.data.token);
              localStorage.setItem("sessionToken", loginData.data.sessionToken);
              localStorage.setItem("user", JSON.stringify(loginData.data.user));

              // Accept the invitation
              const acceptResponse = await fetch(`${API_URL}/invitations/accept`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${loginData.data.token}`
                },
                body: JSON.stringify({ token: data.data.invitation_token })
              });

              const acceptResult = await acceptResponse.json();
              
              if (acceptResult.success) {
                toast.success("Account created and invitation accepted! Redirecting to project...");
                setTimeout(() => {
                  window.location.href = `/projects/${acceptResult.data.project_id}/tasks`;
                }, 1000);
              } else {
                toast.error(acceptResult.error || "Failed to accept invitation");
                setTimeout(() => {
                  window.location.href = "/user";
                }, 1000);
              }
            } else {
              toast.error("Registration successful but login failed. Please login manually.");
              setRegisteredEmail(registerData.email);
              setShowVerificationMessage(false);
            }
          } catch (error) {
            console.error("Error during auto-login:", error);
            toast.error("Registration successful but auto-login failed. Please login manually.");
            setRegisteredEmail(registerData.email);
            setShowVerificationMessage(false);
          }
        } else {
          // Normal registration flow with email verification
          setRegisteredEmail(registerData.email);
          setShowVerificationMessage(true);
          
          if (invitationToken) {
            toast.success("Registration successful! Please check your email and verify, then accept the invitation.");
          } else {
            toast.success("Registration successful! Please check your email to verify your account.");
          }
        }
        
        // Reset form
        setRegisterData({
          full_name: "",
          email: "",
          password: ""
        });
      } else {
        toast.error(data.error || data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">TaskFlow</h1>
          <p className="text-muted-foreground">Streamline your team's workflow</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome to TaskFlow</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {showVerificationMessage && (
              <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Check your email!</strong><br />
                  We've sent a verification link to <strong>{registeredEmail}</strong>. 
                  Please verify your email before logging in.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.full_name}
                      onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By registering, you'll receive a verification email to activate your account.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
