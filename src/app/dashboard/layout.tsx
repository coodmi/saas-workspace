'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Bypass auth check in demo mode
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key') {
      return;
    }
    if (initialized && !loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, initialized, router]);

  useEffect(() => {
    // Check if user needs onboarding (new user without teams)
    const checkOnboardingStatus = async () => {
      if (user) {
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.id}`);
        if (!hasCompletedOnboarding) {
          // You could also check if user has teams in Firestore
          setShowOnboarding(true);
        }
      }
      setCheckingOnboarding(false);
    };

    if (initialized && !loading && user) {
      checkOnboardingStatus();
    }
  }, [user, loading, initialized]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (loading || !initialized || checkingOnboarding) {
    // Skip loading in demo mode
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key') {
      return (
        <>
          <Onboarding 
            open={false} 
            onComplete={handleOnboardingComplete} 
          />
          <div className="h-screen flex overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
        </>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Allow demo mode access
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key') {
      return (
        <>
          <Onboarding 
            open={false} 
            onComplete={handleOnboardingComplete} 
          />
          <div className="h-screen flex overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
        </>
      );
    }
    return null;
  }

  return (
    <>
      <Onboarding 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
