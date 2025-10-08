const { Resend } = require('resend');

exports.handler = async (event, context) => {
  console.log('Function called with method:', event.httpMethod);
  console.log('Environment variables available:', {
    hasResendKey: !!process.env.REACT_APP_RESEND_API_KEY,
    fromEmail: process.env.REACT_APP_FROM_EMAIL
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.to || !data.subject || !data.html) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
      };
    }

    // Check if API key is available
    if (!process.env.REACT_APP_RESEND_API_KEY) {
      console.error('Resend API key not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND') || key.includes('EMAIL')));
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Resend API key not configured. Please add REACT_APP_RESEND_API_KEY to your .env file and restart netlify dev.' 
        }),
      };
    }

    // Initialize Resend
    const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);
    console.log('Resend initialized successfully');

    // Send email
    console.log('Sending email to:', data.to);
    const result = await resend.emails.send({
      from: 'AI Interviewer <onboarding@resend.dev>', // Use Resend's default domain
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text || '',
    });
    console.log('Email send result:', result);

    if (result.error) {
      console.error('Resend error:', result.error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          error: result.error.message || 'Failed to send email' 
        }),
      };
    }

    console.log('Email sent successfully:', result.data);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        messageId: result.data?.id 
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: {
          name: error.name,
          code: error.code,
          stack: error.stack
        }
      }),
    };
  }
};
