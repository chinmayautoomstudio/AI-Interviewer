import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  User, 
  Shield, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  Settings as SettingsIcon,
  Save,
  Edit,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  fullName: string;
  email: string;
  role: string;
  department: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.name || 'Chinmay Nayak',
    email: user?.email || 'chinmay.nayak@autoomstudio.com',
    role: 'Administrator',
    department: 'Engineering'
  });

  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>(profileData);

  const settingsTabs = [
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: User, 
      description: 'Manage your personal information'
    },
    { 
      id: 'security', 
      name: 'Security', 
      icon: Shield, 
      description: 'Two-factor authentication and security settings'
    },
    { 
      id: 'support', 
      name: 'Help & Support', 
      icon: HelpCircle, 
      description: 'Get help and contact support'
    },
    { 
      id: 'legal', 
      name: 'Legal', 
      icon: FileText, 
      description: 'Terms, Privacy Policy, and Disclaimer'
    }
  ];

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalProfileData(profileData);
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
  };

  const handleNavigateToPage = (path: string) => {
    navigate(path);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          <p className="text-gray-600">Update your personal details and preferences</p>
        </div>
        {!isEditing ? (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Profile updated successfully!</span>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="h-10 w-10 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{profileData.fullName}</h3>
          <p className="text-gray-600">{profileData.role} • {profileData.department}</p>
          <p className="text-sm text-gray-500">{profileData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          value={profileData.fullName}
          onChange={(value) => handleInputChange('fullName', value)}
          disabled={!isEditing}
          placeholder="Enter your full name"
        />
        <Input
          label="Email Address"
          value={profileData.email}
          onChange={(value) => handleInputChange('email', value)}
          disabled={!isEditing}
          placeholder="Enter your email"
          type="email"
        />
        <Input
          label="Role"
          value={profileData.role}
          onChange={(value) => handleInputChange('role', value)}
          disabled={!isEditing}
          placeholder="Enter your role"
        />
        <Input
          label="Department"
          value={profileData.department}
          onChange={(value) => handleInputChange('department', value)}
          disabled={!isEditing}
          placeholder="Enter your department"
        />
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-gray-600">Manage your account security and authentication</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleNavigateToPage('/settings/two-factor')}
            >
              Manage 2FA
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Password Settings</h3>
                <p className="text-gray-600">Change your account password</p>
              </div>
            </div>
            <Button variant="outline">
              Change Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
        <p className="text-gray-600">Get help, contact support, and access resources</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Help Center</h3>
                <p className="text-gray-600">Browse documentation, FAQs, and guides</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleNavigateToPage('/help')}
            >
              Visit Help Center
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">User Guide</h3>
                <p className="text-gray-600">Learn how to use AI HR Saathi effectively</p>
              </div>
            </div>
            <Button variant="outline">
              View Guide
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderLegalTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Legal Information</h2>
        <p className="text-gray-600">Access our terms, policies, and legal documents</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Terms and Conditions</h3>
                <p className="text-gray-600">Read our terms of service and usage policies</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleNavigateToPage('/terms-and-conditions')}
            >
              View Terms
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Privacy Policy</h3>
                <p className="text-gray-600">Learn how we protect and handle your data</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleNavigateToPage('/privacy-policy')}
            >
              View Privacy Policy
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Disclaimer</h3>
                <p className="text-gray-600">Important information about our services</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleNavigateToPage('/disclaimer')}
            >
              View Disclaimer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'support':
        return renderSupportTab();
      case 'legal':
        return renderLegalTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            {renderTabContent()}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;