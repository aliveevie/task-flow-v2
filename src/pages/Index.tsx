import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, BarChart3, Bell } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: CheckCircle2,
      title: "Task Management",
      description: "Create, assign, and track tasks with ease",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members and work together seamlessly",
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Monitor task completion with real-time analytics",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Stay updated with instant task notifications",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TaskFlow</span>
          </div>
          <Button onClick={() => window.location.href = "/auth"}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Streamline Your Team's
            <span className="text-primary block mt-2">Workflow</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A modern task management system designed for efficient team collaboration
            and seamless project tracking.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => window.location.href = "/auth"}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = "/auth"}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help your team stay organized and productive
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-card rounded-xl border shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using TaskFlow to streamline their workflow
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = "/auth"}
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
