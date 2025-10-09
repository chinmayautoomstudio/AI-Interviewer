import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  BookOpen, 
  Video, 
  FileText, 
  Users, 
  Mic, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Globe,
  Headphones,
  Shield
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const HelpSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqCategories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
    { id: 'interviews', name: 'Interviews', icon: Mic },
    { id: 'technical', name: 'Technical Issues', icon: Settings },
    { id: 'account', name: 'Account & Billing', icon: Users },
    { id: 'candidates', name: 'For Candidates', icon: Users }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create my first job description?',
      answer: 'To create a job description, go to the Job Descriptions page and click "Add New Job". You can either paste a job posting URL for AI parsing or manually enter the details. The AI will automatically extract key information like requirements, skills, and responsibilities.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'How do I schedule an interview with a candidate?',
      answer: 'Navigate to the Candidates page, select a candidate, and click "Schedule Interview". Choose the job description, set the interview duration, and the system will generate login credentials for the candidate.'
    },
    {
      id: 3,
      category: 'interviews',
      question: 'How does the AI interview process work?',
      answer: 'The AI conducts voice-based interviews using natural language processing. It asks relevant questions based on the job description, evaluates responses in real-time, and generates a comprehensive report with scores and recommendations.'
    },
    {
      id: 4,
      category: 'interviews',
      question: 'Can I customize the interview questions?',
      answer: 'Yes, you can customize questions by editing the job description requirements and skills. The AI will generate questions based on these specifications. You can also add specific questions in the job description.'
    },
    {
      id: 5,
      category: 'technical',
      question: 'What are the system requirements for conducting interviews?',
      answer: 'You need a modern web browser (Chrome, Firefox, Safari, or Edge), a stable internet connection, a working microphone, and speakers or headphones. We recommend using Chrome for the best experience.'
    },
    {
      id: 6,
      category: 'technical',
      question: 'Why is my microphone not working during interviews?',
      answer: 'Check your browser permissions for microphone access. Go to your browser settings and ensure the AI Interviewer site has permission to use your microphone. Also, check that no other applications are using your microphone.'
    },
    {
      id: 7,
      category: 'technical',
      question: 'The interview is not starting properly. What should I do?',
      answer: 'Try refreshing the page, clearing your browser cache, or using a different browser. Ensure you have a stable internet connection. If the issue persists, contact our support team.'
    },
    {
      id: 8,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot password?" on the login page and enter your email address. You will receive a password reset link via email. Follow the instructions in the email to create a new password.'
    },
    {
      id: 9,
      category: 'account',
      question: 'How do I update my company information?',
      answer: 'Go to Settings and update your profile information. You can change your company name, contact details, and other account settings from there.'
    },
    {
      id: 10,
      category: 'candidates',
      question: 'How do I access my interview as a candidate?',
      answer: 'Use the login credentials sent to your email. Go to the candidate login page, enter your username and password, and you will be directed to your interview dashboard.'
    },
    {
      id: 11,
      category: 'candidates',
      question: 'What should I do if I have technical issues during my interview?',
      answer: 'Ensure you have a quiet environment, stable internet connection, and working microphone. If you experience issues, try refreshing the page or contact the hiring team immediately.'
    },
    {
      id: 12,
      category: 'candidates',
      question: 'How long do interviews typically last?',
      answer: 'Interview duration varies by job role, typically ranging from 30-60 minutes. The exact duration will be specified when you receive your interview invitation.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const quickLinks = [
    {
      title: 'Getting Started Guide',
      description: 'Learn how to set up your first interview',
      icon: BookOpen,
      href: '#getting-started',
      color: 'ai-teal'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: Video,
      href: '#tutorials',
      color: 'ai-orange'
    },
    {
      title: 'Technical Requirements',
      description: 'Check system requirements and setup',
      icon: Settings,
      href: '#requirements',
      color: 'ai-coral'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: MessageCircle,
      href: '#contact',
      color: 'ai-teal'
    }
  ];

  const supportChannels = [
    {
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@ai-interviewer.com',
      icon: Mail,
      availability: '24/7',
      responseTime: 'Within 24 hours'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available on platform',
      icon: MessageCircle,
      availability: 'Mon-Fri, 9 AM - 6 PM',
      responseTime: 'Immediate'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with support',
      contact: '+1 (555) 123-4567',
      icon: Phone,
      availability: 'Mon-Fri, 9 AM - 5 PM',
      responseTime: 'Immediate'
    }
  ];

  return (
    <div className="min-h-screen bg-ai-cream py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-ai-teal" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold text-ai-teal">Help & Support</h1>
          <Button variant="ghost" onClick={() => window.print()} className="flex items-center space-x-2 text-ai-teal">
            <FileText className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>

        {/* Search and Quick Links */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Search */}
          <Card className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ai-teal flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Help Center
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help topics, questions, or issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <Card>
            <h2 className="text-xl font-semibold text-ai-teal mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Quick Links
            </h2>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-ai-cream transition-colors group"
                >
                  <div className={`p-2 rounded-lg bg-${link.color}/10 group-hover:bg-${link.color}/20 transition-colors`}>
                    <link.icon className={`h-4 w-4 text-${link.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{link.title}</p>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>

        {/* FAQ Categories */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-ai-teal mb-4 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Frequently Asked Questions
          </h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-ai-teal text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No FAQs found matching your search.</p>
                <p className="text-sm text-gray-500 mt-2">Try different keywords or browse all categories.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Support Channels */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-ai-teal mb-6 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-ai-teal/10 rounded-lg">
                    <channel.icon className="h-6 w-6 text-ai-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                    <p className="text-sm text-gray-600">{channel.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Contact:</span>
                    <span className="text-sm text-gray-600">{channel.contact}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{channel.availability}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">{channel.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Getting Started Guide */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-ai-teal mb-6 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Getting Started Guide
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-ai-teal font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Account</h3>
              <p className="text-sm text-gray-600">Sign up and set up your company profile</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-ai-teal font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Job Description</h3>
              <p className="text-sm text-gray-600">Create or import job descriptions for AI parsing</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-ai-teal font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Schedule Interview</h3>
              <p className="text-sm text-gray-600">Invite candidates and set up interview sessions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-ai-teal font-bold text-lg">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Results</h3>
              <p className="text-sm text-gray-600">Analyze AI-generated reports and make decisions</p>
            </div>
          </div>
        </Card>

        {/* Technical Requirements */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-ai-teal mb-6 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Technical Requirements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-ai-orange" />
                Browser Requirements
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Chrome 90+ (Recommended)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Firefox 88+</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Safari 14+</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Edge 90+</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-ai-orange" />
                Hardware Requirements
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Working microphone</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Speakers or headphones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Stable internet connection (5+ Mbps)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Quiet environment for interviews</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Additional Resources */}
        <Card>
          <h2 className="text-xl font-semibold text-ai-teal mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Additional Resources
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/terms-and-conditions" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <FileText className="h-8 w-8 text-ai-teal" />
              <div>
                <h3 className="font-semibold text-gray-900">Terms & Conditions</h3>
                <p className="text-sm text-gray-600">Read our terms of service</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
            
            <a href="/privacy-policy" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Shield className="h-8 w-8 text-ai-teal" />
              <div>
                <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                <p className="text-sm text-gray-600">Learn about data protection</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
            
            <a href="/disclaimer" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <AlertCircle className="h-8 w-8 text-ai-teal" />
              <div>
                <h3 className="font-semibold text-gray-900">Disclaimer</h3>
                <p className="text-sm text-gray-600">Important legal information</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HelpSupportPage;
