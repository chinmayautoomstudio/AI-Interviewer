# AI Interviewer Platform

A modern, AI-powered interview platform that automates the recruitment process using live voice conversations with intelligent AI interviewers.

## 🚀 Features

- **Live AI Voice Interviews** - Real-time voice conversations with AI interviewers
- **Dynamic Question Generation** - Personalized questions based on job descriptions and candidate profiles
- **Automated Evaluation** - AI-powered candidate assessment and scoring
- **Admin Dashboard** - Comprehensive management interface for HR teams
- **Real-time Analytics** - Live interview monitoring and performance metrics
- **Secure Authentication** - Role-based access control for admins and candidates
- **Mobile Responsive** - Works seamlessly across all devices

## 🏗️ Architecture

- **Frontend**: React.js with TypeScript
- **Backend**: Supabase (PostgreSQL with real-time subscriptions)
- **AI/ML**: n8n workflows with voice agent integration
- **Audio**: WebRTC for real-time voice communication
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- n8n instance with configured workflows
- Modern web browser with WebRTC support

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-interviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_N8N_BASE_URL=https://your-n8n-instance.com
   REACT_APP_N8N_API_KEY=your-n8n-api-key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Configure Row Level Security policies
   - Set up storage buckets for resumes and recordings

5. **Configure n8n workflows**
   - Set up question generation workflow
   - Configure live interview workflow
   - Set up evaluation workflow
   - Configure webhook endpoints

6. **Start the development server**
   ```bash
   npm start
   ```

## 🗄️ Database Schema

The platform uses the following main tables:

- **admin_users** - Admin user accounts and roles
- **candidates** - Candidate profiles and information
- **interviews** - Interview sessions and scheduling
- **interview_results** - AI evaluation results and scores
- **job_descriptions** - Job postings and requirements
- **candidate_sessions** - Temporary candidate access tokens
- **workflow_status** - n8n workflow execution tracking

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Configure authentication settings
4. Set up storage buckets for file uploads
5. Configure real-time subscriptions

### n8n Workflow Setup

The platform integrates with n8n workflows for:

1. **Question Generation** - Analyzes job descriptions and resumes to generate personalized questions
2. **Live Interview** - Manages real-time voice conversations with AI
3. **Evaluation** - Processes interview transcripts and provides scoring

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `REACT_APP_N8N_BASE_URL` | n8n instance URL | Yes |
| `REACT_APP_N8N_API_KEY` | n8n API key | Yes |

## 🎯 Usage

### Admin Users

1. **Login** - Access the admin dashboard with your credentials
2. **Manage Candidates** - Add, edit, and track candidate information
3. **Schedule Interviews** - Set up interview sessions with candidates
4. **Monitor Progress** - View real-time interview status and results
5. **Review Results** - Analyze AI-generated evaluations and scores

### Candidates

1. **Receive Invitation** - Get email with unique interview link
2. **Audio Setup** - Test microphone and speaker functionality
3. **Live Interview** - Participate in AI-powered voice interview
4. **View Results** - Access interview feedback and scores

## 🔒 Security

- **Authentication** - Secure login with Supabase Auth
- **Authorization** - Role-based access control
- **Data Privacy** - GDPR and CCPA compliant
- **Encryption** - End-to-end encryption for voice recordings
- **Session Management** - Secure token-based sessions

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

1. Set up production Supabase project
2. Configure production n8n instance
3. Set up CDN for static assets
4. Configure SSL certificates
5. Set up monitoring and logging

## 📊 Performance

- **Page Load Time**: < 3 seconds
- **Audio Latency**: < 200ms
- **Concurrent Users**: 100+ interviews
- **Uptime**: 99.9% availability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added advanced analytics and reporting
- **v1.2.0** - Enhanced AI capabilities and multi-language support

## 🎉 Acknowledgments

- Built with React and TypeScript
- Powered by Supabase and n8n
- Styled with Tailwind CSS
- Icons by Lucide React and Heroicons