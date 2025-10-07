import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Shield, FileText, Users, Brain, Mic, BarChart3, Globe, Mail, Calendar, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const DisclaimerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ai-cream py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-ai-teal" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold text-ai-teal">Disclaimer</h1>
          <Button variant="ghost" onClick={() => window.print()} className="flex items-center space-x-2 text-ai-teal">
            <FileText className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>

        <Card className="space-y-8">
          {/* Important Notice */}
          <section className="bg-ai-orange/10 border border-ai-orange/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ai-orange mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3" /> Important Notice
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This disclaimer contains important information about the limitations and risks associated with using AI Interviewer. 
              Please read this disclaimer carefully before using our AI-powered interview platform.
            </p>
          </section>

          {/* General Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-ai-orange" /> General Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              AI Interviewer is an AI-powered interview platform designed to assist in the recruitment process. 
              However, users should understand the following important limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>The platform is provided "as is" without warranties of any kind</li>
              <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated evaluations</li>
              <li>Interview results should be used as supplementary information, not as the sole basis for hiring decisions</li>
              <li>Human judgment and additional assessment methods should always be employed</li>
              <li>Technical issues may affect platform availability and functionality</li>
            </ul>
          </section>

          {/* AI Technology Limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Brain className="h-6 w-6 mr-3 text-ai-orange" /> AI Technology Limitations
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Artificial Intelligence Limitations</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>AI evaluations may contain biases inherent in training data</li>
                  <li>Natural language processing may misinterpret context or nuance</li>
                  <li>Voice recognition accuracy may vary based on accent, background noise, or speech patterns</li>
                  <li>AI cannot fully replicate human emotional intelligence and cultural understanding</li>
                  <li>Technical limitations may affect real-time processing and response accuracy</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Evaluation Accuracy</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Scoring algorithms are based on statistical models and may not reflect individual circumstances</li>
                  <li>Interview performance may be affected by technical issues, nervousness, or environmental factors</li>
                  <li>AI cannot assess non-verbal cues, body language, or interpersonal chemistry</li>
                  <li>Cultural and linguistic differences may impact evaluation fairness</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Voice and Audio Technology */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Mic className="h-6 w-6 mr-3 text-ai-orange" /> Voice and Audio Technology
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our platform relies on voice recognition and audio processing technologies that have inherent limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Voice recognition accuracy depends on audio quality, microphone setup, and environmental conditions</li>
              <li>Background noise, echo, or poor internet connection may affect transcription quality</li>
              <li>Accents, dialects, or speech impediments may impact recognition accuracy</li>
              <li>Technical failures in audio processing may result in incomplete or inaccurate transcripts</li>
              <li>Users are responsible for ensuring adequate technical setup and internet connectivity</li>
            </ul>
          </section>

          {/* Data and Privacy Considerations */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-ai-orange" /> Data and Privacy Considerations
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Data Processing</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Interview recordings and transcripts are processed by AI systems and third-party services</li>
                  <li>Data may be transmitted over the internet and stored in cloud-based systems</li>
                  <li>While we implement security measures, absolute data security cannot be guaranteed</li>
                  <li>Users should not share sensitive personal information during interviews</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-ai-teal mb-2">Third-Party Services</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>We use third-party AI services, cloud providers, and voice processing technologies</li>
                  <li>These services have their own terms, privacy policies, and data handling practices</li>
                  <li>We are not responsible for the actions or policies of third-party service providers</li>
                  <li>Data may be subject to the laws and regulations of multiple jurisdictions</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Hiring Decision Responsibility */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-ai-orange" /> Hiring Decision Responsibility
            </h2>
            <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-ai-coral mb-3">Important Legal Notice</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>AI Interviewer is a tool, not a decision-maker.</strong> All hiring decisions remain the sole responsibility of the employer.</li>
                <li>Employers must comply with all applicable employment laws, including anti-discrimination regulations</li>
                <li>AI-generated evaluations should be reviewed by qualified human resources professionals</li>
                <li>Employers should implement additional assessment methods beyond AI interviews</li>
                <li>We do not provide legal advice regarding employment decisions or compliance requirements</li>
                <li>Users are responsible for ensuring their use of the platform complies with local employment laws</li>
              </ul>
            </div>
          </section>

          {/* Technical Limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <BarChart3 className="h-6 w-6 mr-3 text-ai-orange" /> Technical Limitations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users should be aware of the following technical limitations and requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Platform availability depends on internet connectivity and server maintenance</li>
              <li>Browser compatibility issues may affect functionality</li>
              <li>Mobile device performance may vary based on hardware capabilities</li>
              <li>System updates may temporarily affect platform availability</li>
              <li>Users are responsible for maintaining compatible hardware and software</li>
              <li>We reserve the right to modify or discontinue features without prior notice</li>
            </ul>
          </section>

          {/* Professional Use Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Info className="h-6 w-6 mr-3 text-ai-orange" /> Professional Use Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              AI Interviewer is designed for professional recruitment purposes. Users acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>The platform is not intended for personal or non-commercial use</li>
              <li>Users should have appropriate training in recruitment and employment practices</li>
              <li>Professional judgment should always supplement AI-generated insights</li>
              <li>Users are responsible for maintaining professional standards and ethical practices</li>
              <li>We do not provide training or certification in recruitment best practices</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-ai-orange" /> Limitation of Liability
            </h2>
            <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>To the maximum extent permitted by law, AI Interviewer shall not be liable for:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Any hiring decisions made based on AI-generated evaluations</li>
                <li>Loss of data, interviews, or candidate information due to technical failures</li>
                <li>Inaccurate transcriptions or misinterpretations of candidate responses</li>
                <li>Bias or discrimination that may occur in AI evaluations</li>
                <li>Legal consequences arising from employment decisions</li>
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of business opportunities or revenue</li>
              </ul>
            </div>
          </section>

          {/* Updates and Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-ai-orange" /> Updates and Changes
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This disclaimer may be updated periodically to reflect changes in our technology, services, or legal requirements. 
              Users are responsible for reviewing this disclaimer regularly. Continued use of the platform after changes 
              constitutes acceptance of the updated disclaimer.
            </p>
            <p className="text-sm text-gray-500 mt-2">Last updated: October 3, 2025</p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-ai-teal mb-4 flex items-center">
              <Mail className="h-6 w-6 mr-3 text-ai-orange" /> Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this disclaimer or need clarification on any points, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Email: legal@ai-interviewer.com</li>
              <li>Support: support@ai-interviewer.com</li>
              <li>Address: [Your Company Address]</li>
              <li>Phone: [Your Contact Number]</li>
            </ul>
          </section>

          {/* Acknowledgment */}
          <section className="bg-ai-teal/10 border border-ai-teal/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ai-teal mb-4">Acknowledgment</h2>
            <p className="text-gray-700 leading-relaxed">
              By using AI Interviewer, you acknowledge that you have read, understood, and agree to the limitations 
              and disclaimers outlined in this document. You understand that AI technology has inherent limitations 
              and that human judgment should always be employed in making important decisions.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default DisclaimerPage;
