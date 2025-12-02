'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { acceptTeamInvitation, getTeamInvitation } from '@/lib/firebase/teams';
import { TeamInvitation, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [invitation, setInvitation] = useState<(TeamInvitation & { team?: Team }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteId = params?.id as string;

  useEffect(() => {
    if (inviteId) {
      loadInvitation();
    }
  }, [inviteId]);

  const loadInvitation = async () => {
    setLoading(true);
    try {
      const data = await getTeamInvitation(inviteId);
      if (!data) {
        setError('Invitation not found');
      } else if (data.status === 'accepted') {
        setError('This invitation has already been accepted');
      } else if (data.status === 'expired' || new Date(data.expiresAt) < new Date()) {
        setError('This invitation has expired');
      } else if (data.status === 'cancelled') {
        setError('This invitation has been cancelled');
      } else {
        setInvitation(data);
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      setError(`This invitation was sent to ${invitation.email}. Please sign in with that email address.`);
      return;
    }

    setAccepting(true);
    try {
      await acceptTeamInvitation(inviteId, user.id);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitation?.team?.name || 'the team'}. Redirecting you to
              the dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              You've been invited to join{' '}
              <span className="font-semibold">{invitation?.team?.name || 'a team'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="space-y-2">
              <Link href={`/auth/login?redirect=/invite/${inviteId}`} className="block">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href={`/auth/signup?redirect=/invite/${inviteId}`} className="block">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              Invitation sent to: {invitation?.email}
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {invitation?.team?.name || 'Team'}</CardTitle>
          <CardDescription>
            You've been invited to join as a{' '}
            <span className="font-semibold capitalize">{invitation?.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{invitation?.team?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {invitation?.team?.description || 'No description'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Expires:{' '}
                {invitation?.expiresAt
                  ? new Date(invitation.expiresAt).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>

            {user?.email !== invitation?.email && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p>
                  This invitation was sent to <strong>{invitation?.email}</strong>. You're signed in
                  as <strong>{user?.email}</strong>.
                </p>
                <p className="mt-2">
                  Please sign in with the invited email address to accept this invitation.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Decline
            </Button>
          </Link>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={accepting || user?.email !== invitation?.email}
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
