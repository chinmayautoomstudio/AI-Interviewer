import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Globe, Mail, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-ai-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-ai-teal/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-ai-teal" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-ai-teal/10 rounded-lg">
                <Shield className="h-6 w-6 text-ai-teal" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-ai-teal">Privacy Policy</h1>
                <p className="text-gray-600">How we protect and handle your data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mb-8">
          <Card className="bg-ai-orange/5 border-ai-orange/20">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-ai-orange" />
              <div>
                <p className="font-medium text-ai-orange">Last Updated</p>
                <p className="text-sm text-gray-600">January 3, 2025</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Eye className="h-6 w-6" />
              <span>Introduction</span>
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At AI HR Saathi, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered 
              HR management platform and related services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our services, you agree to the collection and use of information in accordance with this policy. 
              If you do not agree with our policies and practices, please do not use our services.
            </p>
          </div>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Database className="h-6 w-6" />
              <span>Information We Collect</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Candidate Information:</strong> Name, email address, phone number, resume, skills, experience, and education details</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Interview Data:</strong> Audio recordings, transcripts, responses, and interview assessments</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Account Information:</strong> Login credentials, profile information, and usage preferences</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Usage Data:</strong> Pages visited, time spent, features used, and interaction patterns</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Cookies and Tracking:</strong> Session data, preferences, and analytics information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* How We Use Information */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <UserCheck className="h-6 w-6" />
              <span>How We Use Your Information</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Core Services</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Conduct AI-powered interviews and assessments</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Generate interview reports and evaluations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Match candidates with job opportunities</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Provide platform access and user management</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Improvement & Analytics</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Enhance AI models and interview algorithms</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Analyze usage patterns and platform performance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Develop new features and services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span>Ensure platform security and prevent fraud</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Security */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Lock className="h-6 w-6" />
              <span>Data Security & Protection</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Security Measures</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Encryption:</strong> All data encrypted in transit and at rest</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Access Controls:</strong> Role-based access and authentication</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Secure Infrastructure:</strong> Cloud-based security with regular audits</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Data Backup:</strong> Regular backups with disaster recovery</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>GDPR:</strong> European data protection regulations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>CCPA:</strong> California Consumer Privacy Act</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Industry Standards:</strong> SOC 2 Type II compliance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Regular Audits:</strong> Third-party security assessments</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Globe className="h-6 w-6" />
              <span>Information Sharing & Disclosure</span>
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-ai-teal/5 border border-ai-teal/20 rounded-lg">
                  <h3 className="font-semibold text-ai-teal mb-2">With Your Consent</h3>
                  <p className="text-gray-700 text-sm">When you explicitly authorize us to share your information with specific parties.</p>
                </div>
                
                <div className="p-4 bg-ai-orange/5 border border-ai-orange/20 rounded-lg">
                  <h3 className="font-semibold text-ai-orange mb-2">Service Providers</h3>
                  <p className="text-gray-700 text-sm">With trusted third-party service providers who assist in platform operations (AWS, Supabase, etc.).</p>
                </div>
                
                <div className="p-4 bg-ai-coral/5 border border-ai-coral/20 rounded-lg">
                  <h3 className="font-semibold text-ai-coral mb-2">Legal Requirements</h3>
                  <p className="text-gray-700 text-sm">When required by law, court order, or to protect our rights and safety.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <UserCheck className="h-6 w-6" />
              <span>Your Rights & Choices</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Rights</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Access:</strong> Request copies of your personal data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Correction:</strong> Update or correct inaccurate information</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Deletion:</strong> Request deletion of your personal data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-teal font-bold">•</span>
                    <span><strong>Portability:</strong> Export your data in a structured format</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Communication Preferences</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span><strong>Email Settings:</strong> Manage notification preferences</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span><strong>Marketing:</strong> Opt-out of promotional communications</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span><strong>Account Control:</strong> Update profile and privacy settings</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-ai-orange font-bold">•</span>
                    <span><strong>Data Processing:</strong> Object to certain data processing activities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Mail className="h-6 w-6" />
              <span>Contact Us</span>
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, your personal data, or wish to exercise your rights, 
                please contact us using the information below:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-ai-teal" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">privacy@ai-interviewer.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-ai-teal" />
                    <div>
                      <p className="font-medium text-gray-900">Website</p>
                      <p className="text-gray-600">www.ai-interviewer.com</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-ai-teal" />
                    <div>
                      <p className="font-medium text-gray-900">Data Protection Officer</p>
                      <p className="text-gray-600">dpo@ai-interviewer.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-5 w-5 text-ai-teal" />
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-gray-600">Within 30 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Policy Updates */}
        <Card className="mb-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-ai-teal flex items-center space-x-2">
              <Calendar className="h-6 w-6" />
              <span>Policy Updates</span>
            </h2>
            
            <div className="p-4 bg-ai-cream border border-ai-teal/20 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. We will notify you of any material changes 
                by posting the updated policy on our website and updating the "Last Updated" date.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Your continued use of our services after any changes constitutes acceptance of the updated policy.</strong>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <span>Print Policy</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
