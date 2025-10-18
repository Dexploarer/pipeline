export type Role = "admin" | "editor" | "viewer"

export interface Permission {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canPublish: boolean
  canManageUsers: boolean
}

const rolePermissions: Record<Role, Permission> = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canManageUsers: true,
  },
  editor: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canPublish: true,
    canManageUsers: false,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canManageUsers: false,
  },
}

export function getPermissions(role: Role): Permission {
  return rolePermissions[role]
}

export function canPerformAction(role: Role, action: keyof Permission): boolean {
  return rolePermissions[role][action]
}
