export type Role = 'admin' | 'member' | 'viewer';

export type Permission =
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'files.upload'
  | 'files.edit'
  | 'files.delete'
  | 'files.share'
  | 'teams.invite'
  | 'teams.manageRoles';

export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'projects.create',
    'projects.edit',
    'projects.delete',
    'files.upload',
    'files.edit',
    'files.delete',
    'files.share',
    'teams.invite',
    'teams.manageRoles',
  ],
  member: [
    'projects.create',
    'projects.edit',
    'files.upload',
    'files.edit',
    'files.share',
  ],
  viewer: [],
};

export function hasPermission(
  role: Role | undefined,
  explicit: Permission[] | undefined,
  permission: Permission
): boolean {
  if (!role && !explicit) return false;
  if (explicit && explicit.includes(permission)) return true;
  if (!role) return false;
  return DEFAULT_PERMISSIONS[role].includes(permission);
}

export interface TeamMemberProfile {
  userId: string;
  role: Role;
  permissions?: Permission[]; // overrides/additions per member
}
