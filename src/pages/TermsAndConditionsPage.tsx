import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, Shield, Users, Globe, Mail, Calendar, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const TermsAndConditionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ai-cream py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-ai-teal" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold text-ai-teal">Terms and Conditions</h1>
          <Button variant="ghost" onClick={() => window.print()} className="flex items-center space-x-2 text-ai-teal">
            <FileText className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>

        <Card className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Scale className="h-6 w-6 mr-3 text-ai-orange" /> Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to AI HR Saathi. These Terms and Conditions ("Terms") govern your use of our AI-powered HR management platform and services. By accessing or using our platform, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              These Terms constitute a legally binding agreement between you and AI HR Saathi. Please read them carefully before using our services.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-ai-orange" /> Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. You also agree to comply with all applicable laws and regulations.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You must be at least 18 years old to use our services</li>
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to use the platform only for lawful purposes</li>
            </ul>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-ai-orange" /> Service Description
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              AI HR Saathi provides an AI-powered HR management platform that enables:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Conducting automated interviews using artificial intelligence</li>
              <li>Voice-based interview sessions with real-time transcription</li>
              <li>Automated evaluation and scoring of candidate responses</li>
              <li>Generation of detailed interview reports and analytics</li>
              <li>Management of job descriptions and candidate profiles</li>
              <li>Integration with third-party recruitment tools and workflows</li>
            </ul>
          </section>

          {/* User Accounts and Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-ai-orange" /> User Accounts and Responsibilities
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Account Creation</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>You must provide accurate, current, and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>You are responsible for all activities under your account</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Prohibited Activities</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Attempting to gain unauthorized access to the platform</li>
                  <li>Interfering with or disrupting the platform's functionality</li>
                  <li>Using the platform for any illegal or unauthorized purpose</li>
                  <li>Sharing false, misleading, or fraudulent information</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data and Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-ai-orange" /> Data and Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>We collect and process interview data, voice recordings, and transcripts</li>
              <li>We implement appropriate security measures to protect your data</li>
              <li>We may use aggregated, anonymized data for platform improvement</li>
              <li>You retain ownership of your personal data and interview content</li>
              <li>We comply with applicable data protection laws and regulations</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-ai-orange" /> Intellectual Property
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Our Rights</h3>
                <p className="text-gray-700 leading-relaxed">
                  The AI HR Saathi platform, including its design, functionality, algorithms, and content, is protected by intellectual property laws. We retain all rights, title, and interest in our platform.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Your Rights</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of your personal data, interview responses, and any content you provide. By using our services, you grant us a limited license to process and analyze your data to provide our services.
                </p>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Globe className="h-6 w-6 mr-3 text-ai-orange" /> Service Availability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to provide reliable service, but we cannot guarantee uninterrupted access. We may:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Perform scheduled maintenance and updates</li>
              <li>Experience temporary service interruptions</li>
              <li>Modify or discontinue features with reasonable notice</li>
              <li>Suspend accounts that violate these Terms</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-ai-orange" /> Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, AI HR Saathi shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Loss of profits, data, or business opportunities</li>
              <li>Service interruptions or technical difficulties</li>
              <li>Decisions made based on AI-generated evaluations</li>
              <li>Third-party actions or content</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Our total liability shall not exceed the amount you paid for our services in the 12 months preceding the claim.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-ai-orange" /> Termination
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Either party may terminate this agreement at any time. We may suspend or terminate your account if you violate these Terms.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You may delete your account at any time</li>
              <li>We may suspend accounts for Terms violations</li>
              <li>Upon termination, your access to the platform will cease</li>
              <li>We will retain your data according to our data retention policy</li>
            </ul>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-ai-orange" /> Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of any material changes by email or through the platform. Your continued use of our services after such changes constitutes acceptance of the new Terms.
            </p>
            <p className="text-sm text-gray-500 mt-2">Last updated: October 3, 2025</p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Scale className="h-6 w-6 mr-3 text-ai-orange" /> Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles. Any disputes arising from these Terms shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Mail className="h-6 w-6 mr-3 text-ai-orange" /> Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Email: legal@ai-interviewer.com</li>
              <li>Address: [Your Company Address]</li>
              <li>Phone: [Your Contact Number]</li>
            </ul>
          </section>

          {/* Acknowledgment */}
          <section className="bg-ai-teal/10 border border-ai-teal/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ai-teal mb-4">Acknowledgment</h2>
            <p className="text-gray-700 leading-relaxed">
              By using AI HR Saathi, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. You also acknowledge that you have read and understood our Privacy Policy.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
