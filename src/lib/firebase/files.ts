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
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  uploadBytes,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { FileItem, Folder } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Folder Operations
export async function createFolder(
  teamId: string,
  name: string,
  createdBy: string,
  parentId?: string
): Promise<Folder> {
  const folderRef = doc(collection(db, 'folders'));
  const now = new Date();

  const folderData = {
    teamId,
    name,
    parentId: parentId || null,
    createdBy,
    sharedWith: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(folderRef, folderData);

  return {
    id: folderRef.id,
    ...folderData,
    parentId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getFolder(folderId: string): Promise<Folder | null> {
  const folderRef = doc(db, 'folders', folderId);
  const folderSnap = await getDoc(folderRef);

  if (!folderSnap.exists()) return null;

  const data = folderSnap.data();
  return {
    id: folderSnap.id,
    teamId: data.teamId,
    name: data.name,
    parentId: data.parentId,
    createdBy: data.createdBy,
    sharedWith: data.sharedWith || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getTeamFolders(
  teamId: string,
  parentId?: string
): Promise<Folder[]> {
  const foldersRef = collection(db, 'folders');
  try {
    const q = query(
      foldersRef,
      where('teamId', '==', teamId),
      where('parentId', '==', parentId || null),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        name: data.name,
        parentId: data.parentId,
        createdBy: data.createdBy,
        sharedWith: data.sharedWith || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    const needsIndex = error.code === 'failed-precondition' || (error.message || '').includes('index');
    if (!needsIndex) throw err;
    console.warn('Missing composite index for folders query. Falling back without orderBy.');
    const fallbackQ = query(
      foldersRef,
      where('teamId', '==', teamId),
      where('parentId', '==', parentId || null)
    );
    const snapshot = await getDocs(fallbackQ);
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        name: data.name,
        parentId: data.parentId,
        createdBy: data.createdBy,
        sharedWith: data.sharedWith || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Folder;
    });
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Pick<Folder, 'name' | 'parentId' | 'sharedWith'>>
): Promise<void> {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  // Get all files in the folder and delete them from storage
  const files = await getFilesInFolder(folderId);
  for (const file of files) {
    await deleteFile(file.id);
  }

  // Get all subfolders and delete them recursively
  const subfolders = await getTeamFolders(
    (await getFolder(folderId))?.teamId || '',
    folderId
  );
  for (const subfolder of subfolders) {
    await deleteFolder(subfolder.id);
  }

  // Delete the folder itself
  const folderRef = doc(db, 'folders', folderId);
  await deleteDoc(folderRef);
}

// File Operations
export async function uploadFile(
  teamId: string,
  file: File,
  uploadedBy: string,
  folderId?: string,
  onProgress?: (progress: number) => void,
  timeoutMs: number = 120000
): Promise<FileItem> {
  const fileId = uuidv4();
  const storagePath = `teams/${teamId}/files/${fileId}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    // Basic validation
    if (!teamId) {
      reject(new Error('Missing teamId for file upload'));
      return;
    }
    if (!storage) {
      reject(new Error('Firebase storage not initialized'));
      return;
    }

    // Preflight storage availability check (attempt lightweight list on bucket root)
    const rootRef = ref(storage, `teams/${teamId}`);
    listAll(rootRef).catch((err) => {
      console.warn('Storage preflight list failed (may be ok):', err);
    });

    // Permission preflight: attempt tiny blob write & delete
    const permTestRef = ref(storage, `teams/${teamId}/__perm_test.txt`);
    const permBlob = new Blob(["perm"], { type: 'text/plain' });
    uploadBytes(permTestRef, permBlob)
      .then(() => deleteObject(permTestRef).catch(() => {}))
      .catch((e) => {
        const msg = (e && (e.message || e.code)) ? String(e.message || e.code) : 'Storage permission denied';
        reject(new Error('Storage permission check failed: ' + msg));
      });

    const uploadTask = uploadBytesResumable(storageRef, file);
    const start = Date.now();
    let lastBytes = 0;
    const timer = setTimeout(() => {
      try {
        console.warn('Upload timeout reached, rejecting promise.');
        reject(new Error('Upload timed out'));
      } catch (_) {}
    }, timeoutMs);
    // Stall detection (5s no progress)
    const stallMs = 5000;
    const stallCheck = setTimeout(() => {
      const bytesTransferred = (uploadTask as any).snapshot?.bytesTransferred || 0;
      if (bytesTransferred === 0) {
        console.warn('Upload stalled (0 bytes after 5s).');
        reject(new Error('Upload stalled: no data transferred. Possible Storage rules or network issue.'));
      }
    }, stallMs);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
        // simple progress logging if stall was broken
        if (snapshot.bytesTransferred > lastBytes) {
          lastBytes = snapshot.bytesTransferred;
        }
      },
      (error) => {
        clearTimeout(timer);
        clearTimeout(stallCheck);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const now = new Date();

          const fileData = {
            teamId,
            folderId: folderId || null,
            name: file.name,
            type: file.type,
            size: file.size,
            url,
            storagePath,
            uploadedBy,
            sharedWith: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const fileRef = doc(db, 'files', fileId);
          await setDoc(fileRef, fileData);
          clearTimeout(timer);
          clearTimeout(stallCheck);
          resolve({
            id: fileId,
            ...fileData,
            folderId,
            createdAt: now,
            updatedAt: now,
          });
        } catch (error) {
          clearTimeout(timer);
          clearTimeout(stallCheck);
          reject(error);
        }
      }
    );
  });
}

export async function getFile(fileId: string): Promise<FileItem | null> {
  const fileRef = doc(db, 'files', fileId);
  const fileSnap = await getDoc(fileRef);

  if (!fileSnap.exists()) return null;

  const data = fileSnap.data();
  return {
    id: fileSnap.id,
    teamId: data.teamId,
    folderId: data.folderId,
    name: data.name,
    type: data.type,
    size: data.size,
    url: data.url,
    storagePath: data.storagePath,
    uploadedBy: data.uploadedBy,
    sharedWith: data.sharedWith || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getFilesInFolder(folderId?: string): Promise<FileItem[]> {
  const filesRef = collection(db, 'files');
  try {
    const q = query(
      filesRef,
      where('folderId', '==', folderId || null),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        folderId: data.folderId,
        name: data.name,
        type: data.type,
        size: data.size,
        url: data.url,
        storagePath: data.storagePath,
        uploadedBy: data.uploadedBy,
        sharedWith: data.sharedWith || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    const needsIndex = error.code === 'failed-precondition' || (error.message || '').includes('index');
    if (!needsIndex) throw err;
    console.warn('Missing composite index for files query. Falling back without orderBy.');
    const fallbackQ = query(
      filesRef,
      where('folderId', '==', folderId || null)
    );
    const snapshot = await getDocs(fallbackQ);
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        folderId: data.folderId,
        name: data.name,
        type: data.type,
        size: data.size,
        url: data.url,
        storagePath: data.storagePath,
        uploadedBy: data.uploadedBy,
        sharedWith: data.sharedWith || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FileItem;
    });
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }
}

export async function getTeamFiles(teamId: string): Promise<FileItem[]> {
  const filesRef = collection(db, 'files');
  const q = query(filesRef, where('teamId', '==', teamId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      teamId: data.teamId,
      folderId: data.folderId,
      name: data.name,
      type: data.type,
      size: data.size,
      url: data.url,
      storagePath: data.storagePath,
      uploadedBy: data.uploadedBy,
      sharedWith: data.sharedWith || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

export async function updateFile(
  fileId: string,
  updates: Partial<Pick<FileItem, 'name' | 'folderId' | 'sharedWith'>>
): Promise<void> {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  const file = await getFile(fileId);
  if (!file) return;

  // Delete from storage
  const storageRef = ref(storage, file.storagePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }

  // Delete from Firestore
  const fileRef = doc(db, 'files', fileId);
  await deleteDoc(fileRef);
}

export async function shareFile(
  fileId: string,
  userIds: string[]
): Promise<void> {
  const file = await getFile(fileId);
  if (!file) throw new Error('File not found');

  const combined = [...file.sharedWith, ...userIds];
  const uniqueUserIds = Array.from(new Set(combined));
  await updateFile(fileId, { sharedWith: uniqueUserIds });
}

export async function unshareFile(
  fileId: string,
  userId: string
): Promise<void> {
  const file = await getFile(fileId);
  if (!file) throw new Error('File not found');

  await updateFile(fileId, {
    sharedWith: file.sharedWith.filter((id) => id !== userId),
  });
}

export async function searchFiles(
  teamId: string,
  searchQuery: string
): Promise<FileItem[]> {
  const files = await getTeamFiles(teamId);
  const query = searchQuery.toLowerCase();

  return files.filter(
    (file) =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
  );
}

// Get folder path (breadcrumb)
export async function getFolderPath(folderId: string): Promise<Folder[]> {
  const path: Folder[] = [];
  let currentFolderId: string | undefined = folderId;

  while (currentFolderId) {
    const folder = await getFolder(currentFolderId);
    if (!folder) break;
    path.unshift(folder);
    currentFolderId = folder.parentId;
  }

  return path;
}
