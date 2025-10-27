// IP Detection Utility
// Provides reliable IP address detection for exam session security

export interface IPDetectionResult {
  ip: string | null;
  method: 'api' | 'fallback' | 'failed';
  error?: string;
}

/**
 * Detect client IP address using multiple fallback methods
 * @returns Promise<IPDetectionResult>
 */
export async function detectClientIP(): Promise<IPDetectionResult> {
  // Method 1: Try ipify.org (most reliable)
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip && typeof data.ip === 'string') {
        console.log('✅ IP detected via ipify.org:', data.ip);
        return {
          ip: data.ip,
          method: 'api'
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ ipify.org failed:', error);
  }

  // Method 2: Try ipapi.co as fallback
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip && typeof data.ip === 'string') {
        console.log('✅ IP detected via ipapi.co:', data.ip);
        return {
          ip: data.ip,
          method: 'api'
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ ipapi.co failed:', error);
  }

  // Method 3: Try httpbin.org as last resort
  try {
    const response = await fetch('https://httpbin.org/ip', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.origin && typeof data.origin === 'string') {
        // httpbin returns "origin" field, might contain multiple IPs
        const ip = data.origin.split(',')[0].trim();
        console.log('✅ IP detected via httpbin.org:', ip);
        return {
          ip: ip,
          method: 'api'
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ httpbin.org failed:', error);
  }

  // Method 4: Fallback to localhost detection (for development)
  try {
    // This is a fallback for development environments
    // In production, this would indicate a network issue
    const response = await fetch('/api/client-ip', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        console.log('✅ IP detected via local API:', data.ip);
        return {
          ip: data.ip,
          method: 'fallback'
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Local API fallback failed:', error);
  }

  // All methods failed
  console.error('❌ All IP detection methods failed');
  return {
    ip: null,
    method: 'failed',
    error: 'Unable to detect IP address - all detection methods failed'
  };
}

/**
 * Validate IP address format
 * @param ip IP address string
 * @returns boolean
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) return true;
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(ip)) return true;
  
  // IPv6 compressed format
  const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?$/;
  if (ipv6CompressedRegex.test(ip)) return true;
  
  return false;
}

/**
 * Get IP address with retry mechanism
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise<IPDetectionResult>
 */
export async function getClientIPWithRetry(maxRetries: number = 2): Promise<IPDetectionResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 IP detection attempt ${attempt}/${maxRetries}`);
    
    const result = await detectClientIP();
    
    if (result.ip && isValidIP(result.ip)) {
      console.log(`✅ IP detection successful on attempt ${attempt}:`, result.ip);
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error(`❌ IP detection failed after ${maxRetries} attempts`);
  return {
    ip: null,
    method: 'failed',
    error: `IP detection failed after ${maxRetries} attempts`
  };
}

/**
 * Get user agent string
 * @returns string
 */
export function getUserAgent(): string {
  return navigator.userAgent || 'Unknown User Agent';
}

/**
 * Get comprehensive client information for exam session
 * @returns Promise<{ip: string | null, userAgent: string, timestamp: string}>
 */
export async function getClientInfo(): Promise<{
  ip: string | null;
  userAgent: string;
  timestamp: string;
  detectionMethod: string;
}> {
  const ipResult = await getClientIPWithRetry(2);
  
  return {
    ip: ipResult.ip,
    userAgent: getUserAgent(),
    timestamp: new Date().toISOString(),
    detectionMethod: ipResult.method
  };
}
