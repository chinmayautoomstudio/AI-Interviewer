/**
 * Send-email API for Coolify deployment.
 * Same request/response contract as Netlify function netlify/functions/send-email.js
 * so the frontend can use REACT_APP_EMAIL_API_URL=/api/send-email when hosted on Coolify.
 */
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.options('/api/send-email', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.status(200).end();
});

app.post('/api/send-email', async (req, res) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

  try {
    const data = req.body;

    if (!data.to || !data.subject || !data.html) {
      return res.status(400).set(corsHeaders).json({
        success: false,
        error: 'Missing required fields: to, subject, html',
      });
    }

    const resendApiKey =
      process.env.RESEND_API_KEY || process.env.REACT_APP_RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Resend API key not found in environment variables');
      return res.status(500).set(corsHeaders).json({
        success: false,
        error:
          'Resend API key not configured. Add RESEND_API_KEY or REACT_APP_RESEND_API_KEY to your Coolify environment variables.',
      });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail =
      process.env.REACT_APP_FROM_EMAIL ||
      'AI HR Saathi <noreply@aihrsaathi.com>';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text || '',
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).set(corsHeaders).json({
        success: false,
        error: result.error.message || 'Failed to send email',
      });
    }

    return res.status(200).set(corsHeaders).json({
      success: true,
      messageId: result.data?.id,
    });
  } catch (error) {
    console.error('Send-email error:', error);
    return res.status(500).set(corsHeaders).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Email API listening on port ${PORT}`);
});
