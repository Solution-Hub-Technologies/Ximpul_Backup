import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { CustomCaptcha } from '@/components/ui/custom-captcha';
import { Shield, Eye, EyeOff } from 'lucide-react';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login, isAuthenticated } = useAdminAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!captchaVerified || !captchaToken) {
      toast.error('Please complete the security verification');
      return;
    }
    
    setIsLoading(true);

    const result = await login(email, password, captchaToken);
    
    if (result.success) {
      toast.success('Login successful');
      setLoginAttempts(0);
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      toast.error(result.error || 'Login failed');
      
      // Reset CAPTCHA after failed attempt
      setCaptchaVerified(false);
      setCaptchaToken(null);
      
      // Clear password after multiple failed attempts
      if (newAttempts >= 3) {
        setPassword('');
        toast.error('Multiple failed attempts. Please try again.');
      }
    }
    
    setIsLoading(false);
  };
  
  const handleCaptchaVerify = (isValid: boolean) => {
    setCaptchaVerified(isValid);
  };
  
  const handleCaptchaTokenChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ximpul Admin</h1>
          <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
        </div>
        
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-2 bg-primary w-full"></div>
          <CardHeader className="text-center pt-6 pb-2">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-primary mr-2" />
              <CardTitle className="text-2xl font-medium text-gray-800">
                Secure Sign In
              </CardTitle>
            </div>
            <p className="text-gray-500 text-sm mt-1">Access the order management system</p>
            {loginAttempts > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-xs">
                  Failed attempts: {loginAttempts}/5
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-11 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Security Verification
                </label>
                <CustomCaptcha
                  onVerify={handleCaptchaVerify}
                  onTokenChange={handleCaptchaTokenChange}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-md" 
                disabled={isLoading || !captchaVerified || !captchaToken || loginAttempts >= 5}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : loginAttempts >= 5 ? (
                  'Account Locked'
                ) : (
                  'Secure Sign In'
                )}
              </Button>
              
              {loginAttempts >= 5 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm text-center">
                    Account temporarily locked due to multiple failed attempts.
                    Please contact administrator.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} Ximpul. All rights reserved.
        </p>
      </div>
    </div>
  );
};
