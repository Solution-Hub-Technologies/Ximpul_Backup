import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { sanitizeForLog } from '@/utils/security';
import { trackLogin } from '@/utils/login-tracker';
import { signInAdmin, requireAuth } from '@/utils/supabase-auth';
import * as bcrypt from 'bcryptjs';

// Constant-time string comparison to prevent timing attacks
const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  password_hash?: string;
}

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user?.user_metadata?.is_admin) {
        setSession(session);
        setAdminUser({
          id: session.user.user_metadata.admin_id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || '',
          role: session.user.user_metadata.role || '',
          is_active: true
        });
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setAdminUser(null);
      } else if (session?.user?.user_metadata?.is_admin) {
        setSession(session);
        setAdminUser({
          id: session.user.user_metadata.admin_id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || '',
          role: session.user.user_metadata.role || '',
          is_active: true
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Temporarily disable automatic session validation
  // useEffect(() => {
  //   if (adminUser && session) {
  //     const validationInterval = startSessionValidation(() => {
  //       logout();
  //     });
  //     
  //     return () => clearInterval(validationInterval);
  //   }
  // }, [adminUser, session]);

  const login = async (email: string, password: string, captchaToken?: string) => {
    try {
      // Verify CAPTCHA token exists
      if (!captchaToken) {
        throw new Error('Security verification required');
      }

      // Basic token validation (decode and check timestamp)
      try {
        const decoded = atob(captchaToken);
        const [, timestamp] = decoded.split('-');
        const tokenAge = Date.now() - parseInt(timestamp);
        
        // Token should be less than 10 minutes old
        if (tokenAge > 10 * 60 * 1000) {
          throw new Error('Security verification expired');
        }
      } catch {
        throw new Error('Invalid security verification');
      }

      // Use Supabase authentication with admin verification
      const result = await signInAdmin(email, password);
      
      if (!result.success) {
        // Track failed login attempt
        await trackLogin({
          userId: 'unknown',
          email: email,
          success: false,
          failureReason: result.error || 'Invalid credentials'
        });
        
        throw new Error(result.error || 'Invalid credentials');
      }

      // Set local state
      setSession(result.session);
      setAdminUser({
        id: result.adminData.id,
        email: result.adminData.email,
        name: result.adminData.name,
        role: result.adminData.role,
        is_active: result.adminData.is_active
      });
      
      // Track successful login
      await trackLogin({
        userId: result.adminData.id,
        email: result.adminData.email,
        success: true,
        sessionId: result.session?.access_token || 'jwt-session'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', sanitizeForLog(error));
      return { success: false, error: error.message || 'Invalid credentials' };
    }
  };

  const updateProfile = async (userData: Partial<AdminUser>) => {
    try {
      if (!adminUser) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('admin_users')
        .update(userData)
        .eq('id', adminUser.id);
        
      if (error) throw error;
      
      // Update local state
      const updatedUser = { ...adminUser, ...userData };
      setAdminUser(updatedUser);
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', sanitizeForLog(error));
      return { success: false, error: 'Failed to update profile' };
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!adminUser) throw new Error('Not authenticated');
      
      // Get current user data from database
      const { data: userData, error: fetchError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', adminUser.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Verify current password
      let isCurrentPasswordValid = false;
      if (userData.password_hash) {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
      } else {
        // Fallback for admin with no hash
        isCurrentPasswordValid = constantTimeCompare(currentPassword, 'admin123');
      }
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password in database
      const { error } = await supabaseAdmin
        .from('admin_users')
        .update({ 
          password_hash: hashedNewPassword,
          updated_at: new Date().toISOString() 
        })
        .eq('id', adminUser.id);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', sanitizeForLog(error));
      return { success: false, error: error.message || 'Failed to change password' };
    }
  };
  
  const createUser = async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      if (!adminUser || adminUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', userData.email)
        .single();
        
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // In a real implementation, you would hash the password
      // For now, we'll just insert the user
      const { error } = await supabase
        .from('admin_users')
        .insert([
          {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            is_active: true
          }
        ]);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('User creation error:', sanitizeForLog(error));
      return { success: false, error: 'Failed to create user' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setSession(null);
    window.location.href = '/admin/login';
  };

  const hasPermission = (requiredRole: string) => {
    if (!adminUser) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'manager': 2, 
      'supervisor': 1
    };
    
    return roleHierarchy[adminUser.role] >= roleHierarchy[requiredRole];
  };

  return {
    adminUser,
    session,
    isLoading,
    login,
    logout,
    updateProfile,
    changePassword,
    createUser,
    hasPermission,
    isAuthenticated: !!adminUser && !!session
  };
};
