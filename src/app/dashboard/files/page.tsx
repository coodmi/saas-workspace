"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useFileStore } from '@/stores/file-store';
import { hasPermission, Permission } from '@/lib/roles';
import {
  getTeamFolders,
  getFilesInFolder,
  createFolder,
  uploadFile,
  deleteFile,
  deleteFolder,
  getFolderPath,
  updateFile,
  updateFolder as updateFolderFirebase,
} from '@/lib/firebase/files';
import { FileItem, Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ShareFileDialog } from '@/components/files/share-file-dialog';
import {
  Upload,
  FolderPlus,
  File,
  Folder as FolderIcon,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Edit,
  Grid3x3,
  List,
  Search,
  Loader2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Home,
  ChevronRight,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { format } from 'date-fns';

export default function FilesPage() {
  const { currentTeam, user, memberRole, memberPermissions } = useAuthStore();
  const {
    folders,
    files,
    currentFolder,
    viewMode,
    searchQuery,
    uploading,
    uploadProgress,
    setFolders,
    setFiles,
    setCurrentFolder,
    setSelectedItems,
    setViewMode,
    setSearchQuery,
    setUploading,
    setUploadProgress,
    addFile,
    addFolder,
    deleteFile: deleteFileStore,
    deleteFolder: deleteFolderStore,
  } = useFileStore();

  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingItem, setRenamingItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Default to true if role is not yet loaded but user is logged in, otherwise check permission
  const canUpload = !memberRole ? !!user : hasPermission(memberRole, memberPermissions as Permission[] | undefined, 'files.upload');
  const canDelete = !memberRole ? !!user : hasPermission(memberRole, memberPermissions as Permission[] | undefined, 'files.delete');
  const canShare = !memberRole ? !!user : hasPermission(memberRole, memberPermissions as Permission[] | undefined, 'files.share');

  useEffect(() => {
    if (currentTeam) {
      loadData();
    }
  }, [currentTeam, currentFolder]);

  const loadData = async () => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const [foldersData, filesData] = await Promise.all([
        getTeamFolders(currentTeam.id, currentFolder?.id),
        getFilesInFolder(currentFolder?.id),
      ]);
      setFolders(foldersData);
      setFiles(filesData);

      if (currentFolder) {
        const path = await getFolderPath(currentFolder.id);
        setBreadcrumbs(path);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentTeam || !user) return;

    for (const file of Array.from(files)) {
      try {
        setUploading(true);
        const uploadedFile = await uploadFile(
          currentTeam.id,
          file,
          user.id,
          currentFolder?.id,
          (progress) => setUploadProgress(progress)
        );
        addFile(uploadedFile);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canUpload || !currentTeam || !user) return;

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    for (const file of Array.from(droppedFiles)) {
      try {
        setUploading(true);
        const uploadedFile = await uploadFile(
          currentTeam.id,
          file,
          user.id,
          currentFolder?.id,
          (progress) => setUploadProgress(progress)
        );
        addFile(uploadedFile);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentTeam || !user) return;
    try {
      const folder = await createFolder(
        currentTeam.id,
        newFolderName,
        user.id,
        currentFolder?.id
      );
      addFolder(folder);
      setNewFolderName('');
      setCreateFolderOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder);
    setSelectedItems([]);
  };

  const handleBreadcrumbClick = (folder: Folder | null) => {
    setCurrentFolder(folder);
    setSelectedItems([]);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'file') {
        await deleteFile(itemToDelete.id);
        deleteFileStore(itemToDelete.id);
      } else {
        await deleteFolder(itemToDelete.id);
        deleteFolderStore(itemToDelete.id);
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleRename = async () => {
    if (!renamingItem) return;
    try {
      if (renamingItem.type === 'file') {
        await updateFile(renamingItem.id, { name: renamingItem.name });
      } else {
        await updateFolderFirebase(renamingItem.id, { name: renamingItem.name });
      }
      await loadData();
      setRenamingItem(null);
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };

  const handleShare = (file: FileItem) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (type.startsWith('video/')) return <FileVideo className="h-8 w-8" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-8 w-8" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <FileArchive className="h-8 w-8" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a team to view files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Files</h1>
            <p className="text-muted-foreground mt-1">Manage your team files and folders</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </Button>
            {canUpload && (
              <>
                <Button onClick={() => setCreateFolderOpen(true)} variant="outline">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
                <Button onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => handleBreadcrumbClick(null)} className="cursor-pointer">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((folder, index) => (
              <span key={folder.id} className="flex items-center">
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink onClick={() => handleBreadcrumbClick(folder)} className="cursor-pointer">
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="p-4 border-b bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div 
          className={`p-6 min-h-full ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary rounded-lg' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
              <div className="text-center p-8 rounded-lg border-2 border-dashed border-primary bg-background">
                <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Drop files to upload</h3>
                <p className="text-muted-foreground">Release to upload your files</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try a different search term
                      </p>
                    </>
                  ) : (
                    <>
                      {canUpload ? (
                        <div 
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">Upload files</h3>
                          <p className="text-muted-foreground mb-4">
                            Drag and drop files here, or click to browse
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={(e) => { e.stopPropagation(); setCreateFolderOpen(true); }} variant="outline">
                              <FolderPlus className="mr-2 h-4 w-4" />
                              New Folder
                            </Button>
                            <Button onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Files
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No files or folders</h3>
                          <p className="text-muted-foreground mb-4">
                            This folder is empty
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'}>
                  {/* Folders */}
                  {filteredFolders.map((folder) => (
                    <Card
                      key={folder.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${viewMode === 'list' ? 'p-3' : ''}`}
                      onClick={() => handleFolderClick(folder)}
                    >
                      <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-0'}>
                        <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center justify-between'}`}>
                          <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mb-2' : ''}`}>
                            <FolderIcon className={`${viewMode === 'grid' ? 'h-10 w-10' : 'h-8 w-8'} text-blue-500`} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{folder.name}</p>
                              {viewMode === 'list' && (
                                <p className="text-xs text-muted-foreground">
                                  {format(folder.updatedAt, 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                          {viewMode === 'grid' && (
                            <p className="text-xs text-muted-foreground">
                              {format(folder.updatedAt, 'MMM d, yyyy')}
                            </p>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setRenamingItem({ id: folder.id, name: folder.name, type: 'folder' });
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete({ id: folder.id, name: folder.name, type: 'folder' });
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Files */}
                  {filteredFiles.map((file) => (
                    <Card key={file.id} className={`hover:bg-muted/50 transition-colors ${viewMode === 'list' ? 'p-3' : ''}`}>
                      <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-0'}>
                        <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center justify-between'}`}>
                          <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mb-2' : 'flex-1'}`}>
                            {getFileIcon(file.type)}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {format(file.createdAt, 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              {canShare && (
                                <DropdownMenuItem onClick={() => handleShare(file)}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setRenamingItem({ id: file.id, name: file.name, type: 'file' })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setItemToDelete({ id: file.id, name: file.name, type: 'file' });
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My Folder"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renamingItem} onOpenChange={(open) => !open && setRenamingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renamingItem?.type === 'file' ? 'File' : 'Folder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename">New Name</Label>
              <Input
                id="rename"
                value={renamingItem?.name || ''}
                onChange={(e) => renamingItem && setRenamingItem({ ...renamingItem, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingItem(null)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === 'file' ? 'File' : 'Folder'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"?
              {itemToDelete?.type === 'folder' && ' This will also delete all files and subfolders inside it.'}
              {' '}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share File Dialog */}
      <ShareFileDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        file={selectedFile}
        onShare={() => loadData()}
      />
    </div>
  );
}
