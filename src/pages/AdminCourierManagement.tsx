import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Truck, Settings, Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, 
  MoreHorizontal, CheckCircle, XCircle, Download, TestTube, Clock,
  AlertTriangle, Wifi, WifiOff, User
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  type: 'steadfast' | 'pathao' | 'custom';
  status: 'active' | 'inactive';
  api_status: 'connected' | 'disconnected';
  service_types: string[];
  phone: string;
  email: string;
  address: string;
  // SteadFast credentials
  api_key?: string;
  secret_key?: string;
  // Pathao credentials
  client_id?: string;
  client_secret?: string;
  // Common fields
  base_url: string;
  last_synced: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export const AdminCourierManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Load vendors from database
  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('courier_vendors')
        .select('*')
        .order('priority', { ascending: true });
      
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadVendors();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'steadfast' as 'steadfast' | 'pathao' | 'custom',
    phone: '',
    email: '',
    address: '',
    baseUrl: '',
    // SteadFast credentials
    apiKey: '',
    secretKey: '',
    // Pathao credentials
    clientId: '',
    clientSecret: '',
    serviceTypes: [] as string[],
    status: 'active' as 'active' | 'inactive',
    priority: 1
  });

  const serviceOptions = ['Standard', 'Express', 'COD', 'Same Day', 'Next Day'];

  const filteredAndSortedVendors = useMemo(() => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
      const matchesService = serviceFilter === 'all' || vendor.service_types.includes(serviceFilter);
      return matchesSearch && matchesStatus && matchesService;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'priority') return a.priority - b.priority;
      return 0;
    });
  }, [vendors, searchTerm, statusFilter, serviceFilter, sortBy]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'steadfast',
      phone: '',
      email: '',
      address: '',
      baseUrl: '',
      apiKey: '',
      secretKey: '',
      clientId: '',
      clientSecret: '',
      serviceTypes: [],
      status: 'active',
      priority: 1
    });
  };

  const toggleVendorStatus = async (id: string) => {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor) return;

    const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('courier_vendors')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setVendors(prev => prev.map(v => 
        v.id === id ? { ...v, status: newStatus } : v
      ));
      toast.success('Vendor status updated');
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const handleAddVendor = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    
    if (formData.type === 'custom' && !formData.name) {
      toast.error('Vendor name is required for custom vendors');
      return;
    }
    
    if (formData.type === 'steadfast' && (!formData.apiKey || !formData.secretKey)) {
      toast.error('API Key and Secret Key are required for SteadFast');
      return;
    }
    
    if (formData.type === 'pathao' && (!formData.clientId || !formData.clientSecret)) {
      toast.error('Client ID and Client Secret are required for Pathao');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('courier_vendors')
        .insert({
          name: formData.type === 'steadfast' ? 'SteadFast' : 
                formData.type === 'pathao' ? 'Pathao' : 
                formData.name,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          base_url: formData.baseUrl,
          api_key: formData.apiKey,
          secret_key: formData.secretKey,
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          service_types: formData.serviceTypes,
          status: formData.status,
          api_status: 'disconnected',
          last_synced: null,
          priority: formData.priority
        })
        .select()
        .single();

      if (error) throw error;
      
      setVendors(prev => [...prev, data]);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Vendor added successfully');
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor');
    }
  };

  const handleEditVendor = async () => {
    if (!selectedVendor || !formData.email) {
      toast.error('Email is required');
      return;
    }
    
    if (formData.type === 'custom' && !formData.name) {
      toast.error('Vendor name is required for custom vendors');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('courier_vendors')
        .update({
          name: formData.type === 'steadfast' ? 'SteadFast' : 
                formData.type === 'pathao' ? 'Pathao' : 
                formData.name,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          base_url: formData.baseUrl,
          api_key: formData.apiKey,
          secret_key: formData.secretKey,
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          service_types: formData.serviceTypes,
          status: formData.status,
          priority: formData.priority
        })
        .eq('id', selectedVendor.id)
        .select()
        .single();

      if (error) throw error;
      
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? data : v));
      setIsEditDialogOpen(false);
      setSelectedVendor(null);
      resetForm();
      toast.success('Vendor updated successfully');
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;
    try {
      const { error } = await supabase
        .from('courier_vendors')
        .delete()
        .eq('id', selectedVendor.id);

      if (error) throw error;
      
      setVendors(prev => prev.filter(v => v.id !== selectedVendor.id));
      setIsDeleteDialogOpen(false);
      setSelectedVendor(null);
      toast.success('Vendor deleted successfully');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const updatedVendors = vendors.map(vendor => 
      selectedVendors.includes(vendor.id) ? { ...vendor, status } : vendor
    );
    setVendors(updatedVendors);
    setSelectedVendors([]);
    toast.success(`${selectedVendors.length} vendors ${status === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleBulkDelete = () => {
    const updatedVendors = vendors.filter(vendor => !selectedVendors.includes(vendor.id));
    setVendors(updatedVendors);
    setSelectedVendors([]);
    toast.success(`${selectedVendors.length} vendors deleted`);
  };

  const testApiConnection = async (vendor: Vendor) => {
    // Validate required credentials based on vendor type
    if (!vendor.base_url) {
      toast.error('Base URL is required for connection test');
      return;
    }

    if (vendor.type === 'steadfast') {
      if (!vendor.api_key || !vendor.secret_key) {
        toast.error('API Key and Secret Key are required for SteadFast');
        return;
      }
    } else if (vendor.type === 'pathao') {
      if (!vendor.client_id || !vendor.client_secret) {
        toast.error('Client ID and Client Secret are required for Pathao');
        return;
      }
    } else {
      if (!vendor.api_key) {
        toast.error('API Key is required for this vendor');
        return;
      }
    }

    toast.info('Testing API connection...');
    
    try {
      // First, test basic connectivity with a simple request
      const testUrl = vendor.base_url.endsWith('/') ? vendor.base_url.slice(0, -1) : vendor.base_url;
      
      console.log('Testing URL:', testUrl);
      console.log('API Key:', vendor.api_key ? vendor.api_key.substring(0, 8) + '...' : 'Not provided');
      console.log('Secret Key:', vendor.secret_key ? vendor.secret_key.substring(0, 8) + '...' : 'Not provided');

      // Try a basic connectivity test first
      const connectivityTest = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });

      console.log('Connectivity test completed');

      // Now try the actual API call
      const headers: Record<string, string> = {};

      // Vendor specific configuration
      if (vendor.type === 'steadfast') {
        if (vendor.api_key) headers['Api-Key'] = vendor.api_key;
        if (vendor.secret_key) headers['Secret-Key'] = vendor.secret_key;
      } else if (vendor.type === 'pathao') {
        if (vendor.client_id) headers['Client-Id'] = vendor.client_id;
        if (vendor.client_secret) headers['Client-Secret'] = vendor.client_secret;
      } else {
        if (vendor.api_key) headers['Authorization'] = `Bearer ${vendor.api_key}`;
        if (vendor.secret_key) headers['X-Secret-Key'] = vendor.secret_key;
      }

      console.log('Request headers:', Object.keys(headers));

      // Try different endpoints based on vendor type
      const endpoints = vendor.type === 'steadfast' 
        ? ['/get_balance', '/balance', '/status', '/ping']
        : vendor.type === 'pathao'
        ? ['/aladdin/api/v1/countries', '/status', '/ping']
        : ['/status', '/ping', '/health', '/test'];

      let lastError = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${testUrl}${endpoint}`);
          
          const response = await fetch(`${testUrl}${endpoint}`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(8000)
          });

          console.log(`Response status: ${response.status}`);
          console.log(`Response headers:`, [...response.headers.entries()]);

          let responseData;
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            console.log('Response data:', responseData);
          } else {
            const textData = await response.text();
            console.log('Response text:', textData.substring(0, 200));
            responseData = { message: textData };
          }

          // Check for successful response
          if (response.status >= 200 && response.status < 300) {
            // Additional validation for known error responses
            if (responseData && typeof responseData === 'object') {
              if (responseData.error || responseData.status === 'error' || 
                  (responseData.status && responseData.status !== 200 && responseData.status !== 'success')) {
                throw new Error(responseData.message || responseData.error || 'API returned error status');
              }
            }

            try {
              await supabase
                .from('courier_vendors')
                .update({ 
                  api_status: 'connected', 
                  last_synced: new Date().toISOString() 
                })
                .eq('id', vendor.id);
              
              setVendors(prev => prev.map(v => 
                v.id === vendor.id 
                  ? { ...v, api_status: 'connected', last_synced: new Date().toLocaleString() }
                  : v
              ));
            } catch (dbError) {
              console.error('Error updating API status:', dbError);
            }
            
            const balanceInfo = responseData?.current_balance ? ` (Balance: ${responseData.current_balance})` : '';
            toast.success(`API connection successful${balanceInfo}`);
            success = true;
            break;
          } else if (response.status === 401) {
            throw new Error('Invalid API credentials');
          } else if (response.status === 403) {
            throw new Error('Access forbidden - Check API permissions');
          } else {
            lastError = new Error(`HTTP ${response.status}: ${responseData?.message || response.statusText}`);
          }
        } catch (endpointError: any) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
          lastError = endpointError;
          
          // If it's an auth error, don't try other endpoints
          if (endpointError.message.includes('Invalid API credentials') || 
              endpointError.message.includes('401')) {
            throw endpointError;
          }
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      if (!success) {
        throw new Error('All test endpoints failed');
      }

    } catch (error: any) {
      console.error('API test error:', error);
      
      try {
        await supabase
          .from('courier_vendors')
          .update({ api_status: 'disconnected' })
          .eq('id', vendor.id);
        
        setVendors(prev => prev.map(v => 
          v.id === vendor.id ? { ...v, api_status: 'disconnected' } : v
        ));
      } catch (dbError) {
        console.error('Error updating API status:', dbError);
      }
      
      if (error.name === 'TimeoutError') {
        toast.error('Connection timeout - API endpoint not responding');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Network error - Check if API URL is accessible. CORS may be blocking the request.');
      } else if (error.message.includes('Invalid API credentials') || error.message.includes('401')) {
        toast.error('Authentication failed - Invalid API key or secret key');
      } else if (error.message.includes('403')) {
        toast.error('Access forbidden - Check API permissions');
      } else if (error.message.includes('404')) {
        toast.error('API endpoint not found - Check base URL');
      } else {
        toast.error(`API test failed: ${error.message}`);
      }
    }
  };

  const exportVendors = () => {
    const csvContent = [
      ['Name', 'Status', 'API Status', 'Services', 'Phone', 'Email', 'Last Synced'],
      ...vendors.map(v => [
        v.name,
        v.status,
        v.api_status,
        v.service_types.join('; '),
        v.phone,
        v.email,
        v.last_synced
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendors.csv';
    a.click();
    toast.success('Vendor list exported');
  };

  const openEditDialog = (vendor: Vendor) => {
    console.log('Opening edit dialog for vendor:', vendor);
    setSelectedVendor(vendor);
    const formDataToSet = {
      name: vendor.name,
      type: vendor.type,
      phone: vendor.phone || '',
      email: vendor.email,
      address: vendor.address || '',
      baseUrl: vendor.base_url,
      apiKey: vendor.api_key || '',
      secretKey: vendor.secret_key || '',
      clientId: vendor.client_id || '',
      clientSecret: vendor.client_secret || '',
      serviceTypes: vendor.service_types || [],
      status: vendor.status,
      priority: vendor.priority
    };
    console.log('Setting form data:', formDataToSet);
    setFormData(formDataToSet);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteDialogOpen(true);
  };

  const maskApiKey = (key: string) => {
    if (!key) return 'Not configured';
    return key.length > 8 ? `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}` : '••••••••••••••••';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courier Management</h1>
          <p className="text-muted-foreground">Manage courier vendors and delivery partners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportVendors}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceOptions.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVendors.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedVendors.length} vendors selected</span>
              <Button size="sm" onClick={() => handleBulkStatusChange('active')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('inactive')}>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendors Grid */}
      <div className="grid gap-6">
        {filteredAndSortedVendors.map((vendor) => (
          <Card key={vendor.id} className="relative hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedVendors.includes(vendor.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedVendors(prev => [...prev, vendor.id]);
                      } else {
                        setSelectedVendors(prev => prev.filter(id => id !== vendor.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <Truck className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl font-bold text-gray-800">
                        {vendor.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                        #{vendor.priority}
                      </Badge>
                      <Badge 
                        variant={vendor.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs font-medium px-2 py-1 ${
                          vendor.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {vendor.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {vendor.api_status === 'connected' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          vendor.api_status === 'connected' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {vendor.api_status === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      {vendor.address && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span className="truncate max-w-xs">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={vendor.status === 'active'}
                  onCheckedChange={() => toggleVendorStatus(vendor.id)}
                  className="mt-1"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-700">Contact</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📞</span>
                      <span className="text-gray-700">{vendor.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">✉️</span>
                      <span className="text-gray-700 truncate">{vendor.email}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-700">API Key</h4>
                  </div>
                  <p className="text-sm font-mono text-gray-700 bg-white/50 p-2 rounded border">
                    {vendor.type === 'steadfast' ? maskApiKey(vendor.api_key || '') :
                     vendor.type === 'pathao' ? maskApiKey(vendor.client_id || '') :
                     maskApiKey(vendor.api_key || '')}
                  </p>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Truck className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-700">Services</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {(vendor.service_types || []).slice(0, 2).map(service => (
                        <Badge key={service} variant="outline" className="text-xs px-2 py-0.5 bg-white/50">
                          {service}
                        </Badge>
                      ))}
                      {(vendor.service_types || []).length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-white/50">
                          +{vendor.service_types.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {vendor.last_synced ? new Date(vendor.last_synced).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Button variant="default" size="sm" onClick={() => openViewDialog(vendor)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditDialog(vendor)} className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700">
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => testApiConnection(vendor)} className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-700">
                  <TestTube className="mr-1 h-4 w-4" />
                  Test
                </Button>
                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" onClick={() => openDeleteDialog(vendor)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedVendors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first courier service to start managing deliveries'
              }
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Add New Vendor</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Add a new courier vendor to your delivery network
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Vendor Type *</Label>
                    <Select value={formData.type} onValueChange={(value: 'steadfast' | 'pathao' | 'custom') => {
                      setFormData({...formData, type: value, name: value === 'steadfast' ? 'SteadFast' : value === 'pathao' ? 'Pathao' : ''});
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steadfast">SteadFast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                      min="1"
                      className="mt-1"
                      placeholder="1"
                    />
                  </div>
                </div>
                {formData.type === 'custom' && (
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1"
                      placeholder="Enter custom vendor name"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1"
                      placeholder="+880-1700-000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                      placeholder="support@vendor.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1"
                    placeholder="Full address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="baseUrl" className="text-sm font-medium">API Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                    className="mt-1 font-mono"
                    placeholder={formData.type === 'steadfast' ? 'https://portal.packzy.com/api/v1/' : 
                               formData.type === 'pathao' ? 'https://api.pathao.com/v1/' : 
                               'https://api.vendor.com/v1/'}
                  />
                </div>
                
                {/* SteadFast Credentials */}
                {formData.type === 'steadfast' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label htmlFor="apiKey" className="text-sm font-medium text-blue-700">API Key *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter SteadFast API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secretKey" className="text-sm font-medium text-blue-700">Secret Key *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="secretKey"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.secretKey}
                          onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter SteadFast secret key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Pathao Credentials */}
                {formData.type === 'pathao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <Label htmlFor="clientId" className="text-sm font-medium text-purple-700">Client ID *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="clientId"
                          type={showApiKey ? "text" : "password"}
                          value={formData.clientId}
                          onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                          className="pr-10"
                          placeholder="Enter Pathao Client ID"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="clientSecret" className="text-sm font-medium text-purple-700">Client Secret *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="clientSecret"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.clientSecret}
                          onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                          className="pr-10"
                          placeholder="Enter Pathao Client Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom Vendor Credentials */}
                {formData.type === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">API Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">Secret Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="secretKey"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.secretKey}
                          onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter secret key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supported Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceOptions.map(service => (
                    <div key={service} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={service}
                        checked={formData.serviceTypes.includes(service)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({...formData, serviceTypes: [...formData.serviceTypes, service]});
                          } else {
                            setFormData({...formData, serviceTypes: formData.serviceTypes.filter(s => s !== service)});
                          }
                        }}
                      />
                      <Label htmlFor={service} className="text-sm font-medium cursor-pointer">{service}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="pt-6 border-t">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddVendor} className="bg-blue-600 hover:bg-blue-700 flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Edit className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Edit Vendor</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Update {selectedVendor?.name} information and settings
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-type" className="text-sm font-medium">Vendor Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'steadfast' | 'pathao' | 'custom') => {
                      setFormData({...formData, type: value});
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steadfast">SteadFast</SelectItem>
                        <SelectItem value="pathao">Pathao</SelectItem>
                        <SelectItem value="custom">Custom Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority" className="text-sm font-medium">Priority</Label>
                    <Input
                      id="edit-priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                      min="1"
                      className="mt-1"
                    />
                  </div>
                </div>
                {formData.type === 'custom' && (
                  <div>
                    <Label htmlFor="edit-name" className="text-sm font-medium">Vendor Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1"
                      placeholder="Enter vendor name"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-status" className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1"
                      placeholder="+880-1700-000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                      placeholder="support@vendor.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1"
                    placeholder="Full address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-baseUrl" className="text-sm font-medium">API Base URL</Label>
                  <Input
                    id="edit-baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                    className="mt-1 font-mono"
                    placeholder="https://api.vendor.com/v1/"
                  />
                </div>
                
                {/* SteadFast Credentials */}
                {formData.type === 'steadfast' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label htmlFor="edit-apiKey" className="text-sm font-medium text-blue-700">API Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-apiKey"
                          type={showApiKey ? "text" : "password"}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter SteadFast API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-secretKey" className="text-sm font-medium text-blue-700">Secret Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-secretKey"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.secretKey}
                          onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter SteadFast secret key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Pathao Credentials */}
                {formData.type === 'pathao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <Label htmlFor="edit-clientId" className="text-sm font-medium text-purple-700">Client ID</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-clientId"
                          type={showApiKey ? "text" : "password"}
                          value={formData.clientId}
                          onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                          className="pr-10"
                          placeholder="Enter Pathao Client ID"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-clientSecret" className="text-sm font-medium text-purple-700">Client Secret</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-clientSecret"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.clientSecret}
                          onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                          className="pr-10"
                          placeholder="Enter Pathao Client Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom Vendor Credentials */}
                {formData.type === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="edit-apiKey" className="text-sm font-medium text-gray-700">API Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-apiKey"
                          type={showApiKey ? "text" : "password"}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-secretKey" className="text-sm font-medium text-gray-700">Secret Key</Label>
                      <div className="relative mt-1">
                        <Input
                          id="edit-secretKey"
                          type={showSecretKey ? "text" : "password"}
                          value={formData.secretKey}
                          onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                          className="pr-10"
                          placeholder="Enter secret key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supported Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceOptions.map(service => (
                    <div key={service} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`edit-${service}`}
                        checked={formData.serviceTypes.includes(service)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({...formData, serviceTypes: [...formData.serviceTypes, service]});
                          } else {
                            setFormData({...formData, serviceTypes: formData.serviceTypes.filter(s => s !== service)});
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${service}`} className="text-sm font-medium cursor-pointer">{service}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="pt-6 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEditVendor} className="bg-green-600 hover:bg-green-700 flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Update Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Vendor Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{selectedVendor?.name}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {selectedVendor?.type === 'steadfast' ? 'SteadFast Courier Service' : 
                   selectedVendor?.type === 'pathao' ? 'Pathao Courier Service' : 
                   'Custom Courier Service'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedVendor.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {selectedVendor.status === 'active' ? 
                        <CheckCircle className="h-5 w-5 text-green-600" /> : 
                        <XCircle className="h-5 w-5 text-gray-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-lg font-semibold capitalize">{selectedVendor.status}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedVendor.api_status === 'connected' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {selectedVendor.api_status === 'connected' ? 
                        <Wifi className="h-5 w-5 text-green-600" /> : 
                        <WifiOff className="h-5 w-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">API Status</p>
                      <p className="text-lg font-semibold capitalize">{selectedVendor.api_status}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <span className="text-blue-600 font-bold text-lg">#</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <p className="text-lg font-semibold">#{selectedVendor.priority}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <span className="text-blue-600 font-medium text-sm">📞</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="font-medium">{selectedVendor.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <span className="text-green-600 font-medium text-sm">✉️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="font-medium">{selectedVendor.email}</p>
                      </div>
                    </div>
                  </div>
                  {selectedVendor.address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <span className="text-purple-600 font-medium text-sm">📍</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="font-medium">{selectedVendor.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-500">Base URL</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">{selectedVendor.base_url}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <Label className="text-sm font-medium text-gray-500">
                          {selectedVendor.type === 'pathao' ? 'Client ID' : 'API Key'}
                        </Label>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                          {selectedVendor.api_key || selectedVendor.client_id ? '••••••••••••••••' : 'Not configured'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <Label className="text-sm font-medium text-gray-500">
                          {selectedVendor.type === 'pathao' ? 'Client Secret' : 'Secret Key'}
                        </Label>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                          {selectedVendor.secret_key || selectedVendor.client_secret ? '••••••••••••••••' : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-500">Last Synced</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-sm">
                          {selectedVendor.last_synced ? new Date(selectedVendor.last_synced).toLocaleString() : 'Never synced'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Supported Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(selectedVendor.service_types || []).map(service => (
                      <Badge key={service} variant="outline" className="px-3 py-1">{service}</Badge>
                    ))}
                    {(!selectedVendor.service_types || selectedVendor.service_types.length === 0) && (
                      <p className="text-gray-500 text-sm">No services configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => testApiConnection(selectedVendor)} className="bg-purple-600 hover:bg-purple-700 text-white flex-1">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedVendor);
                }} className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700 flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVendor?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVendor}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};