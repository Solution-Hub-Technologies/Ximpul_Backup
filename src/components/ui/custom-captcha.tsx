import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface CustomCaptchaProps {
  onVerify: (isValid: boolean) => void;
  onTokenChange: (token: string | null) => void;
}

export const CustomCaptcha: React.FC<CustomCaptchaProps> = ({ onVerify, onTokenChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 0.3)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw text with distortion
    ctx.font = 'bold 32px Arial';
    ctx.textBaseline = 'middle';
    
    const textWidth = ctx.measureText(text).width;
    const startX = (canvas.width - textWidth) / 2;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = startX + (i * textWidth / text.length) + (Math.random() - 0.5) * 10;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      const rotation = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Text shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillText(char, 2, 2);
      
      // Main text with random colors
      const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
    }

    // Add distortion lines over text
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.5)`;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.quadraticCurveTo(
        canvas.width / 2 + (Math.random() - 0.5) * 50,
        Math.random() * canvas.height,
        canvas.width,
        Math.random() * canvas.height
      );
      ctx.stroke();
    }
  };

  const refreshCaptcha = () => {
    const newText = generateCaptcha();
    setCaptchaText(newText);
    setUserInput('');
    setIsVerified(false);
    setAttempts(0);
    onVerify(false);
    onTokenChange(null);
    setTimeout(() => drawCaptcha(newText), 100);
  };

  const verifyCaptcha = () => {
    const isValid = userInput.toUpperCase() === captchaText.toUpperCase();
    setIsVerified(isValid);
    onVerify(isValid);
    
    if (isValid) {
      // Generate a simple token
      const token = btoa(`${captchaText}-${Date.now()}-${Math.random()}`);
      onTokenChange(token);
    } else {
      setAttempts(prev => prev + 1);
      onTokenChange(null);
      if (attempts >= 2) {
        refreshCaptcha();
      }
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  useEffect(() => {
    if (userInput.length === 6) {
      verifyCaptcha();
    }
  }, [userInput]);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={80}
            className="border border-gray-300 rounded-md bg-white cursor-pointer"
            onClick={refreshCaptcha}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
            <span className="text-white text-xs font-medium">Click to refresh</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refreshCaptcha}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter the code above"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          maxLength={6}
          className={`text-center font-mono text-lg tracking-widest ${
            isVerified 
              ? 'border-green-500 bg-green-50' 
              : attempts > 0 && userInput.length === 6
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
          }`}
        />
        
        {isVerified && (
          <div className="flex items-center justify-center text-green-600 text-sm">
            <span className="mr-1">✓</span>
            Verification successful
          </div>
        )}
        
        {attempts > 0 && !isVerified && userInput.length === 6 && (
          <div className="flex items-center justify-center text-red-600 text-sm">
            <span className="mr-1">✗</span>
            Incorrect code. Try again. ({attempts}/3)
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          Enter the 6-character code shown above
        </div>
      </div>
    </div>
  );
};