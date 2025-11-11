import { Role } from './models/user';

// Define permissions
export enum Permission {
  MANAGE_USERS = 'manage_users',
  MODERATE_CONTENT = 'moderate_content',
  VIEW_ADMIN_PANEL = 'view_admin_panel',
  EDIT_OWN_PROFILE = 'edit_own_profile',
  CREATE_PROMPT = 'create_prompt',
  EDIT_ANY_PROMPT = 'edit_any_prompt',
  DELETE_PROMPT = 'delete_prompt',
}

// Role-based permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [Permission.EDIT_OWN_PROFILE, Permission.CREATE_PROMPT],
  [Role.MODERATOR]: [
    Permission.EDIT_OWN_PROFILE,
    Permission.CREATE_PROMPT,
    Permission.MODERATE_CONTENT,
    Permission.EDIT_ANY_PROMPT,
  ],
  [Role.ADMIN]: [
    Permission.EDIT_OWN_PROFILE,
    Permission.CREATE_PROMPT,
    Permission.MODERATE_CONTENT,
    Permission.EDIT_ANY_PROMPT,
    Permission.DELETE_PROMPT,
    Permission.MANAGE_USERS,
    Permission.VIEW_ADMIN_PANEL,
  ],
};

// Check if a user has a specific permission
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false;
}

// Check if user can perform action on another user (e.g., manage users)
export function canManageUser(currentUserRole: Role, targetUserRole: Role): boolean {
  if (currentUserRole === Role.ADMIN) {
    return true; // Admin can manage anyone
  }
  if (currentUserRole === Role.MODERATOR && targetUserRole === Role.USER) {
    return true; // Moderator can manage users
  }
  return false;
}

// Get all permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}
