import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Mail, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TwoFactorAuthService } from '../services/twoFactorAuth';
import { useNavigate } from 'react-router-dom';

const TwoFactorSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      if (user?.email) {
        try {
          const enabled = await TwoFactorAuthService.isTwoFactorEnabled(user.email);
          setIsTwoFactorEnabled(enabled);
        } catch (error) {
          console.error('Error checking 2FA status:', error);
          setMessage({ type: 'error', text: 'Failed to check 2FA status' });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkTwoFactorStatus();
  }, [user]);

  const handleToggleTwoFactor = async () => {
    if (!user?.email) return;

    setActionLoading(true);
    setMessage(null);

    try {
      if (isTwoFactorEnabled) {
        // Disable 2FA
        const result = await TwoFactorAuthService.disableTwoFactor(user.email);
        if (result.success) {
          setIsTwoFactorEnabled(false);
          setMessage({ type: 'success', text: 'Two-factor authentication has been disabled' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to disable 2FA' });
        }
      } else {
        // Enable 2FA
        const result = await TwoFactorAuthService.enableTwoFactor(user.email);
        if (result.success) {
          setIsTwoFactorEnabled(true);
          setMessage({ type: 'success', text: 'Two-factor authentication has been enabled' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to enable 2FA' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
                  <p className="text-sm text-gray-600">Secure your account with an additional verification step</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${isTwoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isTwoFactorEnabled ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isTwoFactorEnabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isTwoFactorEnabled 
                    ? 'Your account is protected with an additional security layer'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleTwoFactor}
              disabled={actionLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isTwoFactorEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Processing...</span>
                </div>
              ) : isTwoFactorEnabled ? (
                'Disable 2FA'
              ) : (
                'Enable 2FA'
              )}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How it Works */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">How it Works</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <p className="text-sm text-gray-700">
                  Enter your email and password as usual
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <p className="text-sm text-gray-700">
                  We'll send a 6-digit code to your email
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <p className="text-sm text-gray-700">
                  Enter the code to complete your login
                </p>
              </div>
            </div>
          </div>

          {/* Security Benefits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Security Benefits</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Protects against password theft
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Prevents unauthorized access
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Industry-standard security practice
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Easy to use and manage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Information */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Email Verification</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              When 2FA is enabled, verification codes will be sent to:
            </p>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-500">
              Make sure you have access to this email address. Verification codes expire after 10 minutes.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-2">Important Security Notice</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Keep your email account secure and accessible</li>
                <li>• Never share verification codes with anyone</li>
                <li>• AI Interviewer will never ask for your verification code via phone or email</li>
                <li>• If you lose access to your email, contact support immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSettingsPage;
