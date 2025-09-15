-- Add AI Agent for Web Developer Trainee Interview
-- This script adds a new AI agent with the provided n8n webhook URL

-- Insert the new AI Agent for Web Developer Trainee Interview
INSERT INTO ai_agents (
    id,
    name,
    description,
    agent_type,
    job_categories,
    n8n_webhook_url,
    is_active,
    created_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Web Developer Trainee Interview Agent',
    'Specialized AI agent for conducting technical interviews for Web Developer Trainee positions. Focuses on assessing fundamental web development skills, problem-solving abilities, and learning potential. Capabilities: Technical Assessment, Problem Solving, Code Review, Skill Evaluation, Learning Potential Assessment. Specializations: HTML/CSS, JavaScript, React, Node.js, Web Development Fundamentals, Trainee Development.',
    'technical',
    ARRAY['Web Development', 'Frontend Development', 'Backend Development', 'Full Stack Development', 'Trainee', 'Entry Level'],
    'https://home.ausomemgr.com/webhook-test/e6419e21-dc9f-4095-b10e-1e5835a75fea',
    true,
    NULL,
    NOW(),
    NOW()
);

-- Verify the insertion
SELECT 
    id,
    name,
    description,
    agent_type,
    job_categories,
    n8n_webhook_url,
    is_active,
    created_by,
    created_at
FROM ai_agents 
WHERE name = 'Web Developer Trainee Interview Agent';

-- Show all active AI agents
SELECT 
    id,
    name,
    agent_type,
    job_categories,
    n8n_webhook_url,
    is_active,
    created_at
FROM ai_agents 
WHERE is_active = true
ORDER BY created_at DESC;

-- Success message
SELECT 'Web Developer Trainee Interview Agent added successfully!' as status;
