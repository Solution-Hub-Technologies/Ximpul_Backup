import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { Shield, Save, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface SSLConfig {
  id?: string;
  store_id: string;
  store_password: string;
  is_live: boolean;
  updated_at?: string;
}

export const AdminSSLConfig = () => {
  const { adminUser } = useAdminAuth();
  const [config, setConfig] = useState<SSLConfig>({
    store_id: '',
    store_password: '',
    is_live: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSSLConfig();
  }, []);

  const fetchSSLConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('ssl_config')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      if (data) {
        setConfig({
          id: data.id,
          store_id: data.store_id || '',
          store_password: data.store_password || '',
          is_live: data.is_live || false,
          updated_at: data.updated_at
        });
      }
    } catch (error: any) {
      console.log('No SSL config found');
    } finally {
      setLoading(false);
    }
  };

  const saveSSLConfig = async () => {
    try {
      setSaving(true);
      
      if (!config.store_id || !config.store_password) {
        toast.error('Store ID and Store Password are required');
        return;
      }

      // Check if config exists
      const { data: existingConfig } = await supabaseAdmin
        .from('ssl_config')
        .select('id')
        .single();
      
      let error;
      
      if (existingConfig) {
        // Update existing config
        const result = await supabaseAdmin
          .from('ssl_config')
          .update({
            store_id: config.store_id,
            store_password: config.store_password,
            is_live: config.is_live
          })
          .eq('id', existingConfig.id);
        error = result.error;
      } else {
        // Insert new config
        const result = await supabaseAdmin
          .from('ssl_config')
          .insert({
            store_id: config.store_id,
            store_password: config.store_password,
            is_live: config.is_live
          });
        error = result.error;
      }
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('SSL configuration saved successfully');
      fetchSSLConfig();
    } catch (error: any) {
      toast.error('Failed to save SSL configuration');
    } finally {
      setSaving(false);
    }
  };

  // Check if user has superadmin role after all hooks
  if (!adminUser || adminUser.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Only superadmin users can access SSL configuration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading SSL configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SSL Configuration</h1>
          <p className="text-gray-600">Manage SSLCommerz payment gateway settings</p>
        </div>

        <div className="max-w-2xl">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSLCommerz Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="store_id" className="text-sm font-medium text-gray-700">
                    Store ID *
                  </Label>
                  <Input
                    id="store_id"
                    type="text"
                    value={config.store_id}
                    onChange={(e) => setConfig({ ...config, store_id: e.target.value })}
                    placeholder="Enter SSLCommerz Store ID"
                    className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your SSLCommerz merchant store identifier</p>
                </div>

                <div>
                  <Label htmlFor="store_password" className="text-sm font-medium text-gray-700">
                    Store Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="store_password"
                      type={showPassword ? 'text' : 'password'}
                      value={config.store_password}
                      onChange={(e) => setConfig({ ...config, store_password: e.target.value })}
                      placeholder="Enter SSLCommerz Store Password"
                      className="pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your SSLCommerz merchant store password</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="is_live" className="text-sm font-medium text-gray-700">
                      Live Mode
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.is_live ? 'Production environment - real transactions' : 'Sandbox environment - test transactions'}
                    </p>
                  </div>
                  <Switch
                    id="is_live"
                    checked={config.is_live}
                    onCheckedChange={(checked) => setConfig({ ...config, is_live: checked })}
                  />
                </div>
              </div>

              {config.updated_at && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Configuration Status</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>Last updated: {new Date(config.updated_at).toLocaleString()}</p>
                    <p>Environment: {config.is_live ? 'Production' : 'Sandbox'}</p>
                    <p>Store ID: {config.store_id}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={fetchSSLConfig}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={saveSSLConfig}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Security Notice</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• SSL configuration is encrypted and stored securely in the database</p>
              <p>• Only superadmin users can view and modify these settings</p>
              <p>• Changes take effect immediately for new payment transactions</p>
              <p>• Always test in sandbox mode before switching to live mode</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};