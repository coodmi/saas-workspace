import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(result.user, { displayName });
    
    // Create user document in Firestore
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(userRef, {
      email: result.user.email,
      displayName: displayName,
      photoURL: result.user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return result;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Update Firebase Auth profile
  await updateProfile(currentUser, updates);

  // Update Firestore user document
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Update user password
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('Not authenticated');

  // Re-authenticate user first
  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);

  // Update password
  await firebaseUpdatePassword(currentUser, newPassword);
}

// Delete user account
export async function deleteAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Delete Firestore user document
  await deleteDoc(doc(db, 'users', currentUser.uid));

  // Delete Firebase Auth user
  await deleteUser(currentUser);
}

// Create user document in Firestore
export async function createUserDocument(
  userId: string,
  email: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email,
    displayName,
    photoURL: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
