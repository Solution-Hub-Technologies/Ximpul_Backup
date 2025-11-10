import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { Bell, Mail, Phone, Calendar, Check, X, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface StockNotification {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  color_requested: string;
  is_notified: boolean;
  created_at: string;
  notified_at: string | null;
}

export const AdminNotifications = () => {
  const [stockNotifications, setStockNotifications] = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<StockNotification | null>(null);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStockNotifications = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('stock_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStockNotifications(data || []);
    } catch (error) {
      console.error('Error fetching stock notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockNotifications();
  }, []);

  const handleNotifyCustomer = async () => {
    if (!selectedNotification) return;
    
    setIsSubmitting(true);
    try {
      // Send email notification using template
      const defaultMessage = `Your requested ${selectedNotification.color_requested} is now available for immediate purchase. Don't wait - limited stock available!`;
      
      await fetch('https://ximpul.com/send-template-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: 'stock_available_customer',
          to: selectedNotification.customer_email,
          variables: {
            customerName: selectedNotification.customer_name,
            color: selectedNotification.color_requested,
            customMessage: notifyMessage || defaultMessage
          }
        })
      });

      // Update notification status
      const { error } = await supabaseAdmin
        .from('stock_notifications')
        .update({ 
          is_notified: true, 
          notified_at: new Date().toISOString() 
        })
        .eq('id', selectedNotification.id);

      if (error) throw error;

      toast.success('Customer notified successfully!');
      setIsNotifyModalOpen(false);
      setSelectedNotification(null);
      setNotifyMessage('');
      fetchStockNotifications();
    } catch (error) {
      console.error('Error notifying customer:', error);
      toast.error('Failed to notify customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsNotified = async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('stock_notifications')
        .update({ 
          is_notified: true, 
          notified_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Marked as notified');
      fetchStockNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const pendingNotifications = stockNotifications.filter(n => !n.is_notified);
  const completedNotifications = stockNotifications.filter(n => n.is_notified);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Notifications</h1>
          <p className="text-gray-500 mt-1">Manage customer stock alert requests</p>
        </div>
        <Button onClick={fetchStockNotifications} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockNotifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingNotifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedNotifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Notifications */}
      {pendingNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Pending Notifications ({pendingNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingNotifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4 bg-red-50/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{notification.customer_name}</h3>
                        <Badge variant="destructive">Pending</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{notification.customer_phone}</span>
                        </div>
                        {notification.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{notification.customer_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gray-800"></div>
                          <span className="text-sm font-medium">{notification.color_requested}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {notification.customer_email && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setIsNotifyModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Notify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsNotified(notification.id)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Mark Done
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Notifications */}
      {completedNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Completed Notifications ({completedNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedNotifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4 bg-green-50/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{notification.customer_name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{notification.customer_phone}</span>
                        </div>
                        {notification.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{notification.customer_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Requested: {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {notification.notified_at && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              Notified: {new Date(notification.notified_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gray-800"></div>
                          <span className="text-sm font-medium">{notification.color_requested}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stockNotifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500">Stock alert requests will appear here when customers request notifications.</p>
          </CardContent>
        </Card>
      )}

      {/* Notify Customer Modal */}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notify Customer - {selectedNotification?.color_requested}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer: {selectedNotification?.customer_name}</Label>
              <p className="text-sm text-gray-500">{selectedNotification?.customer_email}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Quick Messages</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start text-left h-auto p-3 border-green-200 bg-green-50 hover:bg-green-100 text-green-800 hover:text-green-800"
                  onClick={() => setNotifyMessage("Good news! This product is available.")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Good news! This product is available.</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start text-left h-auto p-3 border-red-200 bg-red-50 hover:bg-red-100 text-red-800 hover:text-red-800"
                  onClick={() => setNotifyMessage("Unavailable — we'll notify you when it's back.")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Unavailable — we'll notify you when it's back.</span>
                  </div>
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notify-message">Custom Message (Optional)</Label>
              <Textarea
                id="notify-message"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Add a custom message or leave empty for default message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotifyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleNotifyCustomer} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};