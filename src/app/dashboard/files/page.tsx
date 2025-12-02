"use client";
import { useAuthStore } from '@/stores/auth-store';
import { hasPermission, Permission } from '@/lib/roles';

export default function FilesPage() {
  const { memberRole, memberPermissions } = useAuthStore();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Files Minimal</h1>
      <p>Temporary minimal component to isolate previous build error.</p>
      <div className="mt-4 text-sm">
        <p>Upload allowed: {hasPermission(memberRole || undefined, (memberPermissions as Permission[] | undefined), 'files.upload') ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
// End minimal component
