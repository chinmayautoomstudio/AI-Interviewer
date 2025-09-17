#!/usr/bin/env node

/**
 * Update Webhook URL Script
 * Helps update the AI Agent webhook URL in the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateWebhookUrl() {
  console.log('🔍 Checking current AI Agent webhook URLs...');
  
  try {
    // Get all AI agents
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, name, n8n_webhook_url, is_active');
    
    if (error) {
      console.error('❌ Error fetching AI agents:', error);
      return;
    }
    
    console.log('📋 Current AI Agents:');
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Webhook URL: ${agent.n8n_webhook_url || 'Not set'}`);
      console.log(`   Active: ${agent.is_active ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Prompt for new webhook URL
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const newWebhookUrl = await new Promise((resolve) => {
      rl.question('🔗 Enter the new webhook URL: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!newWebhookUrl) {
      console.log('❌ No webhook URL provided');
      rl.close();
      return;
    }
    
    // Update all active AI agents
    const { data: updatedAgents, error: updateError } = await supabase
      .from('ai_agents')
      .update({ n8n_webhook_url: newWebhookUrl })
      .eq('is_active', true)
      .select('id, name, n8n_webhook_url');
    
    if (updateError) {
      console.error('❌ Error updating webhook URLs:', updateError);
    } else {
      console.log('✅ Successfully updated webhook URLs:');
      updatedAgents.forEach(agent => {
        console.log(`   ${agent.name}: ${agent.n8n_webhook_url}`);
      });
    }
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
updateWebhookUrl();
