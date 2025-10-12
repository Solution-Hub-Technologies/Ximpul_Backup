import { supabase } from '@/integrations/supabase/client';

interface Permission {
  name: string;
  display_name: string;
  module: string;
}

interface Role {
  name: string;
  display_name: string;
  level: number;
  permissions: Permission[];
}

let roleCache: { [roleName: string]: Role } = {};

export const loadUserPermissions = async (roleName: string): Promise<Role | null> => {
  if (roleCache[roleName]) {
    return roleCache[roleName];
  }

  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select(`
        name,
        display_name,
        level,
        admin_role_permissions (
          admin_permissions (
            name,
            display_name,
            module
          )
        )
      `)
      .eq('name', roleName)
      .single();

    if (error || !data) {
      // Fallback to basic role info
      const fallbackRoles = {
        'superadmin': { name: 'superadmin', display_name: 'Super Administrator', level: 100, permissions: [] },
        'admin': { name: 'admin', display_name: 'Administrator', level: 80, permissions: [] },
        'manager': { name: 'manager', display_name: 'Manager', level: 60, permissions: [] },
        'supervisor': { name: 'supervisor', display_name: 'Supervisor', level: 40, permissions: [] }
      };
      return fallbackRoles[roleName] || null;
    }

    const role: Role = {
      name: data.name,
      display_name: data.display_name,
      level: data.level,
      permissions: data.admin_role_permissions?.map(rp => rp.admin_permissions) || []
    };

    roleCache[roleName] = role;
    return role;
  } catch (error) {
    console.error('Error loading permissions:', error);
    return null;
  }
};

export const hasPermission = async (userRole: string, permission: string): Promise<boolean> => {
  // Superadmin always has all permissions
  if (userRole === 'superadmin') {
    return true;
  }

  const role = await loadUserPermissions(userRole);
  if (!role) return false;

  return role.permissions.some(p => p.name === permission);
};

export const hasAnyPermission = async (userRole: string, permissions: string[]): Promise<boolean> => {
  if (userRole === 'superadmin') {
    return true;
  }

  for (const permission of permissions) {
    if (await hasPermission(userRole, permission)) {
      return true;
    }
  }
  return false;
};

export const getRoleLevel = async (roleName: string): Promise<number> => {
  const role = await loadUserPermissions(roleName);
  return role?.level || 0;
};