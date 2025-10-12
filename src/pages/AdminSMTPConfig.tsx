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
import { X, Mail, Settings, TestTube, Shield, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('test');

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
        .select('*');
      
      if (error) throw error;
      setEmailConfigs(data || []);
    } catch (error: any) {
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
      fetchEmailConfigs();
    } catch (error: any) {
      toast.error('Failed to update email configuration');
    }
  };

  const addEmailToConfig = (emails: string[], newEmail: string): string[] => {
    if (newEmail && !emails.includes(newEmail)) {
      return [...emails, newEmail];
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
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Email Testing
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
          {emailConfigs.map(config => {
            const isCustomer = config.config_type === 'customer';
            return (
            <Card key={config.id} className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className={`${isCustomer ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white rounded-t-lg`}>
                <CardTitle className="flex items-center gap-2 capitalize">
                  <Mail className="w-5 h-5" />
                  {config.config_type} Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    To Emails {isCustomer && <span className="text-xs text-gray-500">(Read-only for customer emails)</span>}
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.to_emails.map(email => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            const newToEmails = removeEmailFromConfig(config.to_emails, email);
                            updateEmailConfig(config.config_type, newToEmails, config.cc_emails);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Add new email"
                      disabled={isCustomer}
                      className={`border-gray-200 ${isCustomer ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-purple-500 focus:ring-purple-500'}`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isCustomer) {
                          const newToEmails = addEmailToConfig(config.to_emails, newEmail);
                          updateEmailConfig(config.config_type, newToEmails, config.cc_emails);
                          setNewEmail('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (!isCustomer) {
                          const newToEmails = addEmailToConfig(config.to_emails, newEmail);
                          updateEmailConfig(config.config_type, newToEmails, config.cc_emails);
                          setNewEmail('');
                        }
                      }}
                      disabled={isCustomer}
                      className={isCustomer ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">CC Emails</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.cc_emails.map(email => (
                      <Badge key={email} variant="outline" className="flex items-center gap-1">
                        {email}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            const newCcEmails = removeEmailFromConfig(config.cc_emails, email);
                            updateEmailConfig(config.config_type, config.to_emails, newCcEmails);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Add new CC email"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newCcEmails = addEmailToConfig(config.cc_emails, newEmail);
                          updateEmailConfig(config.config_type, config.to_emails, newCcEmails);
                          setNewEmail('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        const newCcEmails = addEmailToConfig(config.cc_emails, newEmail);
                        updateEmailConfig(config.config_type, config.to_emails, newCcEmails);
                        setNewEmail('');
                      }}
                    >
                      Add CC
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};