'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/stores/auth-store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DEFAULT_PERMISSIONS } from '@/lib/roles';
import { getUserTeams } from '@/lib/firebase/teams';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setCurrentTeam, setLoading, setInitialized, setTeams, setMemberRole, setMemberPermissions } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    // Guard: if auth is not initialized (SSR placeholder) delay subscription
    if (!auth) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;
      try {
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            updatedAt: new Date(),
          });
          try {
            const teams = await getUserTeams(firebaseUser.uid);
            setTeams(teams);
            if (teams.length > 0) {
              const team = teams[0];
              setCurrentTeam(team);
              // Load member role/permissions from Firestore: teams/{teamId}/members/{userId}
              try {
                const memberRef = doc(db, 'teams', team.id, 'members', firebaseUser.uid);
                const snap = await getDoc(memberRef);
                if (snap.exists()) {
                  const data = snap.data() as { role?: 'admin'|'member'|'viewer'; permissions?: string[] };
                  const role = data.role || 'member';
                  setMemberRole(role);
                  setMemberPermissions(data.permissions || DEFAULT_PERMISSIONS[role]);
                } else {
                  // Default to member
                  setMemberRole('member');
                  setMemberPermissions(DEFAULT_PERMISSIONS['member']);
                }
              } catch (e) {
                console.warn('Failed to load member role, defaulting to member', e);
                setMemberRole('member');
                setMemberPermissions(DEFAULT_PERMISSIONS['member']);
              }
            }
          } catch (teamErr) {
            console.error('Error loading teams:', teamErr);
          }
        } else {
          setUser(null);
          setCurrentTeam(null);
          setTeams([]);
        }
      } catch (err) {
        console.error('AuthProvider init error:', err);
        // Fail open: allow UI to render in unauthenticated state
        setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setUser, setCurrentTeam, setLoading, setInitialized, setTeams]);

  return <>{children}</>;
}
