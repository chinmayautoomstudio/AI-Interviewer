// IP Detection Test Component
// Test component to verify IP detection functionality

import React, { useState } from 'react';
import { getClientInfo, detectClientIP, isValidIP } from '../../utils/ipDetection';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

interface IPTestResult {
  ip: string | null;
  method: string;
  isValid: boolean;
  userAgent: string;
  timestamp: string;
  error?: string;
}

const IPDetectionTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IPTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testIPDetection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Starting IP detection test...');
      
      // Test basic IP detection
      const ipResult = await detectClientIP();
      console.log('📊 IP detection result:', ipResult);

      // Test comprehensive client info
      const clientInfo = await getClientInfo();
      console.log('📊 Client info result:', clientInfo);

      const testResult: IPTestResult = {
        ip: clientInfo.ip,
        method: clientInfo.detectionMethod,
        isValid: clientInfo.ip ? isValidIP(clientInfo.ip) : false,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp,
        error: ipResult.error
      };

      setResult(testResult);
      console.log('✅ IP detection test completed:', testResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ IP detection test failed:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          IP Detection Test
        </h2>
        
        <p className="text-gray-600 mb-6">
          This component tests the IP detection functionality for exam session security.
          Click the button below to test IP detection using multiple fallback methods.
        </p>

        <div className="mb-6">
          <Button
            onClick={testIPDetection}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing IP Detection...
              </>
            ) : (
              'Test IP Detection'
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">Test Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">IP Address</h4>
                <p className={`text-sm ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {result.ip || 'Not detected'}
                </p>
                {result.ip && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valid: {result.isValid ? 'Yes' : 'No'}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detection Method</h4>
                <p className="text-sm text-gray-700">
                  {result.method === 'api' ? 'External API' : 
                   result.method === 'fallback' ? 'Fallback Method' : 
                   'Failed'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">User Agent</h4>
                <p className="text-xs text-gray-600 break-all">
                  {result.userAgent.substring(0, 100)}...
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Timestamp</h4>
                <p className="text-sm text-gray-700">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {result.error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Warning</h4>
                <p className="text-sm text-yellow-700">{result.error}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Status</h4>
              <p className="text-sm text-blue-700">
                {result.isValid ? 
                  '✅ IP detection is working correctly and ready for exam sessions.' :
                  '⚠️ IP detection failed. Exam sessions will still work but without IP tracking.'
                }
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Method 1:</strong> Tries ipify.org (most reliable)</li>
            <li>• <strong>Method 2:</strong> Falls back to ipapi.co</li>
            <li>• <strong>Method 3:</strong> Uses httpbin.org as last resort</li>
            <li>• <strong>Method 4:</strong> Local API fallback for development</li>
            <li>• <strong>Validation:</strong> Validates IP format (IPv4/IPv6)</li>
            <li>• <strong>Retry:</strong> Automatically retries failed attempts</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default IPDetectionTest;
