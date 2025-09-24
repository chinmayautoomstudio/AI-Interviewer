import JDParserService from './jdParser';
import { JobDescriptionsService } from './jobDescriptions';

/**
 * Test the enhanced JD parser integration
 */
export class EnhancedParserTest {
  
  /**
   * Test the complete flow: parse job description and save to database
   */
  static async testCompleteFlow(): Promise<void> {
    console.log('🧪 Testing Enhanced JD Parser Integration...');
    
    const sampleJobDescription = `
Web Developer Trainee - TechCorp India
Location: Bhubaneswar, Odisha
Employment Type: Full-time
Experience: Entry-level

We are looking for a Web Developer Trainee to join our development team. This is an excellent opportunity for recent graduates or career changers to start their journey in web development.

Key Responsibilities:
• Develop and maintain web applications using modern technologies
• Collaborate with senior developers on various projects
• Learn and implement best practices in web development
• Participate in code reviews and team meetings
• Contribute to website content management and updates
• Assist in testing and debugging applications

Required Skills:
• Basic knowledge of HTML, CSS, and JavaScript
• Strong problem-solving abilities
• Excellent communication skills
• Eagerness to learn and grow
• Attention to detail

Preferred Skills:
• Familiarity with React.js framework
• Basic understanding of Node.js
• Knowledge of database concepts
• Experience with Git version control
• Understanding of responsive web design

Technical Stack:
• HTML5, CSS3, JavaScript (ES6+)
• React.js, Node.js, Express.js
• MongoDB/PostgreSQL
• Git, VS Code, Chrome DevTools

Education Requirements:
Bachelor's degree in Computer Science or related field preferred, but not mandatory for candidates with relevant experience.

Company Culture:
We offer a supportive and collaborative environment where learning is encouraged. Our team values innovation, knowledge sharing, and professional growth.

Growth Opportunities:
• Mentorship from senior developers
• Real-world project experience
• Professional development opportunities
• Career advancement paths
• Learning and development budget

Benefits:
• Health insurance coverage
• Flexible working hours
• Learning and development budget
• Team building activities
• Performance bonuses

Salary Range: ₹2.5L - ₹4L per annum

Contact: hr@techcorp.com
    `;

    try {
      // Step 1: Parse the job description
      console.log('📝 Step 1: Parsing job description...');
      const parserResponse = await JDParserService.parseJobDescription(sampleJobDescription);
      
      if (!parserResponse.success) {
        console.error('❌ Parser failed:', parserResponse.error);
        return;
      }
      
      console.log('✅ Parser successful!');
      console.log('📊 Parsed data structure:');
      console.log('- Job Title:', parserResponse.data?.job_title);
      console.log('- Department:', parserResponse.data?.department);
      console.log('- Location:', parserResponse.data?.location);
      console.log('- Experience Level:', parserResponse.data?.experience_level);
      console.log('- Employment Type:', parserResponse.data?.employment_type);
      console.log('- Work Mode:', parserResponse.data?.work_mode);
      console.log('- Key Responsibilities:', parserResponse.data?.key_responsibilities?.length, 'items');
      console.log('- Required Skills:', parserResponse.data?.required_skills?.length, 'items');
      console.log('- Preferred Skills:', parserResponse.data?.preferred_skills?.length, 'items');
      console.log('- Technical Stack:', parserResponse.data?.technical_stack?.length, 'items');
      console.log('- Benefits:', parserResponse.data?.benefits?.length, 'items');
      console.log('- Qualifications (Min):', parserResponse.data?.qualifications?.minimum?.length, 'items');
      console.log('- Qualifications (Pref):', parserResponse.data?.qualifications?.preferred?.length, 'items');
      
      // Step 2: Save to database
      console.log('\n💾 Step 2: Saving to database...');
      const saveResult = await JobDescriptionsService.createJobDescriptionFromParser(parserResponse);
      
      if (!saveResult.data) {
        console.error('❌ Database save failed:', saveResult.error);
        return;
      }
      
      console.log('✅ Database save successful!');
      console.log('📊 Saved job description:');
      console.log('- ID:', saveResult.data.id);
      console.log('- Job Description ID:', saveResult.data.job_description_id);
      console.log('- Title:', saveResult.data.title);
      console.log('- Status:', saveResult.data.status);
      console.log('- Created At:', saveResult.data.createdAt);
      
      // Step 3: Verify the data
      console.log('\n🔍 Step 3: Verifying saved data...');
      const verification = await JobDescriptionsService.getJobDescriptionById(saveResult.data.id);
      
      if (verification.data) {
        console.log('✅ Data verification successful!');
        console.log('📊 Verified fields:');
        console.log('- Enhanced fields present:', !!verification.data.key_responsibilities?.length);
        console.log('- Technical stack saved:', !!verification.data.technical_stack?.length);
        console.log('- Company culture saved:', !!verification.data.company_culture);
        console.log('- Growth opportunities saved:', !!verification.data.growth_opportunities);
      } else {
        console.error('❌ Data verification failed:', verification.error);
      }
      
      console.log('\n🎉 Enhanced JD Parser Integration Test Completed Successfully!');
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
    }
  }
  
  /**
   * Test just the parser without database operations
   */
  static async testParserOnly(): Promise<void> {
    console.log('🧪 Testing Enhanced JD Parser Only...');
    
    const sampleJD = `
Senior React Developer
Location: Remote
Employment Type: Full-time
Experience: 3+ years

We need a Senior React Developer to lead our frontend development team.

Responsibilities:
• Lead React.js development projects
• Mentor junior developers
• Implement best practices and code reviews

Requirements:
• 3+ years React experience
• Strong JavaScript skills
• Experience with Redux
• Leadership abilities

Salary: ₹8L - ₹12L per annum
    `;
    
    try {
      const result = await JDParserService.parseJobDescription(sampleJD);
      
      if (result.success) {
        console.log('✅ Parser test successful!');
        console.log('📊 Sample parsed data:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Parser test failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Parser test error:', error);
    }
  }
}

// Export for use in other files
export default EnhancedParserTest;
