import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Mail, Settings, TestTube, Shield, Eye, EyeOff, Edit, Save, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  template: string;
  variables: string[];
}

interface EmailConfig {
  id: string;
  config_type: string;
  to_emails: string[];
  cc_emails: string[];
}

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_name: string;
  is_active: boolean;
}

export const AdminSMTPConfig = () => {
  const { adminUser, hasPermission } = useAdminAuth();
  const [emailData, setEmailData] = useState({
    to: 'ximpulshop@gmail.com',
    subject: 'Test Email',
    message: 'This is a test email from the admin panel.',
    cc: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_name: '',
    is_active: true
  });
  const [templateVariables, setTemplateVariables] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailByConfig, setNewEmailByConfig] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('test');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'order',
    subject: '',
    template: '',
    variables: [] as string[]
  });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{[key: string]: string}>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalTemplate, setModalTemplate] = useState({
    id: '',
    name: '',
    type: 'order',
    subject: '',
    template: '',
    variables: [] as string[]
  });
  const [modalPreviewData, setModalPreviewData] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchTemplates();
    fetchEmailConfigs();
    fetchSMTPConfig();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch templates');
    }
  };

  const fetchEmailConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .order('config_type');
      
      if (error) throw error;
      setEmailConfigs(data || []);
    } catch (error: any) {
      console.error('Error fetching email configs:', error);
      toast.error('Failed to fetch email configs');
    }
  };

  const fetchSMTPConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_config')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      if (data) {
        setSMTPConfig({
          host: data.host || '',
          port: data.port || 587,
          username: data.username || '',
          password: data.password || '',
          from_name: data.from_name || '',
          is_active: true
        });
      } else {
        addLog('⚠️ No SMTP configuration found in database');
      }
    } catch (error: any) {
      console.log('No SMTP config found');
      addLog('⚠️ No SMTP configuration found. Please configure SMTP settings first.');
    }
  };

  const saveSMTPConfig = async () => {
    try {
      setIsLoading(true);
      addLog('Saving SMTP configuration...');
      
      // Check if config exists
      const { data: existingConfig } = await supabase
        .from('smtp_config')
        .select('id')
        .eq('is_active', true)
        .single();
      
      let error;
      
      if (existingConfig) {
        // Update existing config
        const result = await supabase
          .from('smtp_config')
          .update({
            host: smtpConfig.host,
            port: smtpConfig.port,
            username: smtpConfig.username,
            password: smtpConfig.password,
            from_name: smtpConfig.from_name
          })
          .eq('id', existingConfig.id);
        error = result.error;
      } else {
        // Insert new config
        const result = await supabase
          .from('smtp_config')
          .insert({
            ...smtpConfig,
            is_active: true
          });
        error = result.error;
      }
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('SMTP configuration saved successfully');
      addLog('✅ SMTP configuration saved');
      fetchSMTPConfig();
    } catch (error: any) {
      toast.error('Failed to save SMTP configuration');
      addLog(`❌ Save failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'custom') {
      setSelectedTemplate('');
      setEmailData({
        ...emailData,
        subject: 'Test Email',
        message: 'This is a test email from the admin panel.'
      });
      setTemplateVariables({});
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setEmailData({
        ...emailData,
        subject: template.subject,
        message: template.template
      });
      
      // Initialize template variables
      const vars: {[key: string]: string} = {};
      template.variables.forEach(variable => {
        vars[variable] = getDefaultValue(variable);
      });
      setTemplateVariables(vars);
    }
  };

  const getDefaultValue = (variable: string): string => {
    const defaults: {[key: string]: string} = {
      customerName: 'John Doe',
      customerEmail: 'customer@example.com',
      customerPhone: '+8801234567890',
      orderId: '12345',
      selectedEdition: 'Premium',
      selectedColor: 'Obsidian',
      totalAmount: '2500',
      paymentMethod: 'Online',
      subject: 'Test Subject',
      message: 'Test message content',
      color: 'Obsidian',
      id: 'uuid-123'
    };
    return defaults[variable] || `{{${variable}}}`;
  };

  const processTemplate = (template: string, variables: {[key: string]: string}): string => {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processed;
  };

  const testEmail = async () => {
    setIsLoading(true);
    addLog('Starting email test...');
    
    try {
      let finalSubject = emailData.subject;
      let finalMessage = emailData.message;
      
      if (selectedTemplate) {
        finalSubject = processTemplate(emailData.subject, templateVariables);
        finalMessage = processTemplate(emailData.message, templateVariables);
      }
      
      addLog(`Using SMTP: ${smtpConfig.host}:${smtpConfig.port}`);
      addLog(`From: ${smtpConfig.from_name} <${smtpConfig.username}>`);
      addLog(`Sending to: ${emailData.to}`);
      addLog(`CC: ${emailData.cc || 'None'}`);
      addLog(`Subject: ${finalSubject}`);
      
      const params = new URLSearchParams({
        to: emailData.to,
        subject: finalSubject,
        message: finalMessage,
        from_name: smtpConfig.from_name
      });
      
      if (emailData.cc) {
        params.append('cc', emailData.cc);
      }
      
      const response = await fetch('https://ximpul.com/smtp-mailer.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      
      addLog(`Response status: ${response.status}`);
      
      const result = await response.json();
      addLog(`Response: ${JSON.stringify(result)}`);
      
      if (result.success) {
        toast.success('Email sent successfully!');
        addLog('✅ Email sent successfully');
      } else {
        toast.error(`Email failed: ${result.error}`);
        addLog(`❌ Email failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmailConfig = async (configType: string, toEmails: string[], ccEmails: string[]) => {
    try {
      const { error } = await supabase
        .from('email_config')
        .update({ to_emails: toEmails, cc_emails: ccEmails })
        .eq('config_type', configType);
      
      if (error) throw error;
      
      toast.success('Email configuration updated');
      await fetchEmailConfigs();
    } catch (error: any) {
      console.error('Error updating email config:', error);
      toast.error('Failed to update email configuration');
    }
  };

  const addEmailToConfig = (emails: string[], newEmail: string): string[] => {
    const trimmedEmail = newEmail.trim();
    if (trimmedEmail && !emails.includes(trimmedEmail)) {
      return [...emails, trimmedEmail];
    }
    return emails;
  };

  const removeEmailFromConfig = (emails: string[], emailToRemove: string): string[] => {
    return emails.filter(email => email !== emailToRemove);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getCustomerEmailConfig = () => {
    return emailConfigs.find(config => config.config_type === 'customer');
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
            <p className="text-gray-600">Only superadmin users can access SMTP configuration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Configuration</h1>
          <p className="text-gray-600">Manage SMTP settings and test email delivery</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Email Testing
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              SMTP Settings
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Recipients
            </TabsTrigger>
          </TabsList>
        
        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Email Template Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Template</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or use custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Email</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTemplate && (
                <div className="space-y-3">
                  <h4 className="font-medium">Template Variables</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(templateVariables).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1">{key}</label>
                        <Input
                          value={value}
                          onChange={(e) => setTemplateVariables({...templateVariables, [key]: e.target.value})}
                          placeholder={`Enter ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-700">To Email</Label>
                <Input
                  value={emailData.to}
                  onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                  placeholder="recipient@example.com"
                  className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">CC Emails (comma separated)</Label>
                <Input
                  value={emailData.cc}
                  onChange={(e) => setEmailData({...emailData, cc: e.target.value})}
                  placeholder="cc1@example.com, cc2@example.com"
                  className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Subject</Label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  placeholder="Email subject"
                  className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  placeholder="Email message"
                  rows={8}
                  className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={testEmail} 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                >
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
                <Button variant="outline" onClick={clearLogs} className="border-gray-300 hover:bg-gray-50">
                  Clear Logs
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Test Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm border">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet. Run a test to see logs here.</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1 leading-relaxed">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </CardTitle>
                {editingTemplate && (
                  <p className="text-purple-100 text-sm mt-1">Editing existing template</p>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Template Name</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="Order Confirmation"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Type</Label>
                    <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Subject</Label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    placeholder="Order Confirmation - {{orderId}}"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Template</Label>
                  <Textarea
                    value={newTemplate.template}
                    onChange={(e) => {
                      setNewTemplate({...newTemplate, template: e.target.value});
                      // Extract variables from template
                      const matches = e.target.value.match(/{{(\w+)}}/g);
                      const variables = matches ? [...new Set(matches.map(m => m.slice(2, -2)))] : [];
                      setNewTemplate(prev => ({...prev, variables}));
                    }}
                    placeholder="Dear {{customerName}},\n\nYour order {{orderId}} has been confirmed.\n\nThank you!"
                    rows={12}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                
                {newTemplate.variables.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Variables Found</Label>
                    <div className="flex flex-wrap gap-2">
                      {newTemplate.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={async () => {
                      if (!newTemplate.name.trim()) {
                        toast.error('Template name is required');
                        return;
                      }
                      if (!newTemplate.template.trim()) {
                        toast.error('Template content is required');
                        return;
                      }
                      
                      try {
                        setIsLoading(true);
                        
                        if (editingTemplate) {
                          // Update existing template
                          const { error } = await supabase
                            .from('email_templates')
                            .update({
                              name: newTemplate.name,
                              type: newTemplate.type,
                              subject: newTemplate.subject,
                              template: newTemplate.template,
                              variables: newTemplate.variables
                            })
                            .eq('id', editingTemplate);
                          
                          if (error) throw error;
                          toast.success('Template updated successfully');
                        } else {
                          // Create new template
                          const { error } = await supabase
                            .from('email_templates')
                            .insert({
                              name: newTemplate.name,
                              type: newTemplate.type,
                              subject: newTemplate.subject,
                              template: newTemplate.template,
                              variables: newTemplate.variables
                            });
                          
                          if (error) throw error;
                          toast.success('Template created successfully');
                        }
                        
                        setNewTemplate({ name: '', type: 'order', subject: '', template: '', variables: [] });
                        setEditingTemplate(null);
                        setPreviewData({});
                        fetchTemplates();
                      } catch (error: any) {
                        toast.error(`Failed to ${editingTemplate ? 'update' : 'save'} template`);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewTemplate({ name: '', type: 'order', subject: '', template: '', variables: [] });
                      setEditingTemplate(null);
                      setPreviewData({});
                    }}
                    disabled={isLoading}
                  >
                    {editingTemplate ? 'Cancel Edit' : 'Clear'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {newTemplate.variables.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Preview Data</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {newTemplate.variables.map(variable => (
                        <div key={variable} className="flex items-center gap-2">
                          <Label className="text-xs w-20 truncate">{variable}:</Label>
                          <Input
                            size="sm"
                            value={previewData[variable] || getDefaultValue(variable)}
                            onChange={(e) => setPreviewData({...previewData, [variable]: e.target.value})}
                            className="text-xs h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Subject Preview</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm font-medium">
                    {processTemplate(newTemplate.subject, {...previewData, ...Object.fromEntries(newTemplate.variables.map(v => [v, previewData[v] || getDefaultValue(v)]))}) || 'Enter subject...'}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Email Preview</Label>
                  <div className="p-4 bg-white border rounded-lg h-64 overflow-y-auto text-sm whitespace-pre-wrap">
                    {processTemplate(newTemplate.template, {...previewData, ...Object.fromEntries(newTemplate.variables.map(v => [v, previewData[v] || getDefaultValue(v)]))}) || 'Start typing your template to see preview...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Template Library ({templates.length})
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => {
                    setNewTemplate({ name: '', type: 'order', subject: '', template: '', variables: [] });
                    setEditingTemplate(null);
                    setActiveTab('templates');
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  + New Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                  <p className="text-gray-500 mb-4">Create your first email template to get started</p>
                  <Button 
                    onClick={() => {
                      setNewTemplate({ name: '', type: 'order', subject: '', template: '', variables: [] });
                      setEditingTemplate(null);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600"
                  >
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map(template => (
                    <Card key={template.id} className="border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                              <Badge 
                                variant={template.type === 'order' ? 'default' : template.type === 'payment' ? 'secondary' : 'outline'}
                                className="capitalize"
                              >
                                {template.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 font-medium">
                              📧 {template.subject}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>🔧 {template.variables?.length || 0} variables</span>
                              <span>📝 {template.template?.length || 0} characters</span>
                            </div>
                          </div>
                        </div>
                        
                        {template.variables && template.variables.length > 0 && (
                          <div className="mb-4">
                            <Label className="text-xs font-medium text-gray-500 mb-2 block">VARIABLES USED</Label>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map(variable => (
                                <Badge key={variable} variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                                  {`{{${variable}}}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                          <Label className="text-xs font-medium text-gray-500 mb-1 block">TEMPLATE PREVIEW</Label>
                          <div className="text-sm text-gray-700 max-h-20 overflow-hidden">
                            {template.template?.substring(0, 150)}{template.template?.length > 150 ? '...' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setModalTemplate({
                                  id: template.id,
                                  name: template.name,
                                  type: template.type,
                                  subject: template.subject,
                                  template: template.template,
                                  variables: template.variables || []
                                });
                                // Initialize modal preview data
                                const previewVars: {[key: string]: string} = {};
                                template.variables?.forEach(variable => {
                                  previewVars[variable] = getDefaultValue(variable);
                                });
                                setModalPreviewData(previewVars);
                                setShowEditModal(true);
                              }}
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            >
                              <Edit className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Copy template for duplication
                                setNewTemplate({
                                  name: `${template.name} (Copy)`,
                                  type: template.type,
                                  subject: template.subject,
                                  template: template.template,
                                  variables: template.variables
                                });
                                setEditingTemplate(null);
                                toast.success('Template copied to editor');
                              }}
                              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            >
                              <Copy className="w-3 h-3 mr-1" /> Duplicate
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Use template for testing
                                setSelectedTemplate(template.id);
                                setEmailData({
                                  ...emailData,
                                  subject: template.subject,
                                  message: template.template
                                });
                                const vars: {[key: string]: string} = {};
                                template.variables?.forEach(variable => {
                                  vars[variable] = getDefaultValue(variable);
                                });
                                setTemplateVariables(vars);
                                setActiveTab('test');
                                toast.success('Template loaded for testing');
                              }}
                              className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                            >
                              <TestTube className="w-3 h-3 mr-1" /> Test
                            </Button>
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
                                try {
                                  setIsLoading(true);
                                  const { error } = await supabase
                                    .from('email_templates')
                                    .delete()
                                    .eq('id', template.id);
                                  
                                  if (error) throw error;
                                  toast.success('Template deleted successfully');
                                  fetchTemplates();
                                } catch (error: any) {
                                  toast.error('Failed to delete template');
                                } finally {
                                  setIsLoading(false);
                                }
                              }
                            }}
                            className="hover:bg-red-600"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="smtp" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                SMTP Server Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">SMTP Host</Label>
                  <Input
                    value={smtpConfig.host}
                    onChange={(e) => setSMTPConfig({...smtpConfig, host: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="mt-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Port</Label>
                  <Input
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) => setSMTPConfig({...smtpConfig, port: parseInt(e.target.value)})}
                    placeholder="587"
                    className="mt-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Username (Email)</Label>
                <Input
                  value={smtpConfig.username}
                  onChange={(e) => setSMTPConfig({...smtpConfig, username: e.target.value})}
                  placeholder="your-email@gmail.com"
                  className="mt-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Password / App Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpConfig.password}
                    onChange={(e) => setSMTPConfig({...smtpConfig, password: e.target.value})}
                    placeholder="App password or email password"
                    className="pr-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">From Name</Label>
                <Input
                  value={smtpConfig.from_name}
                  onChange={(e) => setSMTPConfig({...smtpConfig, from_name: e.target.value})}
                  placeholder="Ximpul Shop"
                  className="mt-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex gap-3">
                <Button 
                  onClick={saveSMTPConfig} 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                >
                  {isLoading ? 'Saving...' : 'Save SMTP Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Admin Email Recipients
              </CardTitle>
              <p className="text-blue-100 text-sm mt-2">Manage who receives order notifications and admin alerts</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-gray-800 mb-3 block">
                    📧 Admin Email Addresses
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    These emails will receive all order notifications, admin alerts, and system notifications.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg border">
                    {(emailConfigs.find(c => c.config_type === 'customer')?.to_emails || []).map(email => (
                      <Badge key={email} variant="default" className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                        <span>{email}</span>
                        <X 
                          className="w-4 h-4 cursor-pointer hover:text-red-600" 
                          onClick={() => {
                            const config = emailConfigs.find(c => c.config_type === 'customer');
                            if (config) {
                              const newToEmails = removeEmailFromConfig(config.to_emails, email);
                              updateEmailConfig('customer', newToEmails, config.cc_emails);
                            }
                          }}
                        />
                      </Badge>
                    ))}
                    {(emailConfigs.find(c => c.config_type === 'customer')?.to_emails || []).length === 0 && (
                      <p className="text-gray-500 italic">No admin emails configured yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Input
                      value={newEmailByConfig['admin-emails'] || ''}
                      onChange={(e) => setNewEmailByConfig({...newEmailByConfig, 'admin-emails': e.target.value})}
                      placeholder="Enter admin email address (e.g., admin@ximpul.com)"
                      className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const email = newEmailByConfig['admin-emails'];
                          if (email) {
                            const config = emailConfigs.find(c => c.config_type === 'customer') || { to_emails: [], cc_emails: [] };
                            const newToEmails = addEmailToConfig(config.to_emails, email);
                            updateEmailConfig('customer', newToEmails, config.cc_emails);
                            setNewEmailByConfig({...newEmailByConfig, 'admin-emails': ''});
                          }
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        const email = newEmailByConfig['admin-emails'];
                        if (email) {
                          const config = emailConfigs.find(c => c.config_type === 'customer') || { to_emails: [], cc_emails: [] };
                          const newToEmails = addEmailToConfig(config.to_emails, email);
                          updateEmailConfig('customer', newToEmails, config.cc_emails);
                          setNewEmailByConfig({...newEmailByConfig, 'admin-emails': ''});
                        }
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
                    >
                      Add Email
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 What emails will be sent here?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• New order notifications</li>
                    <li>• Payment confirmations</li>
                    <li>• System alerts and updates</li>
                    <li>• Admin panel notifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Template Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Edit Email Template
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Edit HTML content and preview in real-time</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex h-96">
              {/* Editor Section */}
              <div className="w-1/2 p-4 border-r overflow-y-auto">
                <div className="space-y-3">
                  <Input
                    value={modalTemplate.name}
                    onChange={(e) => setModalTemplate({...modalTemplate, name: e.target.value})}
                    placeholder="Template Name"
                    className="text-sm"
                  />
                  
                  <Input
                    value={modalTemplate.subject}
                    onChange={(e) => setModalTemplate({...modalTemplate, subject: e.target.value})}
                    placeholder="Subject Line"
                    className="text-sm"
                  />
                  
                  <Textarea
                    value={modalTemplate.template}
                    onChange={(e) => {
                      setModalTemplate({...modalTemplate, template: e.target.value});
                      const matches = e.target.value.match(/{{(\w+)}}/g);
                      const variables = matches ? [...new Set(matches.map(m => m.slice(2, -2)))] : [];
                      setModalTemplate(prev => ({...prev, variables}));
                    }}
                    placeholder="<h2>Hello {{customerName}}</h2><p>Your order {{orderId}} is confirmed.</p>"
                    rows={15}
                    className="font-mono text-xs"
                  />
                  
                  {modalTemplate.variables.length > 0 && (
                    <div className="space-y-2">
                      {modalTemplate.variables.map(variable => (
                        <div key={variable} className="flex gap-2">
                          <span className="text-xs w-16 text-gray-600">{variable}:</span>
                          <Input
                            size="sm"
                            value={modalPreviewData[variable] || getDefaultValue(variable)}
                            onChange={(e) => setModalPreviewData({...modalPreviewData, [variable]: e.target.value})}
                            className="text-xs h-6 flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Live Preview</h3>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Live
                    </Badge>
                  </div>
                  
                  {/* Subject Preview */}
                  <div className="bg-white border rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Subject</Label>
                    <div className="font-semibold text-gray-900">
                      {processTemplate(modalTemplate.subject, {...modalPreviewData, ...Object.fromEntries(modalTemplate.variables.map(v => [v, modalPreviewData[v] || getDefaultValue(v)]))}) || 'Enter subject...'}
                    </div>
                  </div>
                  
                  {/* HTML Content Preview */}
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <Label className="text-sm font-medium text-gray-700 p-4 pb-2 block">Email Content</Label>
                    <div className="max-h-96 overflow-y-auto p-4 pt-2">
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: processTemplate(modalTemplate.template, {...modalPreviewData, ...Object.fromEntries(modalTemplate.variables.map(v => [v, modalPreviewData[v] || getDefaultValue(v)]))}) || '<div style="padding: 20px; text-align: center; color: #9ca3af; font-style: italic;">Start typing your HTML template to see preview...</div>'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const { error } = await supabase
                      .from('email_templates')
                      .update({
                        name: modalTemplate.name,
                        type: modalTemplate.type,
                        subject: modalTemplate.subject,
                        template: modalTemplate.template,
                        variables: modalTemplate.variables
                      })
                      .eq('id', modalTemplate.id);
                    
                    if (error) throw error;
                    
                    toast.success('Template updated successfully');
                    setShowEditModal(false);
                    fetchTemplates();
                  } catch (error) {
                    toast.error('Failed to update template');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};