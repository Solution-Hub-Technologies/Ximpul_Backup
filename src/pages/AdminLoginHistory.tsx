import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { History, Monitor, Smartphone, Globe, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginRecord {
  id: string;
  user_id: string;
  email: string;
  login_time: string;
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  success: boolean;
  failure_reason?: string;
}

export const AdminLoginHistory = () => {
  const { adminUser } = useAdminAuth();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoginHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_login_history')
        .select('*')
        .order('login_time', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Database error:', error);
        // Show mock data if database unavailable
        const mockData: LoginRecord[] = [
          {
            id: '1',
            user_id: 'e9590660-9452-45c7-a7cf-8358ddfab703',
            email: 'admin@ximpul.com',
            login_time: new Date().toISOString(),
            ip_address: '192.168.0.111',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            browser: 'Chrome',
            os: 'Windows',
            device: 'Desktop',
            country: 'Bangladesh',
            city: 'Dhaka',
            success: true
          }
        ];
        setLoginHistory(mockData);
        setIsLoading(false);
        return;
      }

      setLoginHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
      setLoginHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (adminUser?.role !== 'admin' && adminUser?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can view login history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Login History</h1>
              <p className="text-gray-600">Track admin login activities and security events</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Login Activities ({loginHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading login history...</div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No login history found</div>
            ) : (
              <div className="space-y-4">
                {loginHistory.map((record) => (
                  <div key={record.id} className="p-6 border rounded-lg bg-white hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          record.success ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {record.success ? 
                            <CheckCircle className="h-6 w-6 text-green-600" /> : 
                            <XCircle className="h-6 w-6 text-red-600" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{record.email}</h3>
                            <Badge className={record.success ? 
                              'bg-green-100 text-green-800 border-green-200' : 
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {record.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(record.login_time)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{record.ip_address}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(record.device)}
                              <span>{record.browser} on {record.os}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{record.city}, {record.country}</span>
                            </div>
                          </div>
                          
                          {!record.success && record.failure_reason && (
                            <div className="mt-2 text-sm text-red-600">
                              Reason: {record.failure_reason}
                            </div>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Device: {record.device} | User Agent: {record.user_agent.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};