'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/stores/auth-store';
import { User } from '@/types';

export function useAuth() {
  const {
    user,
    firebaseUser,
    currentTeam,
    teams,
    loading,
    initialized,
    setUser,
    setFirebaseUser,
    setLoading,
    setInitialized,
    getUserRole,
    reset,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          const userData = await getOrCreateUser(firebaseUser);
          setUser(userData);
        } else {
          reset();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        reset();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUser, setLoading, setInitialized, reset]);

  return {
    user,
    firebaseUser,
    currentTeam,
    teams,
    loading,
    initialized,
    isAuthenticated: !!user,
    userRole: getUserRole(),
  };
}

async function getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  const newUser: Omit<User, 'id'> = {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(userRef, {
    ...newUser,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: firebaseUser.uid,
    ...newUser,
  };
}
