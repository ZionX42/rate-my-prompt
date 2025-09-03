import { describe, it, expect } from '@jest/globals';
import { Role } from '@/lib/models/user';
import { Permission, hasPermission, canManageUser, getPermissionsForRole } from '@/lib/permissions';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should return true if role has permission', () => {
      expect(hasPermission(Role.ADMIN, Permission.MANAGE_USERS)).toBe(true);
      expect(hasPermission(Role.MODERATOR, Permission.MODERATE_CONTENT)).toBe(true);
      expect(hasPermission(Role.USER, Permission.CREATE_PROMPT)).toBe(true);
    });

    it('should return false if role does not have permission', () => {
      expect(hasPermission(Role.USER, Permission.MANAGE_USERS)).toBe(false);
      expect(hasPermission(Role.MODERATOR, Permission.MANAGE_USERS)).toBe(false);
    });
  });

  describe('canManageUser', () => {
    it('should allow admin to manage anyone', () => {
      expect(canManageUser(Role.ADMIN, Role.USER)).toBe(true);
      expect(canManageUser(Role.ADMIN, Role.MODERATOR)).toBe(true);
      expect(canManageUser(Role.ADMIN, Role.ADMIN)).toBe(true);
    });

    it('should allow moderator to manage users', () => {
      expect(canManageUser(Role.MODERATOR, Role.USER)).toBe(true);
    });

    it('should not allow moderator to manage moderators or admins', () => {
      expect(canManageUser(Role.MODERATOR, Role.MODERATOR)).toBe(false);
      expect(canManageUser(Role.MODERATOR, Role.ADMIN)).toBe(false);
    });

    it('should not allow user to manage anyone', () => {
      expect(canManageUser(Role.USER, Role.USER)).toBe(false);
      expect(canManageUser(Role.USER, Role.MODERATOR)).toBe(false);
      expect(canManageUser(Role.USER, Role.ADMIN)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return correct permissions for each role', () => {
      expect(getPermissionsForRole(Role.USER)).toEqual([
        Permission.EDIT_OWN_PROFILE,
        Permission.CREATE_PROMPT,
      ]);

      expect(getPermissionsForRole(Role.MODERATOR)).toEqual([
        Permission.EDIT_OWN_PROFILE,
        Permission.CREATE_PROMPT,
        Permission.MODERATE_CONTENT,
        Permission.EDIT_ANY_PROMPT,
      ]);

      expect(getPermissionsForRole(Role.ADMIN)).toEqual([
        Permission.EDIT_OWN_PROFILE,
        Permission.CREATE_PROMPT,
        Permission.MODERATE_CONTENT,
        Permission.EDIT_ANY_PROMPT,
        Permission.DELETE_PROMPT,
        Permission.MANAGE_USERS,
        Permission.VIEW_ADMIN_PANEL,
      ]);
    });
  });
});
