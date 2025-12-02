import { create } from 'zustand';
import { FileItem, Folder } from '@/types';

interface FileState {
  folders: Folder[];
  files: FileItem[];
  currentFolder: Folder | null;
  selectedItems: string[];
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  setFolders: (folders: Folder[]) => void;
  setFiles: (files: FileItem[]) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  setSelectedItems: (ids: string[]) => void;
  toggleSelectItem: (id: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'date' | 'size' | 'type') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  addFile: (file: FileItem) => void;
  addFolder: (folder: Folder) => void;
  updateFile: (fileId: string, updates: Partial<FileItem>) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  deleteFile: (fileId: string) => void;
  deleteFolder: (folderId: string) => void;
  getFilesInFolder: (folderId?: string) => FileItem[];
  getFoldersInFolder: (parentId?: string) => Folder[];
  reset: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  folders: [],
  files: [],
  currentFolder: null,
  selectedItems: [],
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  searchQuery: '',
  uploading: false,
  uploadProgress: 0,
  uploadError: null,
  setFolders: (folders) => set({ folders }),
  setFiles: (files) => set({ files }),
  setCurrentFolder: (currentFolder) => set({ currentFolder }),
  setSelectedItems: (selectedItems) => set({ selectedItems }),
  toggleSelectItem: (id) => {
    const { selectedItems } = get();
    if (selectedItems.includes(id)) {
      set({ selectedItems: selectedItems.filter((item) => item !== id) });
    } else {
      set({ selectedItems: [...selectedItems, id] });
    }
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setUploading: (uploading) => set({ uploading }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setUploadError: (uploadError) => set({ uploadError }),
  addFile: (file) => set({ files: [...get().files, file] }),
  addFolder: (folder) => set({ folders: [...get().folders, folder] }),
  updateFile: (fileId, updates) => {
    const files = get().files.map((f) =>
      f.id === fileId ? { ...f, ...updates } : f
    );
    set({ files });
  },
  updateFolder: (folderId, updates) => {
    const folders = get().folders.map((f) =>
      f.id === folderId ? { ...f, ...updates } : f
    );
    set({ folders });
  },
  deleteFile: (fileId) => {
    set({ files: get().files.filter((f) => f.id !== fileId) });
  },
  deleteFolder: (folderId) => {
    set({ folders: get().folders.filter((f) => f.id !== folderId) });
  },
  getFilesInFolder: (folderId) => {
    return get().files.filter((f) => f.folderId === folderId);
  },
  getFoldersInFolder: (parentId) => {
    return get().folders.filter((f) => f.parentId === parentId);
  },
  reset: () =>
    set({
      folders: [],
      files: [],
      currentFolder: null,
      selectedItems: [],
      searchQuery: '',
      uploading: false,
      uploadProgress: 0,
    }),
}));
