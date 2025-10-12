import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateSecurePassword = (length: number = 16): string => {
  const getRandomChar = (chars: string): string => {
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    return chars[array[0] % chars.length];
  };
  
  const charSets = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digit: '0123456789',
    symbol: '!@#$%^&*'
  };
  
  let password = '';
  password += getRandomChar(charSets.lower);
  password += getRandomChar(charSets.upper);
  password += getRandomChar(charSets.digit);
  password += getRandomChar(charSets.symbol);
  
  const allChars = Object.values(charSets).join('');
  for (let i = 4; i < length; i++) {
    password += getRandomChar(allChars);
  }
  
  return password.split('').sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join('');
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score
  };
};