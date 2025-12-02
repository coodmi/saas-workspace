'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
      { keys: ['Ctrl', '/'], description: 'Open keyboard shortcuts' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'P'], description: 'Go to Projects' },
      { keys: ['G', 'F'], description: 'Go to Files' },
      { keys: ['G', 'C'], description: 'Go to Chat' },
    ],
  },
  {
    title: 'Tasks',
    shortcuts: [
      { keys: ['N'], description: 'Create new task' },
      { keys: ['E'], description: 'Edit selected task' },
      { keys: ['Del'], description: 'Delete selected task' },
      { keys: ['Ctrl', 'Enter'], description: 'Save task' },
      { keys: ['Esc'], description: 'Cancel editing' },
    ],
  },
  {
    title: 'Files',
    shortcuts: [
      { keys: ['U'], description: 'Upload file' },
      { keys: ['Ctrl', 'N'], description: 'New folder' },
      { keys: ['F2'], description: 'Rename file/folder' },
      { keys: ['Ctrl', 'D'], description: 'Download selected' },
    ],
  },
  {
    title: 'Chat',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Send message' },
      { keys: ['@'], description: 'Mention user' },
      { keys: ['Shift', 'Enter'], description: 'New line' },
      { keys: ['Ctrl', 'Up'], description: 'Edit last message' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save changes' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['?'], description: 'Show help' },
    ],
  },
];

interface KeyboardShortcutDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: KeyboardShortcutDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled 
    ? controlledOnOpenChange || (() => {}) 
    : setInternalOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Ctrl</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">/</kbd>
          {' '}to toggle this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
