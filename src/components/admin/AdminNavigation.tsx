import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getAdminNotifications, clearAdminNotifications, markNotificationsAsRead, getUnreadCount } from '@/utils/admin-notification';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { 
  Package, Users, BarChart3, LogOut, ShoppingBag, 
  Settings, Bell, ChevronDown, User, Key, UserPlus, Shield, TestTube, History
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AdminNavigation = () => {
  const { adminUser, logout, changePassword, hasPermission } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stockNotifications, setStockNotifications] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  
  const fetchStockNotifications = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('stock_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setStockNotifications(data || []);
    } catch (error) {
      console.error('Error fetching stock notifications:', error);
    }
  };

  const fetchDbNotifications = async () => {
    // Skip fetching notifications table as it doesn't exist
    setDbNotifications([]);
  };

  useEffect(() => {
    const updateNotifications = () => {
      setNotifications(getAdminNotifications());
      setUnreadCount(getUnreadCount());
    };
    
    updateNotifications();
    fetchStockNotifications();
    fetchDbNotifications();
    
    const handleNotificationAdded = () => updateNotifications();
    const handleNotificationsCleared = () => updateNotifications();
    const handleNotificationsRead = () => updateNotifications();
    
    window.addEventListener('adminNotificationAdded', handleNotificationAdded);
    window.addEventListener('adminNotificationsCleared', handleNotificationsCleared);
    window.addEventListener('adminNotificationsRead', handleNotificationsRead);
    
    return () => {
      window.removeEventListener('adminNotificationAdded', handleNotificationAdded);
      window.removeEventListener('adminNotificationsCleared', handleNotificationsCleared);
      window.removeEventListener('adminNotificationsRead', handleNotificationsRead);
    };
  }, []);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor' // Default role
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Clean up function to ensure only one dialog is open at a time
  const closeAllDialogs = () => {
    setIsProfileDialogOpen(false);
    setIsPasswordDialogOpen(false);
    setIsNewUserDialogOpen(false);
  };
  


  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Orders', href: '/admin/orders', icon: Package },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/admin/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold">X</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ximpul</span>
              <span className="text-sm font-medium text-gray-500 ml-1">Admin</span>
            </Link>
            
            <div className="hidden md:flex md:ml-10 space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-primary' : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">

            
            <div className="relative">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 relative"
                    onClick={() => {
                      if (unreadCount > 0) {
                        setTimeout(() => markNotificationsAsRead(), 100);
                      }
                    }}
                  >
                    <Bell className="w-5 h-5" />
                    {(unreadCount > 0 || stockNotifications.length > 0 || dbNotifications.length > 0) && (
                      <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 text-xs rounded-full bg-red-500 text-white">
                        {(unreadCount + stockNotifications.length + dbNotifications.length) > 9 ? '9+' : (unreadCount + stockNotifications.length + dbNotifications.length)}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {(notifications.length > 0 || stockNotifications.length > 0 || dbNotifications.length > 0) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          clearAdminNotifications();
                          setUnreadCount(0);
                        }}
                      >
                        Clear All
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 && stockNotifications.length === 0 && dbNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      {/* Database Notifications */}
                      {dbNotifications.map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-green-600">{notification.title}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      ))}
                      
                      {/* Stock Notifications */}
                      {stockNotifications.map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-blue-600">Stock Alert Request</span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.customer_name} wants {notification.color_requested}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Phone: {notification.customer_phone}
                            {notification.customer_email && ` • Email: ${notification.customer_email}`}
                          </p>
                        </div>
                      ))}
                      
                      {/* Order Notifications */}
                      {notifications.map((notification, index) => (
                        <div key={index} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{notification.title}</span>
                            <span className="text-xs text-gray-500">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-6 p-0 mt-1"
                            onClick={() => navigate('/admin/orders')}
                          >
                            View Order
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 border-l pl-4 ml-2 cursor-pointer">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-medium">
                    {adminUser?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">{adminUser?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{adminUser?.role || 'Administrator'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  closeAllDialogs();
                  setIsProfileDialogOpen(true);
                }}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  closeAllDialogs();
                  setIsPasswordDialogOpen(true);
                }}>
                  <Key className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminUser?.role === 'superadmin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/admin/smtp-config')}>
                  <TestTube className="mr-2 h-4 w-4" />
                  <span>Email Configuration</span>
                </DropdownMenuItem>
                {adminUser?.role === 'superadmin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/ssl-config')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>SSL Configure</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Removed logout button as it's now in the dropdown */}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="flex justify-between px-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-md text-xs ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </Link>
            );
          })}
          <button className="flex flex-col items-center justify-center px-3 py-1 rounded-md text-xs text-gray-600 hover:text-primary">
            <Settings className="w-5 h-5 mb-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              View and manage your account details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-medium">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={adminUser?.name || ''}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={adminUser?.email || ''}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={adminUser?.role || 'User'}
                className="col-span-3"
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsProfileDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your account password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            
            try {
              // Validate passwords
              if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                toast.error("New passwords don't match");
                return;
              }
              
              if (passwordForm.newPassword.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
              }
              
              const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
              
              if (!result.success) {
                throw new Error(result.error);
              }
              
              toast.success("Password updated successfully!");
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setTimeout(() => setIsPasswordDialogOpen(false), 500);
            } catch (error) {
              console.error('Error updating password:', error);
              toast.error("Failed to update password");
            } finally {
              setIsSubmitting(false);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password" className="text-right">
                  Current
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  New
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-password" className="text-right">
                  Confirm
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new admin user account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            
            try {
              // In a real implementation, you would create a new user in the database
              // For now, we'll just simulate it
              const { data, error } = await supabase.from('admin_users').insert([
                {
                  name: newUserForm.name,
                  email: newUserForm.email,
                  role: newUserForm.role,
                  is_active: true
                }
              ]);
              
              if (error) throw error;
              
              toast.success("User created successfully");
              setNewUserForm({
                name: '',
                email: '',
                password: '',
                role: 'editor'
              });
              setIsNewUserDialogOpen(false);
            } catch (error) {
              console.error('Error creating user:', error);
              toast.error("Failed to create user");
            } finally {
              setIsSubmitting(false);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="user-name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-password" className="text-right">
                  Password
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-role" className="text-right">
                  Role
                </Label>
                <select
                  id="user-role"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewUserDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


    </nav>
  );
};
