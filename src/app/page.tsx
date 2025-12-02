'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  FolderOpen,
  MessageSquare,
  Layout,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SaaS Workspace</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          All-in-One Workspace
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Combine project management, file sharing, and team communication in one powerful
          platform. Work smarter, not harder.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Replace multiple tools with one integrated platform designed for modern teams.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Layout className="h-8 w-8" />}
            title="Project Management"
            description="Kanban boards, task tracking, due dates, priorities, and more. Keep your projects organized and on track."
          />
          <FeatureCard
            icon={<FolderOpen className="h-8 w-8" />}
            title="File Management"
            description="Upload, organize, and share files with your team. Preview documents, images, and videos right in the app."
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8" />}
            title="Team Chat"
            description="Real-time messaging with channels, direct messages, reactions, and typing indicators. Stay connected."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Team Management"
            description="Invite team members, assign roles, and manage permissions. Keep your workspace secure and organized."
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Notifications"
            description="Never miss an update with in-app and email notifications. Stay informed about task assignments, comments, and more."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Real-time Sync"
            description="All changes sync instantly across devices. See updates in real-time without refreshing."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of teams already using SaaS Workspace to collaborate better.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started for Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SaaS Workspace</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SaaS Workspace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

