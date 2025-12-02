'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { createTeam } from '@/lib/firebase/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Building2,
  Users,
  FolderKanban,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const router = useRouter();
  const { user, setCurrentTeam } = useAuthStore();
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;

    setLoading(true);
    try {
      const team = await createTeam(teamName.trim(), user.id, teamDescription.trim());
      setCurrentTeam(team);
      setStep(4);
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    router.push('/dashboard');
  };

  if (!open) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Progress value={progress} className="w-48 h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
          </CardHeader>

          <CardContent className="p-8">
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">Welcome to SaaS Workspace!</CardTitle>
                  <CardDescription className="text-lg">
                    Let&apos;s get you set up in just a few steps. We&apos;ll help you create your first team
                    and show you around.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 rounded-lg border bg-card text-left">
                    <FolderKanban className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">Project Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Kanban boards, tasks, and deadlines
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-left">
                    <Users className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite members, assign roles
                  </p>
                </div>
              </div>
              <Button onClick={() => setStep(2)} size="lg" className="mt-4">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Create Your Team</CardTitle>
                <CardDescription>
                  Teams help you organize projects and collaborate with others.
                </CardDescription>
              </div>

              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g., Marketing Team, Product Development"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Textarea
                    id="team-description"
                    placeholder="What does your team work on?"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!teamName.trim()}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Invite Your Team</CardTitle>
                <CardDescription>
                  You can invite team members now or do it later from settings.
                </CardDescription>
              </div>

              <div className="p-6 rounded-lg border bg-muted/30 text-center">
                <p className="text-muted-foreground mb-4">
                  After creating your team, you can invite members from the Team Settings page.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Email invitations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Role assignment</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleCreateTeam} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Team <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">You're All Set!</CardTitle>
                <CardDescription className="text-lg">
                  Your team "<span className="font-semibold">{teamName}</span>" has been created.
                  You're ready to start collaborating!
                </CardDescription>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <FolderKanban className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Create Projects</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Invite Members</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Start Chatting</p>
                </div>
              </div>

              <Button onClick={handleComplete} size="lg" className="mt-4">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
