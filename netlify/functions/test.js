exports.handler = async (event, context) => {
  console.log('Test function called');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      success: true, 
      message: 'Test function is working!',
      timestamp: new Date().toISOString(),
      environment: {
        hasResendKey: !!process.env.REACT_APP_RESEND_API_KEY,
        fromEmail: process.env.REACT_APP_FROM_EMAIL
      }
    }),
  };
};