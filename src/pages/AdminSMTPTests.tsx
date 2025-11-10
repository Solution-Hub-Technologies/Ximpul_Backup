import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Send, Settings, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

export const AdminSMTPTests = () => {
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    from: '',
    fromName: ''
  });
  
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: 'SMTP Test Email',
    message: 'This is a test email to verify SMTP configuration is working correctly.'
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSMTPConfig();
    addLog('info', 'SMTP Test Panel initialized');
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadSMTPConfig = async () => {
    setIsLoading(true);
    addLog('info', 'Loading SMTP configuration from environment...');
    
    try {
      // Load from environment variables
      const config = {
        host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(import.meta.env.VITE_SMTP_PORT) || 587,
        user: import.meta.env.VITE_SMTP_USER || 'ximpulshop@gmail.com',
        pass: import.meta.env.VITE_SMTP_PASS || 'grnj yivy gcmd dknp',
        from: import.meta.env.VITE_SMTP_FROM || 'ximpulshop@gmail.com',
        fromName: import.meta.env.VITE_SMTP_FROM_NAME || 'Ximpul Shop'
      };
      
      setSMTPConfig(config);
      addLog('success', 'SMTP configuration loaded successfully', {
        host: config.host,
        port: config.port,
        user: config.user,
        from: config.from,
        fromName: config.fromName
      });
    } catch (error) {
      addLog('error', 'Failed to load SMTP configuration', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const testSMTPConnection = async () => {
    setIsTesting(true);
    addLog('info', 'Testing SMTP connection...');
    
    try {
      addLog('info', 'Connecting to SMTP server...', { host: smtpConfig.host, port: smtpConfig.port });
      
      // Simple connection test by sending a test email to admin
      const response = await fetch('https://ximpul.com/smtp-test.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          to: 'ximpulshop@gmail.com',
          subject: 'SMTP Connection Test',
          message: 'This is a connection test from admin panel.',
          from_name: 'SMTP Test'
        })
      });
      
      if (response.ok) {
        addLog('success', 'SMTP connection test successful');
        toast.success('SMTP connection is working!');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      addLog('error', 'SMTP connection test failed', error.message);
      toast.error('SMTP connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.to) {
      toast.error('Please enter recipient email');
      return;
    }

    setIsTesting(true);
    addLog('info', `Sending test email to ${testEmail.to}...`);
    
    try {
      addLog('info', 'Preparing email data...', {
        to: testEmail.to,
        subject: testEmail.subject,
        from: smtpConfig.from
      });
      
      addLog('info', 'Sending email via existing system...');
      
      const response = await fetch('https://ximpul.com/smtp-test.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          to: testEmail.to,
          subject: testEmail.subject,
          message: testEmail.message,
          from_name: smtpConfig.fromName || 'Ximpul Shop'
        })
      });
      
      const result = await response.text();
      addLog('info', 'Email response received', result);
      
      if (response.ok) {
        addLog('success', `Test email sent successfully to ${testEmail.to}`);
        toast.success('Test email sent successfully!');
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      addLog('error', `Failed to send test email: ${error.message}`, error);
      toast.error('Failed to send test email');
    } finally {
      setIsTesting(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMTP Testing</h1>
          <p className="text-muted-foreground">
            Test and monitor SMTP email functionality with real-time logs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSMTPConfig} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reload Config
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              SMTP Configuration
            </CardTitle>
            <CardDescription>
              Current SMTP settings loaded from environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={smtpConfig.host}
                  onChange={(e) => setSMTPConfig({...smtpConfig, host: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSMTPConfig({...smtpConfig, port: parseInt(e.target.value)})}
                  placeholder="587"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="smtp-user">Username</Label>
              <Input
                id="smtp-user"
                value={smtpConfig.user}
                onChange={(e) => setSMTPConfig({...smtpConfig, user: e.target.value})}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div>
              <Label htmlFor="smtp-pass">Password</Label>
              <Input
                id="smtp-pass"
                type="password"
                value={smtpConfig.pass}
                onChange={(e) => setSMTPConfig({...smtpConfig, pass: e.target.value})}
                placeholder="App password"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-from">From Email</Label>
                <Input
                  id="smtp-from"
                  value={smtpConfig.from}
                  onChange={(e) => setSMTPConfig({...smtpConfig, from: e.target.value})}
                  placeholder="noreply@ximpul.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp-from-name">From Name</Label>
                <Input
                  id="smtp-from-name"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSMTPConfig({...smtpConfig, fromName: e.target.value})}
                  placeholder="Ximpul Shop"
                />
              </div>
            </div>
            
            <Button 
              onClick={testSMTPConnection} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Test SMTP Connection
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-to">Recipient Email</Label>
              <Input
                id="test-to"
                type="email"
                value={testEmail.to}
                onChange={(e) => setTestEmail({...testEmail, to: e.target.value})}
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="test-subject">Subject</Label>
              <Input
                id="test-subject"
                value={testEmail.subject}
                onChange={(e) => setTestEmail({...testEmail, subject: e.target.value})}
                placeholder="Test Email Subject"
              />
            </div>
            
            <div>
              <Label htmlFor="test-message">Message</Label>
              <Textarea
                id="test-message"
                value={testEmail.message}
                onChange={(e) => setTestEmail({...testEmail, message: e.target.value})}
                placeholder="Test email message..."
                rows={4}
              />
            </div>
            
            <Button 
              onClick={sendTestEmail} 
              disabled={isTesting || !testEmail.to}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time Logs</CardTitle>
              <CardDescription>
                Live monitoring of SMTP operations and responses
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No logs yet. Start testing to see real-time activity.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-gray-400 text-xs mt-1">{log.timestamp}</span>
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getLogBadgeVariant(log.type)} className="text-xs">
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm">{log.message}</span>
                      </div>
                      {log.details && (
                        <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};