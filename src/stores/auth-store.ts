import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User, Team, TeamMember } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  currentTeam: Team | null;
  teams: Team[];
  memberRole?: 'admin' | 'member' | 'viewer' | null;
  memberPermissions?: string[] | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setCurrentTeam: (team: Team | null) => void;
  setTeams: (teams: Team[]) => void;
  setMemberRole: (role: 'admin' | 'member' | 'viewer' | null) => void;
  setMemberPermissions: (perms: string[] | null) => void;
  setLoading: (loading: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  getUserRole: () => TeamMember['role'] | null;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  currentTeam: null,
  teams: [],
  memberRole: null,
  memberPermissions: null,
  loading: true,
  initialized: false,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setCurrentTeam: (currentTeam) => set({ currentTeam }),
  setTeams: (teams) => set({ teams }),
  setMemberRole: (memberRole) => set({ memberRole }),
  setMemberPermissions: (memberPermissions) => set({ memberPermissions }),
  setLoading: (loading) => set({ loading }),
  setIsLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  getUserRole: () => {
    const { user, currentTeam } = get();
    if (!user || !currentTeam) return null;
    const member = currentTeam.members.find((m) => m.userId === user.id);
    return member?.role || null;
  },
  reset: () =>
    set({
      user: null,
      firebaseUser: null,
      currentTeam: null,
      teams: [],
      memberRole: null,
      memberPermissions: null,
      loading: false,
      isAuthenticated: false,
    }),
}));
