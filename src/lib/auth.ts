// lib/auth.ts
import { randomBytes } from 'crypto';

export function generateState(): string {
  return randomBytes(32).toString('hex');
}

// In production, you'd want to verify this against a stored state
export function validateState(state: string | null): boolean {
  if (!state) {
    return false;
  }
  
  // Add your state validation logic here
  return true;
}

export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    const allowedDomains = [
      'localhost',
      // Add your production domains here
    ];
    
    return allowedDomains.includes(url.hostname);
  } catch {
    return false;
  }
}