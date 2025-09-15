// Script to add Web Developer Trainee Interview Agent to the database
// This script will add the new AI agent with the provided webhook URL

console.log('🤖 Adding Web Developer Trainee Interview Agent...\n');

console.log('📋 AI Agent Details:');
console.log('   Name: Web Developer Trainee Interview Agent');
console.log('   Type: Technical');
console.log('   Webhook: https://home.ausomemgr.com/webhook-test/e6419e21-dc9f-4095-b10e-1e5835a75fea');
console.log('   Job Categories: Web Development, Frontend Development, Backend Development, Full Stack Development, Trainee, Entry Level');
console.log('   Capabilities: Technical Assessment, Problem Solving, Code Review, Skill Evaluation, Learning Potential Assessment');
console.log('   Specializations: HTML/CSS, JavaScript, React, Node.js, Web Development Fundamentals, Trainee Development\n');

console.log('🔧 Setup Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the contents of sql/add_web_developer_trainee_agent.sql');
console.log('4. Run the script\n');

console.log('📝 Alternative: Manual Database Entry');
console.log('1. Go to Table Editor > ai_agents');
console.log('2. Click "Insert" > "Insert row"');
console.log('3. Fill in the following fields:');
console.log('   - name: Web Developer Trainee Interview Agent');
console.log('   - description: Specialized AI agent for conducting technical interviews for Web Developer Trainee positions. Focuses on assessing fundamental web development skills, problem-solving abilities, and learning potential. Capabilities: Technical Assessment, Problem Solving, Code Review, Skill Evaluation, Learning Potential Assessment. Specializations: HTML/CSS, JavaScript, React, Node.js, Web Development Fundamentals, Trainee Development.');
console.log('   - agent_type: technical');
console.log('   - job_categories: ["Web Development", "Frontend Development", "Backend Development", "Full Stack Development", "Trainee", "Entry Level"]');
console.log('   - n8n_webhook_url: https://home.ausomemgr.com/webhook-test/e6419e21-dc9f-4095-b10e-1e5835a75fea');
console.log('   - is_active: true');
console.log('   - created_by: (leave empty or use a valid UUID)');
console.log('4. Click "Save"\n');

console.log('✅ After adding the agent:');
console.log('1. The agent will appear in the AI Agents page');
console.log('2. It will be available for selection during interview scheduling');
console.log('3. It will be recommended for Web Developer Trainee job descriptions');
console.log('4. The webhook will be called when interviews are conducted\n');

console.log('🧪 Testing the Integration:');
console.log('1. Go to AI Agents page in your admin panel');
console.log('2. Verify the new agent appears in the list');
console.log('3. Schedule an interview for a Web Developer Trainee position');
console.log('4. Select this agent for the interview');
console.log('5. Start the interview to test the webhook integration\n');

console.log('📚 Integration Details:');
console.log('- The webhook will receive interview session data');
console.log('- It will use the AI Interview Agent prompt for question generation');
console.log('- It will conduct technical interviews focused on web development');
console.log('- It will assess candidates for trainee-level positions');
console.log('- It will generate interview reports and scores\n');
