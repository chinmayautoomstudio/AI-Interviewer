# 🤖 AI HR Saathi Platform

A comprehensive AI-powered HR management platform with intelligent interview capabilities, voice integration, resume parsing, and advanced candidate management features.

## ✨ Features

### 🎯 **Core Functionality**
- **AI-Powered Interviews**: Conduct intelligent interviews with customizable AI agents
- **Voice Integration**: Real-time voice conversations using ElevenLabs TTS/STT
- **Resume Parsing**: Advanced AI resume analysis with comprehensive candidate profiling
- **Job Description Parsing**: Intelligent JD analysis and matching
- **Candidate Management**: Complete candidate lifecycle management
- **Interview Scheduling**: Automated interview scheduling and management
- **Two-Factor Authentication**: Enhanced security with email-based 2FA
- **Candidate Reports**: Performance analytics and detailed interview reports

### 🚀 **Advanced Features**
- **Multi-Modal Interviews**: Text and voice interview modes
- **Real-time Chat**: Live interview conversations with AI agents
- **Voice Recording**: Audio capture and analysis for interview evaluation
- **Candidate Authentication**: Secure candidate login and dashboard
- **Admin Testing Interface**: Comprehensive testing tools for administrators
- **Voice Configuration**: Customizable AI voice settings and presets
- **Email Notifications**: Automated email communications for interviews and reports
- **Performance Analytics**: Detailed candidate performance tracking and reporting
- **Security Features**: Two-factor authentication and secure session management

## 🏗️ **Architecture**

### **Frontend**
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### **Backend**
- **Supabase** for database and authentication
- **n8n** for workflow automation
- **ElevenLabs** for voice processing
- **OpenAI/Claude** for AI analysis
- **Resend** for email communications
- **Netlify Functions** for serverless backend operations

### **Database**
- **PostgreSQL** (via Supabase)
- **Row Level Security** (RLS)
- **Real-time subscriptions**

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- n8n instance
- ElevenLabs API key

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/chinmayautoomstudio/AI-Interviewer.git
cd AI-Interviewer/ai-interviewer
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp env.example .env
```

4. **Configure environment variables**
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Workflow URLs
REACT_APP_N8N_RESUME_PARSER_WEBHOOK=your_resume_parser_webhook
REACT_APP_N8N_JD_PARSER_WEBHOOK=your_jd_parser_webhook
REACT_APP_N8N_INTERVIEW_WEBHOOK=your_interview_webhook
REACT_APP_N8N_CHAT_WEBHOOK=your_chat_webhook
REACT_APP_N8N_REPORT_WEBHOOK=your_report_webhook
REACT_APP_N8N_VOICE_WEBHOOK=your_voice_webhook

# ElevenLabs Configuration
REACT_APP_ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
REACT_APP_ELEVEN_LABS_DEFAULT_VOICE_ID=your_default_voice_id
REACT_APP_ELEVEN_LABS_DEFAULT_MODEL=eleven_multilingual_v2

# Voice Configuration
REACT_APP_DEFAULT_VOICE_PRESET=professional
REACT_APP_AUTO_VOICE_SELECTION=true

# Email Configuration (for 2FA and notifications)
REACT_APP_RESEND_API_KEY=your_resend_api_key
REACT_APP_COMPANY_NAME=AI HR Saathi
REACT_APP_FROM_EMAIL=noreply@updates.aihrsaathi.com
REACT_APP_SUPPORT_EMAIL=support@updates.aihrsaathi.com
REACT_APP_WEBSITE=https://aihrsaathi.com
```

5. **Database Setup**
```bash
# Run SQL scripts in Supabase SQL Editor
# See sql/README_DATABASE_SETUP.md for detailed instructions
# Important: Run create_2fa_verification_table.sql for 2FA functionality
```

6. **Start the application**
```bash
npm start
```

## 📁 **Project Structure**

```
ai-interviewer/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── interview/       # Interview-specific components
│   │   ├── layout/          # Layout components
│   │   ├── ui/              # Basic UI components
│   │   └── voice/           # Voice-related components
│   ├── pages/               # Application pages
│   ├── services/            # API and external service integrations
│   ├── types/               # TypeScript type definitions
│   ├── config/              # Configuration files
│   └── utils/               # Utility functions
├── sql/                     # Database migration scripts
├── n8n/                     # n8n workflow configurations
├── prompts/                 # AI prompts for analysis
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🔧 **Configuration**

### **Database Setup**
1. Create Supabase project
2. Run SQL migration scripts in order:
   - `sql/fix_interview_tables_step_by_step.sql`
   - `sql/add_candidate_auth_fields.sql`
   - `sql/add_summary_fields.sql`
   - `sql/create_2fa_verification_table.sql` (for 2FA functionality)

### **n8n Workflow Setup**
1. Import workflow JSON files from `n8n/` directory
2. Configure webhook URLs
3. Set up AI model integrations
4. Test workflow connections

### **Voice Configuration**
1. Get ElevenLabs API key
2. Configure voice presets in `src/config/voiceConfig.ts`
3. Test voice settings in admin panel

## 📚 **Documentation**

- [Database Setup Guide](sql/README_DATABASE_SETUP.md)
- [Voice Configuration Guide](VOICE_CONFIGURATION_GUIDE.md)
- [n8n Integration Setup](VOICE_N8N_SETUP_GUIDE.md)
- [Enhanced Resume Analyzer](docs/ENHANCED_RESUME_ANALYZER.md)
- [Summary Fields Integration](docs/SUMMARY_FIELDS_INTEGRATION.md)
- [Two-Factor Authentication Setup](TWO_FACTOR_AUTH_SETUP.md)
- [Candidate Paid Reports Feature](CANDIDATE_PAID_REPORTS_FEATURE.md)
- [Changelog Overview](CHANGELOG_OVERVIEW.md)

## 🎯 **Key Features Deep Dive**

### **AI Resume Analysis**
- **Enhanced Parsing**: Extracts structured data from resumes
- **Comprehensive Descriptions**: AI-generated candidate profiles
- **Skill Categorization**: Organized skill extraction and classification
- **Experience Analysis**: Career progression and leadership assessment

### **Voice Interview System**
- **Real-time Voice**: Bidirectional voice conversations
- **Voice Selection**: Multiple AI voice presets
- **Audio Recording**: Interview session recording
- **Transcription**: Speech-to-text conversion

### **Candidate Management**
- **Authentication**: Secure candidate login system with 2FA support
- **Dashboard**: Personalized candidate interface
- **Profile Management**: Complete candidate profile system
- **Application Tracking**: Job application status tracking
- **Performance Reports**: Detailed interview performance analytics
- **Paid Reports**: Premium candidate performance insights

## 🚀 **Deployment**

### **Frontend Deployment**
- **Netlify**: Primary deployment platform (auto-deploy from GitHub)
- **Vercel**: Alternative deployment option
- **GitHub Pages**: Free hosting option

### **Backend Services**
- **Supabase**: Database and authentication
- **n8n Cloud**: Workflow automation
- **ElevenLabs**: Voice processing
- **Resend**: Email communications and 2FA
- **Netlify Functions**: Serverless backend operations

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Supabase** for backend infrastructure
- **n8n** for workflow automation
- **ElevenLabs** for voice processing
- **OpenAI** for AI analysis capabilities
- **Resend** for email communications
- **Netlify** for deployment and serverless functions
- **React** and **TypeScript** communities

## 📞 **Support**

For support and questions:
- Create an issue in this repository
- Check the documentation in the `docs/` folder
- Review the setup guides for detailed instructions

---

**Built with ❤️ for modern HR management and AI-powered recruitment**

## 🔄 **Recent Updates**

### **v2.0 - AI HR Saathi Rebranding**
- **Complete rebranding** from "AI Interviewer" to "AI HR Saathi"
- **Enhanced security** with two-factor authentication (2FA)
- **Email communications** integration with Resend
- **Performance analytics** and detailed candidate reports
- **Code quality improvements** with ESLint warning cleanup
- **Bundle size optimization** and performance enhancements

### **Key Features Added**
- ✅ Two-Factor Authentication (2FA) with email verification
- ✅ Email notifications for interviews and reports
- ✅ Candidate performance analytics
- ✅ Enhanced security and session management
- ✅ Improved UI/UX with functional notifications and settings
- ✅ Comprehensive documentation and changelogs

### **Technical Improvements**
- ✅ Code quality cleanup (unused variables, imports)
- ✅ Bundle size optimization (39 bytes reduction)
- ✅ Build performance improvements
- ✅ Enhanced error handling and user experience
- ✅ Updated deployment configuration for Netlify