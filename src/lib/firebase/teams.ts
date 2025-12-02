import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Team, TeamMember, TeamInvitation, TeamActivity, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Team CRUD Operations
export async function createTeam(
  name: string,
  description: string,
  ownerId: string
): Promise<Team> {
  const teamRef = doc(collection(db, 'teams'));
  const now = new Date();

  const teamData = {
    name,
    description,
    ownerId,
    members: [
      {
        userId: ownerId,
        role: 'admin' as UserRole,
        joinedAt: Timestamp.fromDate(now),
        invitedBy: ownerId,
      },
    ],
    settings: {
      allowGuestAccess: false,
      defaultMemberRole: 'member' as UserRole,
      notificationsEnabled: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(teamRef, teamData);

  return {
    id: teamRef.id,
    ...teamData,
    members: [
      {
        userId: ownerId,
        role: 'admin',
        joinedAt: now,
        invitedBy: ownerId,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) return null;

  const data = teamSnap.data();
  return {
    id: teamSnap.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    members: data.members.map((m: TeamMember & { joinedAt: Timestamp }) => ({
      ...m,
      joinedAt: m.joinedAt.toDate(),
    })),
    settings: data.settings,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const teamsRef = collection(db, 'teams');
  const q = query(
    teamsRef,
    where('members', 'array-contains', { userId }),
    orderBy('createdAt', 'desc')
  );

  // Since array-contains doesn't work with objects, we need a different approach
  const allTeamsSnap = await getDocs(collection(db, 'teams'));
  const teams: Team[] = [];

  allTeamsSnap.forEach((doc) => {
    const data = doc.data();
    const isMember = data.members.some((m: TeamMember) => m.userId === userId);
    if (isMember) {
      teams.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        members: data.members.map((m: TeamMember & { joinedAt: Timestamp }) => ({
          ...m,
          joinedAt: m.joinedAt?.toDate() || new Date(),
        })),
        settings: data.settings,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    }
  });

  return teams;
}

export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description' | 'settings'>>
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(teamId: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await deleteDoc(teamRef);
}

// Team Member Operations
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: UserRole,
  invitedBy: string
): Promise<void> {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');

  const newMember: TeamMember = {
    userId,
    role,
    joinedAt: new Date(),
    invitedBy,
  };

  const updatedMembers = [...team.members, newMember];

  await updateDoc(doc(db, 'teams', teamId), {
    members: updatedMembers.map((m) => ({
      ...m,
      joinedAt: Timestamp.fromDate(m.joinedAt),
    })),
    updatedAt: serverTimestamp(),
  });
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');

  const updatedMembers = team.members.filter((m) => m.userId !== userId);

  await updateDoc(doc(db, 'teams', teamId), {
    members: updatedMembers.map((m) => ({
      ...m,
      joinedAt: Timestamp.fromDate(m.joinedAt),
    })),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  newRole: UserRole
): Promise<void> {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');

  const updatedMembers = team.members.map((m) =>
    m.userId === userId ? { ...m, role: newRole } : m
  );

  await updateDoc(doc(db, 'teams', teamId), {
    members: updatedMembers.map((m) => ({
      ...m,
      joinedAt: Timestamp.fromDate(m.joinedAt),
    })),
    updatedAt: serverTimestamp(),
  });
}

// Team Invitation Operations
export async function createInvitation(
  teamId: string,
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<TeamInvitation> {
  const invitationRef = doc(collection(db, 'invitations'));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation: Omit<TeamInvitation, 'id'> = {
    teamId,
    email,
    role,
    invitedBy,
    status: 'pending',
    createdAt: now,
    expiresAt,
  };

  await setDoc(invitationRef, {
    ...invitation,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  return {
    id: invitationRef.id,
    ...invitation,
  };
}

export async function getInvitationsByEmail(
  email: string
): Promise<TeamInvitation[]> {
  const invitationsRef = collection(db, 'invitations');
  const q = query(
    invitationsRef,
    where('email', '==', email),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      teamId: data.teamId,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      status: data.status,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
    };
  });
}

export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const invitationRef = doc(db, 'invitations', invitationId);
  const invitationSnap = await getDoc(invitationRef);

  if (!invitationSnap.exists()) throw new Error('Invitation not found');

  const invitation = invitationSnap.data();

  await addTeamMember(
    invitation.teamId,
    userId,
    invitation.role,
    invitation.invitedBy
  );

  await updateDoc(invitationRef, { status: 'accepted' });
}

export async function declineInvitation(invitationId: string): Promise<void> {
  const invitationRef = doc(db, 'invitations', invitationId);
  await updateDoc(invitationRef, { status: 'declined' });
}

// Team Activity Logging
export async function logTeamActivity(
  teamId: string,
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  const activityRef = collection(db, 'teams', teamId, 'activities');
  await addDoc(activityRef, {
    userId,
    action,
    details,
    createdAt: serverTimestamp(),
  });
}

export async function getTeamActivities(
  teamId: string,
  limit: number = 50
): Promise<TeamActivity[]> {
  const activitiesRef = collection(db, 'teams', teamId, 'activities');
  const q = query(activitiesRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      teamId,
      userId: data.userId,
      action: data.action,
      details: data.details,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

// Get team members as a flat list
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const team = await getTeam(teamId);
  if (!team) return [];
  return team.members;
}

// Get team invitations
export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  const invitationsRef = collection(db, 'invitations');
  const q = query(invitationsRef, where('teamId', '==', teamId));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      teamId: data.teamId,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      status: data.status,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
    };
  });
}

// Invite team member by email
export async function inviteTeamMember(
  teamId: string,
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<TeamInvitation> {
  return createInvitation(teamId, email, role, invitedBy);
}

// Cancel invitation
export async function cancelInvitation(invitationId: string): Promise<void> {
  const invitationRef = doc(db, 'invitations', invitationId);
  await deleteDoc(invitationRef);
}

// Get invitation by ID with team details
export async function getTeamInvitation(invitationId: string): Promise<(TeamInvitation & { team?: Team }) | null> {
  const invitationRef = doc(db, 'invitations', invitationId);
  const invitationSnap = await getDoc(invitationRef);
  
  if (!invitationSnap.exists()) return null;
  
  const data = invitationSnap.data();
  const team = await getTeam(data.teamId);
  
  return {
    id: invitationSnap.id,
    teamId: data.teamId,
    email: data.email,
    role: data.role,
    invitedBy: data.invitedBy,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    expiresAt: data.expiresAt?.toDate() || new Date(),
    team: team || undefined,
  };
}

// Accept team invitation
export async function acceptTeamInvitation(invitationId: string, userId: string): Promise<void> {
  return acceptInvitation(invitationId, userId);
}

// Get team activity logs
export async function getTeamActivityLogs(teamId: string): Promise<any[]> {
  return getTeamActivities(teamId, 100);
}

// Share file with users (delegated to files service)
export async function shareFileWithUsers(fileId: string, userIds: string[]): Promise<void> {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, {
    sharedWith: userIds,
    updatedAt: serverTimestamp(),
  });
}
